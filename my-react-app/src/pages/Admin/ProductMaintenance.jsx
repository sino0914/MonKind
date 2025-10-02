import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../services/api";
import GLBViewer from "../../components/GLBViewer";
import UVMapper from "../../components/UVMapper";

const ProductMaintenance = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tempPrintArea, setTempPrintArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'move', 'resize'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingProduct, setEditingProduct] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    category: "mug",
    price: 299,
    description: "",
    featured: false,
    isActive: true,
    type: "2D", // 新增：產品類型
  });

  // UV 測試圖片狀態
  const [uvTestImage, setUvTestImage] = useState(null);

  // 載入商品資料
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await API.products.getAll();
      setProducts(productsData);

      if (productsData.length > 0) {
        setSelectedProduct(productsData[0]);
        setTempPrintArea(
          productsData[0].printArea
            ? { ...productsData[0].printArea }
            : { x: 50, y: 50, width: 200, height: 150 }
        );
      }
    } catch (error) {
      console.error("載入商品失敗:", error);
      setError("載入商品資料失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 顯示提示訊息
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // 產品類型變更處理
  const handleProductTypeChange = async (newType) => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      const updatedProduct = { ...selectedProduct, type: newType };

      // 如果切換到3D模式，初始化3D資料
      if (newType === "3D" && !selectedProduct.model3D) {
        updatedProduct.model3D = {
          glbUrl: null,
          uvMapping: {
            defaultUV: { u: 0.5, v: 0.5, width: 0.4, height: 0.3 },
            availableUVs: [],
          },
          camera: {
            position: { x: 0, y: 0, z: 5 },
            target: { x: 0, y: 0, z: 0 },
          },
        };
      }

      await API.products.update(selectedProduct.id, updatedProduct);
      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      showNotification(`產品類型已更新為 ${newType}`);
    } catch (error) {
      console.error("更新產品類型失敗:", error);
      showNotification("更新產品類型失敗: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // 3D模型保存處理
  const handleSave3DModel = async () => {
    if (!selectedProduct || selectedProduct.type !== "3D") return;

    try {
      setSaving(true);
      await API.products.update(selectedProduct.id, selectedProduct);
      showNotification("3D模型設定已儲存！");

      handleSavePrintArea(); // 同步保存設計區範圍
    } catch (error) {
      console.error("儲存3D模型設定失敗:", error);
      showNotification("儲存失敗: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // 檢查localStorage使用情況的輔助函數
  const checkStorageUsage = () => {
    let totalSize = 0;
    const usage = {};

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = localStorage[key].length;
        totalSize += size;
        usage[key] = (size / 1024).toFixed(2) + "KB";
      }
    }

    const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log("📊 localStorage 使用情況:");
    console.log("總使用量:", totalMB + "MB");
    console.log("詳細使用量:", usage);

    // 估算可用空間（大多數瀏覽器限制為5-10MB）
    const estimatedLimitMB = 10;
    const remainingMB = (estimatedLimitMB - parseFloat(totalMB)).toFixed(2);
    console.log("剩餘空間:", remainingMB + "MB");

    return {
      totalMB: parseFloat(totalMB),
      remainingMB: parseFloat(remainingMB),
      usage,
    };
  };

  // GLB文件上傳處理 - 使用新的後端API
  const handleGLBUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      showNotification("正在上傳GLB文件...", "info");

      // 檢查文件類型
      if (
        !file.name.toLowerCase().endsWith(".glb") &&
        !file.name.toLowerCase().endsWith(".gltf")
      ) {
        throw new Error("只支援 GLB 或 GLTF 格式的 3D 模型文件");
      }

      // 使用後端API上傳GLB文件 (API會自動更新產品資料)
      const updatedProduct = await API.products.uploadGLB(
        selectedProduct.id,
        file
      );

      // 更新本地狀態
      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      showNotification(
        `3D模型上傳成功！文件大小: ${updatedProduct.model3D.fileSizeMB}MB`,
        "success"
      );
      console.log("GLB上傳成功:", updatedProduct);
    } catch (error) {
      console.error("GLB上傳失敗:", error);
      showNotification("GLB上傳失敗: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // 移除 GLB 模型
  const handleRemoveGLB = async () => {
    if (!selectedProduct || selectedProduct.type !== "3D") return;

    try {
      setSaving(true);

      const updatedProduct = {
        ...selectedProduct,
        model3D: {
          ...selectedProduct.model3D,
          glbUrl: null,
          fileName: null,
          fileSize: null,
          fileSizeMB: null,
          uploadedAt: null,
        },
      };

      await API.products.update(selectedProduct.id, updatedProduct);
      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      showNotification("3D模型已移除", "success");
    } catch (error) {
      console.error("移除GLB失敗:", error);
      showNotification("移除GLB失敗: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // UV映射變更處理
  const handleUVChange = (uvType, property, value) => {
    if (!selectedProduct || selectedProduct.type !== "3D") return;

    const updatedProduct = {
      ...selectedProduct,
      model3D: {
        ...selectedProduct.model3D,
        uvMapping: {
          ...selectedProduct.model3D.uvMapping,
          [uvType]: {
            ...selectedProduct.model3D.uvMapping[uvType],
            [property]: value,
          },
        },
      },
    };

    setSelectedProduct(updatedProduct);
    setProducts((prev) =>
      prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
    );
  };

  // 處理 UV 測試圖片變化
  const handleTestImageChange = (image) => {
    setUvTestImage(image);
  };

  // 自動調整設計區大小以符合上傳圖片比例（僅限3D產品）
  const autoAdjustPrintAreaForImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const imageWidth = img.width;
          const imageHeight = img.height;
          const imageRatio = imageWidth / imageHeight;

          // 設計區在400x400畫布內的最大可用範圍
          const maxAreaWidth = 400; // 留出一些邊距
          const maxAreaHeight = 400;

          let newWidth, newHeight;

          // 根據圖片比例計算設計區大小
          if (imageRatio > 1) {
            // 圖片寬度大於高度（橫向）
            newWidth = Math.min(maxAreaWidth, maxAreaWidth);
            newHeight = newWidth / imageRatio;

            // 確保高度不超過最大範圍
            if (newHeight > maxAreaHeight) {
              newHeight = maxAreaHeight;
              newWidth = newHeight * imageRatio;
            }
          } else {
            // 圖片高度大於寬度（縱向）或正方形
            newHeight = Math.min(maxAreaHeight, maxAreaHeight);
            newWidth = newHeight * imageRatio;

            // 確保寬度不超過最大範圍
            if (newWidth > maxAreaWidth) {
              newWidth = maxAreaWidth;
              newHeight = newWidth / imageRatio;
            }
          }

          // 計算居中位置
          const centerX = (400 - newWidth) / 2;
          const centerY = (400 - newHeight) / 2;

          // 更新設計區域
          const newPrintArea = {
            x: Math.max(0, centerX),
            y: Math.max(0, centerY),
            width: Math.round(newWidth),
            height: Math.round(newHeight)
          };

          console.log('自動調整設計區:', {
            originalSize: { width: imageWidth, height: imageHeight },
            ratio: imageRatio.toFixed(2),
            newPrintArea: newPrintArea
          });

          setTempPrintArea(newPrintArea);

          showNotification(
            `設計區域已自動調整至 ${newPrintArea.width}×${newPrintArea.height} (比例: ${imageRatio.toFixed(2)})`,
            "info"
          );

          resolve();
        } catch (error) {
          console.error('自動調整設計區失敗:', error);
          reject(error);
        }
      };

      img.onerror = () => {
        console.error('無法載入圖片進行尺寸分析');
        reject(new Error('無法載入圖片進行尺寸分析'));
      };

      // 載入圖片
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => {
        reject(new Error('無法讀取圖片文件'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProductSelect = (product) => {
    console.log(
      "Selecting product:",
      product.title,
      "mockupImage:",
      !!product.mockupImage
    );
    setSelectedProduct(product);
    setTempPrintArea(
      product.printArea
        ? { ...product.printArea }
        : { x: 50, y: 50, width: 200, height: 150 }
    );
    // 強制重新渲染以確保底圖正確顯示
    setTimeout(() => {
      setSelectedProduct({ ...product });
    }, 10);
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);

    const rect = e.currentTarget
      .closest(".canvas-container")
      .getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    setDragStart({
      x: ((e.clientX - rect.left) / canvasWidth) * 400,
      y: ((e.clientY - rect.top) / canvasHeight) * 400,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !tempPrintArea) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    const currentX = ((e.clientX - rect.left) / canvasWidth) * 400;
    const currentY = ((e.clientY - rect.top) / canvasHeight) * 400;

    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;

    if (dragType === "move") {
      const newX = Math.max(
        0,
        Math.min(400 - tempPrintArea.width, tempPrintArea.x + deltaX)
      );
      const newY = Math.max(
        0,
        Math.min(400 - tempPrintArea.height, tempPrintArea.y + deltaY)
      );

      setTempPrintArea((prev) => ({
        ...prev,
        x: parseFloat(newX.toFixed(1)),
        y: parseFloat(newY.toFixed(1)),
      }));
    } else if (dragType === "resize") {
      const newWidth = Math.max(
        50,
        Math.min(400 - tempPrintArea.x, tempPrintArea.width + deltaX)
      );
      const newHeight = Math.max(
        50,
        Math.min(400 - tempPrintArea.y, tempPrintArea.height + deltaY)
      );

      setTempPrintArea((prev) => ({
        ...prev,
        width: parseFloat(newWidth.toFixed(1)),
        height: parseFloat(newHeight.toFixed(1)),
      }));
    }

    setDragStart({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const handleSavePrintArea = async () => {
    if (!selectedProduct || !tempPrintArea) return;

    try {
      setSaving(true);
      setError(null);

      // 使用 API 保存設計區範圍
      const updatedProduct = await API.products.updatePrintArea(
        selectedProduct.id,
        tempPrintArea
      );

      // 更新本地狀態
      const updatedProducts = products.map((p) =>
        p.id === selectedProduct.id ? updatedProduct : p
      );

      setProducts(updatedProducts);
      setSelectedProduct(updatedProduct);

      showNotification("設計區範圍已成功儲存！");
      console.log("設計區範圍已保存:", tempPrintArea);
    } catch (error) {
      console.error("保存設計區失敗:", error);
      setError("保存失敗: " + error.message);
      showNotification("保存失敗: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPrintArea = async () => {
    try {
      setError(null);
      // 重新載入最後儲存的商品資料
      const savedProduct = await API.products.getById(selectedProduct.id);
      if (savedProduct && savedProduct.printArea) {
        setTempPrintArea({ ...savedProduct.printArea });
        showNotification("已重置為最後儲存的設計區範圍");
      } else {
        // 使用預設值
        setTempPrintArea({ x: 50, y: 50, width: 200, height: 150 });
        showNotification("已重置為預設設計區範圍");
      }
    } catch (error) {
      console.error("重置設計區失敗:", error);
      setError("重置失敗: " + error.message);
    }
  };

  // 新增商品
  const handleAddProduct = async () => {
    try {
      if (!newProduct.title.trim()) {
        showNotification("商品名稱不能為空", "error");
        return;
      }

      setSaving(true);
      const productData = {
        ...newProduct,
        image: `https://via.placeholder.com/300x300/cccccc/666666?text=${encodeURIComponent(
          newProduct.title
        )}`,
        mockupImage: null,
        contentImages: [], // 初始化內容圖片陣列
        printArea: { x: 50, y: 50, width: 200, height: 150 },
      };

      const createdProduct = await API.products.create(productData);
      const updatedProducts = await API.products.getAll();
      setProducts(updatedProducts);

      setNewProduct({
        title: "",
        category: "mug",
        price: 299,
        description: "",
        featured: false,
        isActive: true,
      });
      setShowAddModal(false);
      showNotification("商品新增成功！");
    } catch (error) {
      console.error("新增商品失敗:", error);
      showNotification("新增失敗: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // 切換商品啟用狀態
  const handleToggleActive = async (productId) => {
    try {
      const product = products.find((p) => p.id === productId);
      const updatedProduct = await API.products.update(productId, {
        isActive: !product.isActive,
      });

      const updatedProducts = products.map((p) =>
        p.id === productId ? updatedProduct : p
      );
      setProducts(updatedProducts);

      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(updatedProduct);
      }

      showNotification(`商品已${updatedProduct.isActive ? "啟用" : "停用"}`);
    } catch (error) {
      console.error("更新商品狀態失敗:", error);
      showNotification("更新失敗: " + error.message, "error");
    }
  };

  // 更新商品屬性
  const handleUpdateProduct = async (field, value) => {
    try {
      if (!selectedProduct) return;

      console.log(`Updating product ${selectedProduct.id} field: ${field}`);

      const updatedProduct = await API.products.update(selectedProduct.id, {
        [field]: value,
      });

      // 更新產品列表
      const updatedProducts = products.map((p) =>
        p.id === selectedProduct.id ? updatedProduct : p
      );
      setProducts(updatedProducts);

      // 更新選中的產品
      setSelectedProduct(updatedProduct);

      // 如果不是 mockupImage 欄位才顯示通知（避免重複通知）
      if (field !== "mockupImage") {
        showNotification("商品資料已更新");
      }

      console.log(`Product ${selectedProduct.id} updated successfully`);
      return updatedProduct;
    } catch (error) {
      console.error("更新商品失敗:", error);
      showNotification("更新失敗: " + error.message, "error");
      throw error;
    }
  };

  // 處理商品圖片上傳
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("開始上傳商品圖片:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // 檢查檔案類型
    if (!file.type.startsWith("image/")) {
      showNotification("請選擇圖片檔案", "error");
      return;
    }

    try {
      showNotification("正在處理圖片...", "info");

      let imageUrl;

      // 如果檔案太大，進行壓縮 (商品圖片用較小的尺寸)
      if (file.size > 500 * 1024) {
        // 大於 500KB 就壓縮
        console.log("商品圖片較大，開始壓縮...");
        imageUrl = await compressImage(file, 400, 400, 0.8); // 商品圖片用 400x400
        showNotification("圖片壓縮完成，正在上傳...", "info");
      } else {
        console.log("商品圖片較小，直接上傳");
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      await handleUpdateProduct("image", imageUrl);
      showNotification("圖片已更新", "success");

      // 清除 input 的值
      event.target.value = "";
    } catch (error) {
      console.error("商品圖片上傳失敗:", error);
      showNotification("圖片上傳失敗: " + error.message, "error");
    }
  };

  // 圖片壓縮函數
  const compressImage = (
    file,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8
  ) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // 計算新的尺寸，保持比例
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 繪製並壓縮圖片
        ctx.drawImage(img, 0, 0, width, height);

        // 轉換為 Base64，使用 JPEG 格式來獲得更好的壓縮率
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        console.log("圖片壓縮完成:", {
          originalSize: file.size,
          compressedSize: compressedDataUrl.length,
          compressionRatio:
            ((1 - compressedDataUrl.length / file.size) * 100).toFixed(1) + "%",
          newDimensions: `${width}x${height}`,
        });

        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // 處理底圖上傳
  const handleMockupImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log("開始上傳底圖:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    // 檢查檔案類型
    if (!file.type.startsWith("image/")) {
      console.error("檔案類型錯誤:", file.type);
      showNotification("請選擇圖片檔案 (JPG, PNG, GIF, WebP)", "error");
      return;
    }

    // 檢查是否有選中的產品
    if (!selectedProduct) {
      console.error("沒有選中的產品");
      showNotification("請先選擇要更新的商品", "error");
      return;
    }

    try {
      // 顯示處理中狀態
      showNotification("正在處理圖片...", "info");

      let imageUrl;

      // 如果檔案太大，進行壓縮
      if (file.size > 1 * 1024 * 1024) {
        // 大於 1MB 就壓縮
        console.log("檔案較大，開始壓縮...");

        // 根據檔案大小選擇不同的壓縮參數
        let maxWidth = 800,
          maxHeight = 800,
          quality = 0.8;

        if (file.size > 5 * 1024 * 1024) {
          // 大於 5MB
          maxWidth = 600;
          maxHeight = 600;
          quality = 0.6;
        } else if (file.size > 3 * 1024 * 1024) {
          // 大於 3MB
          maxWidth = 700;
          maxHeight = 700;
          quality = 0.7;
        }

        imageUrl = await compressImage(file, maxWidth, maxHeight, quality);
        showNotification("圖片壓縮完成，正在上傳...", "info");
      } else {
        // 小檔案直接讀取
        console.log("檔案較小，直接上傳");
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      console.log("圖片處理成功:", {
        productId: selectedProduct.id,
        finalSize: imageUrl.length,
        sizeMB: (imageUrl.length / 1024 / 1024).toFixed(2),
      });

      // 檢查 Base64 資料是否有效
      if (!imageUrl || !imageUrl.startsWith("data:image/")) {
        throw new Error("圖片資料格式無效");
      }

      // 檢查最終大小
      const finalSizeMB = imageUrl.length / 1024 / 1024;
      if (finalSizeMB > 3) {
        throw new Error(
          `處理後的圖片仍然太大 (${finalSizeMB.toFixed(2)}MB)，請使用更小的圖片`
        );
      }

      // 更新產品資料
      showNotification("正在儲存底圖...", "info");
      const result = await handleUpdateProduct("mockupImage", imageUrl);
      console.log("API 更新結果:", result);

      // 強制重新渲染以立即顯示新底圖
      const updatedProduct = { ...selectedProduct, mockupImage: imageUrl };
      setSelectedProduct(updatedProduct);

      // 更新產品列表中的資料
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, mockupImage: imageUrl } : p
        )
      );

      // 如果是3D產品，自動調整設計區大小以符合圖片比例
      if (selectedProduct.type === "3D") {
        await autoAdjustPrintAreaForImage(file);
      }

      showNotification("底圖已更新", "success");
      console.log("底圖上傳完成");

      // 清除 input 的值，讓同一個檔案可以重新上傳
      event.target.value = "";
    } catch (error) {
      console.error("底圖上傳失敗:", {
        error: error,
        message: error.message,
        stack: error.stack,
        productId: selectedProduct?.id,
      });

      let errorMessage = "底圖上傳失敗";
      if (
        error.message.includes("存儲空間不足") ||
        error.message.includes("quota")
      ) {
        errorMessage = "存儲空間不足，請嘗試使用更小的圖片或清除瀏覽器數據";
      } else if (error.message.includes("太大")) {
        errorMessage = error.message;
      } else if (error.message.includes("network")) {
        errorMessage = "網絡錯誤，請檢查連接";
      } else if (error.message) {
        errorMessage = `上傳失敗: ${error.message}`;
      }

      showNotification(errorMessage, "error");
    }
  };

  // 移除底圖
  const handleRemoveMockupImage = async () => {
    try {
      console.log("Removing mockup image");

      // 更新產品資料
      await handleUpdateProduct("mockupImage", null);

      // 強制重新渲染以立即移除底圖顯示
      const updatedProduct = { ...selectedProduct, mockupImage: null };
      setSelectedProduct(updatedProduct);

      // 更新產品列表中的資料
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, mockupImage: null } : p
        )
      );

      showNotification("底圖已移除");
      console.log("Mockup image removed successfully");
    } catch (error) {
      console.error("Mockup remove error:", error);
      showNotification("移除底圖失敗", "error");
    }
  };

  // 處理內容圖片上傳
  const handleContentImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const currentImages = selectedProduct.contentImages || [];
    if (currentImages.length + files.length > 10) {
      showNotification(
        `最多只能上傳 10 張圖片，目前已有 ${currentImages.length} 張`,
        "error"
      );
      return;
    }

    try {
      showNotification("正在處理圖片...", "info");

      const newImages = [];
      for (const file of files) {
        console.log("處理內容圖片:", file.name, file.size);

        // 檢查檔案類型
        if (!file.type.startsWith("image/")) {
          showNotification(`${file.name} 不是圖片檔案`, "error");
          continue;
        }

        // 壓縮圖片
        let imageUrl;
        if (file.size > 500 * 1024) {
          // 大於 500KB 就壓縮
          imageUrl = await compressImage(file, 600, 600, 0.8);
        } else {
          imageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        newImages.push(imageUrl);
      }

      if (newImages.length === 0) {
        showNotification("沒有有效的圖片", "error");
        return;
      }

      // 更新商品的內容圖片
      const updatedContentImages = [...currentImages, ...newImages];
      await handleUpdateProduct("contentImages", updatedContentImages);

      showNotification(`成功添加 ${newImages.length} 張內容圖片`, "success");

      // 清除 input
      event.target.value = "";
    } catch (error) {
      console.error("內容圖片上傳失敗:", error);
      showNotification("圖片上傳失敗: " + error.message, "error");
    }
  };

  // 移除指定的內容圖片
  const handleRemoveContentImage = async (index) => {
    try {
      const currentImages = selectedProduct.contentImages || [];
      const updatedImages = currentImages.filter((_, i) => i !== index);

      await handleUpdateProduct("contentImages", updatedImages);
      showNotification("圖片已移除", "success");
    } catch (error) {
      console.error("移除內容圖片失敗:", error);
      showNotification("移除圖片失敗", "error");
    }
  };

  // 調整內容圖片順序
  const handleMoveContentImage = async (fromIndex, toIndex) => {
    try {
      const currentImages = [...(selectedProduct.contentImages || [])];
      const [movedImage] = currentImages.splice(fromIndex, 1);
      currentImages.splice(toIndex, 0, movedImage);

      await handleUpdateProduct("contentImages", currentImages);
      showNotification("圖片順序已調整", "success");
    } catch (error) {
      console.error("調整圖片順序失敗:", error);
      showNotification("調整順序失敗", "error");
    }
  };

  // 載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入商品資料中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">載入失敗</p>
            <p>{error}</p>
          </div>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  // 沒有商品
  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">沒有找到商品資料</p>
          <button
            onClick={loadProducts}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                返回
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                📦 商品維護 - 設計區管理
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* 移除測試編輯器按鈕 */}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-bold">錯誤：</strong>
                <span className="block sm:inline">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Product List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">商品列表</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      點擊選擇要編輯的商品
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    ➕ 新增
                  </button>
                </div>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`rounded-md mb-2 transition-colors ${
                      selectedProduct?.id === product.id
                        ? "bg-blue-50 border-blue-200 border-2"
                        : "bg-white border-gray-100 border-b-2 hover:bg-gray-50"
                    } ${product.isActive === false ? "opacity-50" : ""}`}
                  >
                    <div
                      onClick={() => handleProductSelect(product)}
                      className="p-3 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded mr-3"
                        />
                        <div className="flex-1 min-w-0 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.title}
                              </p>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  product.type === "3D"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {product.type || "2D"}
                              </span>
                            </div>
                          </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(product.id);
                              }}
                              className={`absolute right-0 w-10 h-5 rounded-full transition-colors ${
                                product.isActive !== false
                                  ? "bg-green-500"
                                  : "bg-gray-300"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                  product.isActive !== false
                                    ? "translate-x-5"
                                    : "translate-x-0.5"
                                }`}
                              ></div>
                            </button>
                          <p className="text-xs text-gray-500">
                            {product.category} • NT$ {product.price}
                          </p>
                          <p className="text-xs text-gray-400">
                            {product.printArea
                              ? `${product.printArea.width}×${product.printArea.height}`
                              : "未設定"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        設計區編輯器
                      </h3>
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${
                          selectedProduct.type === "3D"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {selectedProduct.type || "2D"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedProduct.title}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {selectedProduct.type !== "3D" && (
                      <button
                        onClick={handleResetPrintArea}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                      >
                        ↶ 重置
                      </button>
                    )}

                    <button
                      onClick={
                        selectedProduct.type === "3D"
                          ? handleSave3DModel
                          : handleSavePrintArea
                      }
                      disabled={saving}
                      className={`px-3 py-2 text-sm rounded-md transition-colors ${
                        saving
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {saving ? "💾 儲存中..." : "💾 儲存"}
                    </button>
                  </div>
                </div>

                {/* 產品類型切換 */}
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-sm font-medium text-gray-700">
                    產品類型：
                  </span>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="2D"
                        checked={selectedProduct.type !== "3D"}
                        onChange={() => handleProductTypeChange("2D")}
                        className="mr-2"
                      />
                      2D 設計
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="3D"
                        checked={selectedProduct.type === "3D"}
                        onChange={() => handleProductTypeChange("3D")}
                        className="mr-2"
                      />
                      3D 設計
                    </label>
                  </div>
                </div>
              </div>
              {/* Canvas Area */}
              <div className="p-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  2D 商品底圖
                  {selectedProduct.mockupImage && (
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded ml-5">
                      ✓ 已設定
                    </span>
                  )}
                </h4>
                {/* === 2D 畫布 === */}
                <div className="flex justify-center">
                  <div
                    className="canvas-container w-96 h-96 border-2 border-gray-200 rounded-lg relative overflow-hidden bg-gray-50 cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* 底圖 */}
                    {selectedProduct.mockupImage ? (
                      <img
                        key={`mockup-${
                          selectedProduct.id
                        }-${selectedProduct.mockupImage.substring(0, 50)}`}
                        src={selectedProduct.mockupImage}
                        alt={`${selectedProduct.title} 底圖`}
                        className="w-full h-full object-contain pointer-events-none"
                        onError={(e) => {
                          console.error(
                            "Mockup image failed to load:",
                            selectedProduct.mockupImage
                          );
                          e.target.style.display = "none";
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "flex";
                          }
                        }}
                        onLoad={() => {
                          console.log("Mockup image loaded successfully");
                        }}
                      />
                    ) : null}

                    {/* Fallback */}
                    <div
                      key={`fallback-${selectedProduct.id}`}
                      className="absolute inset-0 bg-gray-50 border-2 border-dashed border-gray-300 rounded flex items-center justify-center"
                      style={{
                        display: selectedProduct.mockupImage ? "none" : "flex",
                      }}
                    >
                      <div className="text-center">
                        <div className="mb-3">
                          <svg
                            className="w-12 h-12 mx-auto text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-500 text-sm mb-1">
                          尚未設定底圖
                        </p>
                        <p className="text-gray-400 text-xs">
                          使用下方控制項上傳底圖
                        </p>
                      </div>
                    </div>

                    {/* 設計區 Overlay */}
                    {tempPrintArea && (
                      <div
                        className="absolute border-2 border-blue-500 border-solid bg-blue-50 bg-opacity-30"
                        style={{
                          left: `${(tempPrintArea.x / 400) * 100}%`,
                          top: `${(tempPrintArea.y / 400) * 100}%`,
                          width: `${(tempPrintArea.width / 400) * 100}%`,
                          height: `${(tempPrintArea.height / 400) * 100}%`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          設計區 {tempPrintArea.width.toFixed(1)}×
                          {tempPrintArea.height.toFixed(1)}
                        </div>

                        <div
                          className="absolute inset-0 cursor-move bg-blue-200 bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center"
                          onMouseDown={(e) => handleMouseDown(e, "move")}
                        >
                          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-75">
                            拖曳移動
                          </div>
                        </div>

                        <div
                          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize hover:bg-blue-600"
                          onMouseDown={(e) => handleMouseDown(e, "resize")}
                          style={{
                            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                          }}
                        />

                        <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full transform translate-x-1 -translate-y-1" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 translate-y-1" />
                      </div>
                    )}

                    {/* Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full">
                        <defs>
                          <pattern
                            id="grid"
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                          >
                            <path
                              d="M 20 0 L 0 0 0 20"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="0.5"
                            />
                          </pattern>
                        </defs>
                        <rect
                          width="100%"
                          height="100%"
                          fill="url(#grid)"
                          opacity="0.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 提示 */}
                <div className="mt-4 text-center text-sm text-gray-600">
                  <div className="space-y-1">
                    <p>
                      🖱️ <strong>點擊並拖曳</strong> 藍色區域來移動設計區位置
                    </p>
                    <p>
                      📏 <strong>拖曳右下角</strong> 來調整設計區大小
                    </p>
                    <p>💾 調整完成後點擊「儲存」按鈕保存變更</p>
                  </div>
                </div>

                {/* 底圖控制項 */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border mb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 上傳底圖 */}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMockupImageUpload}
                        className="hidden"
                        id="mockup-upload"
                      />
                      <label
                        htmlFor="mockup-upload"
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        {selectedProduct.mockupImage ? "更換底圖" : "上傳底圖"}
                      </label>
                    </div>

                    {/* 移除底圖 */}
                    {selectedProduct.mockupImage && (
                      <button
                        onClick={handleRemoveMockupImage}
                        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        移除底圖
                      </button>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-600 mb-1">
                          支援格式：
                        </p>
                        <p>JPG, PNG, GIF, WebP</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 mb-1">
                          檔案處理：
                        </p>
                        <p>系統會自動壓縮大圖片</p>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedProduct.type === "3D" && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 mt-10">
                      3D 商品模型
                      {selectedProduct.model3D?.glbUrl && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded ml-5">
                          ✓ 已設定
                        </span>
                      )}
                    </h4>
                    {/* === 3D 模型預覽與 UV === */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* GLB Viewer */}
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">
                            模型預覽
                          </h5>
                          {selectedProduct.model3D?.glbUrl ? (
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-300">
                              <GLBViewer
                                glbUrl={selectedProduct.model3D.glbUrl}
                                className="w-full h-full"
                                autoRotate={false}
                                uvMapping={selectedProduct.model3D?.uvMapping}
                                testTexture={uvTestImage}
                              />
                            </div>
                          ) : (
                            <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                              <p className="text-gray-500 text-sm">
                                請先上傳 GLB 文件
                              </p>
                            </div>
                          )}
                          <div className="mt-2 flex justify-between items-center text-xs text-gray-600">
                            <span>🎯 實時預覽</span>
                          </div>
                        </div>

                        {/* UV Mapper */}
                        <div>
                          <UVMapper
                            uvMapping={selectedProduct.model3D?.uvMapping}
                            onUVChange={handleUVChange}
                            onTestImageChange={handleTestImageChange}
                            showPreview={true}
                            className="h-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* === 3D 上傳區塊 === */}
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      {/* 隱藏的 file input */}
                      <input
                        type="file"
                        accept=".glb,.gltf"
                        onChange={handleGLBUpload}
                        className="hidden"
                        id="glb-upload"
                      />

                      {/* 上傳按鈕 */}
                      <div className="flex justify-center space-x-4 mb-4">
                        <label
                          htmlFor="glb-upload"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                        >
                          📁 選擇 GLB 文件
                        </label>

                        {/* 移除模型按鈕 - 只在已上傳模型時顯示 */}
                        {selectedProduct.model3D?.glbUrl && (
                          <button
                            onClick={handleRemoveGLB}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                          >
                            🗑️ 移除模型
                          </button>
                        )}
                      </div>

                      {/* 狀態顯示 */}
                      <div className="text-gray-500 text-sm">
                        支援 GLB 或 GLTF 格式的 3D 模型文件（最大 200MB）
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">商品資訊</h3>
                  <button
                    onClick={() => setEditingProduct(!editingProduct)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      editingProduct
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {editingProduct ? "完成編輯" : "✏️ 編輯"}
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* 商品圖片 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品主圖
                  </label>
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.title}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    {editingProduct && (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          📷 更換主圖
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          支援 JPG, PNG, GIF (最大 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 內容圖片 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    內容圖片
                    <span className="text-xs text-gray-500 ml-2">
                      ({selectedProduct.contentImages?.length || 0}/10)
                    </span>
                  </label>

                  {/* 圖片預覽區域 */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {selectedProduct.contentImages?.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`內容圖片 ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                        {editingProduct && (
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                              {/* 左移按鈕 */}
                              {index > 0 && (
                                <button
                                  onClick={() =>
                                    handleMoveContentImage(index, index - 1)
                                  }
                                  className="p-1 bg-white text-gray-700 rounded-full hover:bg-gray-100 text-xs"
                                  title="左移"
                                >
                                  ←
                                </button>
                              )}
                              {/* 右移按鈕 */}
                              {index <
                                (selectedProduct.contentImages?.length || 0) -
                                  1 && (
                                <button
                                  onClick={() =>
                                    handleMoveContentImage(index, index + 1)
                                  }
                                  className="p-1 bg-white text-gray-700 rounded-full hover:bg-gray-100 text-xs"
                                  title="右移"
                                >
                                  →
                                </button>
                              )}
                              {/* 刪除按鈕 */}
                              <button
                                onClick={() => handleRemoveContentImage(index)}
                                className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
                                title="刪除"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}

                    {/* 新增圖片按鈕 */}
                    {editingProduct &&
                      (selectedProduct.contentImages?.length || 0) < 10 && (
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleContentImageUpload}
                            className="hidden"
                            id="content-image-upload"
                            multiple
                          />
                          <label
                            htmlFor="content-image-upload"
                            className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                          >
                            <div className="text-center">
                              <div className="text-2xl text-gray-400">+</div>
                              <div className="text-xs text-gray-500">
                                新增圖片
                              </div>
                            </div>
                          </label>
                        </div>
                      )}
                  </div>

                  {/* 空狀態 */}
                  {(!selectedProduct.contentImages ||
                    selectedProduct.contentImages.length === 0) &&
                    !editingProduct && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                        <div className="text-gray-400 text-sm">
                          尚未添加內容圖片
                        </div>
                      </div>
                    )}

                  {/* 說明文字 */}
                  {editingProduct && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• 最多可上傳 10 張內容圖片</p>
                      <p>• 支援 JPG, PNG, GIF 格式，單張最大 5MB</p>
                      <p>• 可拖拽調整圖片順序</p>
                      <p>• 內容圖片將顯示在商品詳情頁</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品名稱
                  </label>
                  {editingProduct ? (
                    <input
                      type="text"
                      value={selectedProduct.title}
                      onChange={(e) =>
                        handleUpdateProduct("title", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {selectedProduct.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    類別
                  </label>
                  {editingProduct ? (
                    <select
                      value={selectedProduct.category}
                      onChange={(e) =>
                        handleUpdateProduct("category", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="mug">馬克杯</option>
                      <option value="tshirt">T恤</option>
                      <option value="bag">袋子</option>
                      <option value="bottle">水瓶</option>
                      <option value="pillow">抱枕</option>
                      <option value="notebook">筆記本</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900">
                      {selectedProduct.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    價格
                  </label>
                  {editingProduct ? (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">NT$</span>
                      <input
                        type="number"
                        value={selectedProduct.price}
                        onChange={(e) =>
                          handleUpdateProduct(
                            "price",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
                        min="0"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">
                      NT$ {selectedProduct.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品描述
                  </label>
                  {editingProduct ? (
                    <textarea
                      value={selectedProduct.description || ""}
                      onChange={(e) =>
                        handleUpdateProduct("description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                      placeholder="輸入商品描述..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {selectedProduct.description || "無描述"}
                    </p>
                  )}
                </div>

                {editingProduct && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedProduct.featured || false}
                        onChange={(e) =>
                          handleUpdateProduct("featured", e.target.checked)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        設為精選商品
                      </span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品狀態
                  </label>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        selectedProduct.isActive !== false
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                    <span className="text-sm text-gray-900">
                      {selectedProduct.isActive !== false ? "已啟用" : "已停用"}
                    </span>
                  </div>
                </div>

                {tempPrintArea && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        設計區屬性
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          X 座標
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempPrintArea.x.toFixed(1)}
                          onChange={(e) =>
                            setTempPrintArea((prev) => ({
                              ...prev,
                              x: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Y 座標
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempPrintArea.y.toFixed(1)}
                          onChange={(e) =>
                            setTempPrintArea((prev) => ({
                              ...prev,
                              y: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          寬度
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempPrintArea.width.toFixed(1)}
                          onChange={(e) =>
                            setTempPrintArea((prev) => ({
                              ...prev,
                              width: parseFloat(e.target.value) || 50,
                            }))
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          高度
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempPrintArea.height.toFixed(1)}
                          onChange={(e) =>
                            setTempPrintArea((prev) => ({
                              ...prev,
                              height: parseFloat(e.target.value) || 50,
                            }))
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      <p>• 座標系統：400×400 像素</p>
                      <p>• 左上角為原點 (0,0)</p>
                      <p>• 最小尺寸：50×50 像素</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 新增商品 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  新增商品
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品名稱 *
                  </label>
                  <input
                    type="text"
                    value={newProduct.title}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="輸入商品名稱"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    類別
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="mug">馬克杯</option>
                    <option value="tshirt">T恤</option>
                    <option value="bag">袋子</option>
                    <option value="bottle">水瓶</option>
                    <option value="pillow">抱枕</option>
                    <option value="notebook">筆記本</option>
                    <option value="phone_case">手機殼</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    產品類型
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="2D"
                        checked={newProduct.type === "2D"}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            type: e.target.value,
                          }))
                        }
                        className="mr-2"
                      />
                      2D 平面設計
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="3D"
                        checked={newProduct.type === "3D"}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            type: e.target.value,
                          }))
                        }
                        className="mr-2"
                      />
                      3D 立體設計
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    價格 (NT$)
                  </label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        price: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品描述
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="輸入商品描述"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newProduct.featured}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          featured: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">設為精選商品</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={saving || !newProduct.title.trim()}
                  className={`px-4 py-2 text-sm text-white rounded-md transition-colors ${
                    saving || !newProduct.title.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {saving ? "新增中..." : "新增商品"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 懸浮提示訊息 */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            notification.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          <div className="flex items-center">
            <div className="flex-1">
              <span className="text-sm font-medium">
                {notification.message}
              </span>
            </div>
            <div
              className={`ml-3 w-2 h-2 rounded-full bg-white animate-pulse`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMaintenance;
