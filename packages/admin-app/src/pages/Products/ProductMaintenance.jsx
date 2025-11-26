import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@monkind/shared/services/api";
import GLBViewer from "@monkind/shared/components/GLBViewer";
import UVMapper from "@monkind/shared/components/UVMapper";
import useCanvasViewport from "@monkind/shared/components/Editor/hooks/useCanvasViewport";
import Layout from "../../components/Layout";
import { useNotification } from "./hooks/useNotification";
import { useDesignArea } from "./hooks/useDesignArea";
import NotificationMessage from "./components/NotificationMessage";
import DesignAreaPreview from "./components/DesignAreaPreview";
import BleedAreaSettings from "./components/BleedAreaSettings";
import BackgroundImageUploader from "@monkind/shared/components/ProductMaintenance/components/BackgroundImageUploader";
import BleedAreaMappingEditor from "@monkind/shared/components/ProductMaintenance/components/BleedAreaMappingEditor";

const ProductMaintenance = () => {
  const navigate = useNavigate();

  // 使用通知 Hook
  const { notification, showNotification } = useNotification();

  // 使用設計區域 Hook
  const {
    tempPrintArea,
    setTempPrintArea,
    tempBleedArea,
    bleedMode,
    isDragging,
    dragType,
    updatePrintArea,
    resetPrintArea,
    enableBleedArea,
    disableBleedArea,
    toggleBleedMode,
    updateBleedArea,
    resetBleedArea,
    startDrag,
    stopDrag,
    handleDragMove,
  } = useDesignArea();

  // 使用畫布視窗控制 Hook（縮放/平移）
  const viewport = useCanvasViewport();

  // 追蹤目前視圖狀態（用於儲存）
  const [currentViewport, setCurrentViewport] = useState({
    zoom: 1.0,
    panX: 0,
    panY: 0,
  });

  // 其他狀態
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
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

  // 拖曳狀態 (由 hook 管理，但需要保留用於滑鼠事件)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 背景圖和映射配置狀態
  const [tempBackgroundImage, setTempBackgroundImage] = useState(null);
  const [tempBleedAreaMapping, setTempBleedAreaMapping] = useState(null);
  const [backgroundImageLoading, setBackgroundImageLoading] = useState(false);
  const [backgroundImageError, setBackgroundImageError] = useState(null);

  // 載入商品資料
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await API.products.getAll();
      setProducts(productsData);

      if (productsData.length > 0) {
        setSelectedProduct(productsData[0]);

        // 使用 hook 的 reset 函數初始化設計區域
        resetPrintArea(
          productsData[0].printArea || { x: 50, y: 50, width: 200, height: 150 }
        );

        // 使用 hook 的 reset 函數初始化出血區域
        resetBleedArea(productsData[0].bleedArea || null);

        // 初始化背景圖和映射配置
        setTempBackgroundImage(productsData[0].productBackgroundImage || null);
        setTempBleedAreaMapping(productsData[0].bleedAreaMapping || null);
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
      !!product.mockupImage,
      "defaultViewport:",
      product.defaultViewport
    );
    setSelectedProduct(product);

    // 使用 hook 的 reset 函數初始化設計區域和出血區域
    resetPrintArea(
      product.printArea || { x: 50, y: 50, width: 200, height: 150 }
    );
    resetBleedArea(product.bleedArea || null);

    // 載入該商品的預設視圖
    if (product.defaultViewport) {
      viewport.setViewport(product.defaultViewport);
      setCurrentViewport({
        zoom: product.defaultViewport.zoom ?? 1.0,
        panX: product.defaultViewport.panX ?? 0,
        panY: product.defaultViewport.panY ?? 0,
      });
    } else {
      // 如果沒有預設視圖，重置為預設值
      viewport.resetView();
      setCurrentViewport({ zoom: 1.0, panX: 0, panY: 0 });
    }

    // 強制重新渲染以確保底圖正確顯示
    setTimeout(() => {
      setSelectedProduct({ ...product });
    }, 10);
  };

  const handleMouseDown = (e, type) => {
    e.preventDefault();

    const rect = e.currentTarget
      .closest(".canvas-container")
      .getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    const startPos = {
      x: ((e.clientX - rect.left) / canvasWidth) * 400,
      y: ((e.clientY - rect.top) / canvasHeight) * 400,
    };

    setDragStart(startPos);
    startDrag(type, startPos);
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

      updatePrintArea({
        x: parseFloat(newX.toFixed(1)),
        y: parseFloat(newY.toFixed(1)),
      });
    } else if (dragType === "resize") {
      const newWidth = Math.max(
        50,
        Math.min(400 - tempPrintArea.x, tempPrintArea.width + deltaX)
      );
      const newHeight = Math.max(
        50,
        Math.min(400 - tempPrintArea.y, tempPrintArea.height + deltaY)
      );

      updatePrintArea({
        width: parseFloat(newWidth.toFixed(1)),
        height: parseFloat(newHeight.toFixed(1)),
      });
    }

    setDragStart({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    stopDrag();
  };

  // 處理背景圖上傳
  const handleBackgroundImageUpload = async (file) => {
    if (!selectedProduct || !file) return;

    try {
      setBackgroundImageLoading(true);
      setBackgroundImageError(null);

      // 上傳背景圖
      const uploadResult = await API.upload.image(file);

      const backgroundImageData = {
        url: uploadResult.url,
        uploadedAt: new Date().toISOString(),
        fileInfo: {
          filename: uploadResult.filename,
          originalName: file.name,
          size: file.size,
          sizeMB: (file.size / 1024 / 1024).toFixed(2)
        }
      };

      setTempBackgroundImage(backgroundImageData);
      showNotification("背景圖上傳成功！");
    } catch (error) {
      console.error("上傳背景圖失敗:", error);
      setBackgroundImageError("上傳失敗: " + error.message);
      showNotification("背景圖上傳失敗: " + error.message, "error");
    } finally {
      setBackgroundImageLoading(false);
    }
  };

  // 處理背景圖刪除
  const handleBackgroundImageDelete = () => {
    setTempBackgroundImage(null);
    showNotification("背景圖已刪除");
  };

  // 處理映射配置變更
  const handleBleedAreaMappingChange = (mapping) => {
    setTempBleedAreaMapping(mapping);
  };

  // 保存背景圖和映射配置
  const handleSaveBackgroundConfig = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      setError(null);

      const updateData = {};

      // 添加背景圖配置
      if (tempBackgroundImage !== selectedProduct.productBackgroundImage) {
        updateData.productBackgroundImage = tempBackgroundImage;
      }

      // 添加映射配置
      if (tempBleedAreaMapping !== selectedProduct.bleedAreaMapping) {
        updateData.bleedAreaMapping = tempBleedAreaMapping;
      }

      if (Object.keys(updateData).length === 0) {
        showNotification("沒有需要保存的變更");
        return;
      }

      const updatedProduct = await API.products.update(
        selectedProduct.id,
        updateData
      );

      // 更新本地狀態
      const updatedProducts = products.map((p) =>
        p.id === selectedProduct.id ? updatedProduct : p
      );

      setProducts(updatedProducts);
      setSelectedProduct(updatedProduct);
      setTempBackgroundImage(updatedProduct.productBackgroundImage || null);
      setTempBleedAreaMapping(updatedProduct.bleedAreaMapping || null);

      showNotification("背景圖配置已成功儲存！");
    } catch (error) {
      console.error("保存背景圖配置失敗:", error);
      setError("保存失敗: " + error.message);
      showNotification("保存失敗: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrintArea = async () => {
    if (!selectedProduct || !tempPrintArea) return;

    try {
      setSaving(true);
      setError(null);

      // 準備更新資料（包含設計區和出血區域）
      const updateData = {
        printArea: tempPrintArea,
        bleedArea: tempBleedArea
      };

      // 使用 API 保存設計區範圍和出血區域
      const updatedProduct = await API.products.update(
        selectedProduct.id,
        updateData
      );

      // 更新本地狀態
      const updatedProducts = products.map((p) =>
        p.id === selectedProduct.id ? updatedProduct : p
      );

      setProducts(updatedProducts);
      setSelectedProduct(updatedProduct);

      showNotification("設計區範圍和出血區域已成功儲存！");
      console.log("設計區範圍已保存:", tempPrintArea);
      console.log("出血區域已保存:", tempBleedArea);
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

  // 處理視圖變更（從 DesignAreaPreview 傳回）
  const handleViewportChange = useCallback((newViewport) => {
    setCurrentViewport(newViewport);
  }, []);

  // 儲存預設視圖
  const handleSaveDefaultViewport = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        defaultViewport: {
          zoom: currentViewport.zoom,
          panX: currentViewport.panX,
          panY: currentViewport.panY,
        },
      };

      const updatedProduct = await API.products.update(
        selectedProduct.id,
        updateData
      );

      // 更新本地狀態
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? updatedProduct : p
        )
      );
      setSelectedProduct(updatedProduct);

      showNotification(
        `預設視圖已儲存！(縮放: ${Math.round(currentViewport.zoom * 100)}%, 平移: ${Math.round(currentViewport.panX)}, ${Math.round(currentViewport.panY)})`
      );
      console.log("預設視圖已保存:", updateData.defaultViewport);
    } catch (error) {
      console.error("儲存預設視圖失敗:", error);
      setError("儲存失敗: " + error.message);
      showNotification("儲存預設視圖失敗: " + error.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // 重置視圖為預設值
  const handleResetViewport = () => {
    viewport.resetView();
    setCurrentViewport({ zoom: 1.0, panX: 0, panY: 0 });
    showNotification("視圖已重置為預設值 (100%)");
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
      showNotification("正在上傳底圖...", "info");

      // 上傳圖片到伺服器
      const uploadResult = await API.upload.image(file);

      if (!uploadResult || !uploadResult.url) {
        throw new Error("上傳失敗：伺服器回應無效");
      }

      // 組合完整 URL（加上伺服器 base URL）
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
      const baseUrl = API_BASE_URL.replace('/api', '');
      const imageUrl = `${baseUrl}${uploadResult.url}`;
      console.log("底圖已上傳到伺服器:", imageUrl);

      // 更新產品資料 - 儲存到 mockupImage 欄位
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
      if (error.message.includes("network")) {
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
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入商品資料中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
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
      </Layout>
    );
  }

  // 沒有商品
  if (!selectedProduct) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
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
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 -m-6 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">商品維護</h1>
          <p className="text-gray-500 text-sm">管理商品資訊與設計區範圍</p>
        </div>

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

        {/* 商品選擇下拉式選單 + 新增按鈕 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇商品
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === parseInt(e.target.value));
                  if (product) handleProductSelect(product);
                }}
                className="w-full px-4 py-2.5 text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} ({product.type || "2D"}) - NT$ {product.price} {product.isActive === false ? '(已停用)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="pt-7">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
              >
                ➕ 新增商品
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Main Content Area - 全寬顯示 */}
          <div className="col-span-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左側：設計區編輯器 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        設計區編輯器
                      </h3>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          selectedProduct.type === "3D"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {selectedProduct.type || "2D"}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {selectedProduct.type !== "3D" && (
                        <button
                          onClick={handleResetPrintArea}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
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
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          saving
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {saving ? "儲存中..." : "💾 儲存"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Canvas Area */}
                <div className="p-5">
                  {/* 產品類型切換 */}
                  <div className="flex items-center justify-center space-x-4 mb-4 pb-4 border-b border-gray-200">
                    <span className="text-xs font-medium text-gray-700">
                      產品類型：
                    </span>
                    <div className="flex space-x-3">
                      <label className="flex items-center text-sm">
                        <input
                          type="radio"
                          value="2D"
                          checked={selectedProduct.type !== "3D"}
                          onChange={() => handleProductTypeChange("2D")}
                          className="mr-1.5"
                        />
                        2D
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="radio"
                          value="3D"
                          checked={selectedProduct.type === "3D"}
                          onChange={() => handleProductTypeChange("3D")}
                          className="mr-1.5"
                        />
                        3D
                      </label>
                    </div>
                  </div>

                  {/* === 2D 畫布 === */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">
                        2D 商品底圖
                      </h4>
                      {selectedProduct.mockupImage && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded font-medium">
                          ✓ 已設定
                        </span>
                      )}
                    </div>
                    <DesignAreaPreview
                      product={selectedProduct}
                      tempPrintArea={tempPrintArea}
                      tempBleedArea={tempBleedArea}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      viewport={viewport}
                      onViewportChange={handleViewportChange}
                    />
                </div>

                  {/* 預設視圖控制按鈕 */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-semibold text-purple-800">預設視圖設定</h5>
                      <span className="text-xs text-purple-600">
                        目前: {Math.round(currentViewport.zoom * 100)}%
                        {(currentViewport.panX !== 0 || currentViewport.panY !== 0) &&
                          ` (${Math.round(currentViewport.panX)}, ${Math.round(currentViewport.panY)})`
                        }
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleSaveDefaultViewport}
                        disabled={saving}
                        className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded transition-all ${
                          saving
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        }`}
                      >
                        📷 儲存為預設視圖
                      </button>
                      <button
                        onClick={handleResetViewport}
                        className="flex items-center justify-center px-3 py-2 text-xs font-medium text-purple-700 bg-white border border-purple-300 rounded hover:bg-purple-50 transition-all"
                      >
                        ↶ 重置視圖
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-purple-600">
                      🖱️ 滾輪縮放 | 中鍵拖曳平移 | 儲存後使用者進入編輯器會套用此視圖
                    </p>
                  </div>

                  {/* 提示 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="space-y-1 text-xs text-gray-700">
                      <p>🖱️ <strong>拖曳</strong>藍色區域移動 | 📏 <strong>右下角</strong>調整大小</p>
                    </div>
                  </div>

                  {/* 底圖控制項 */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h5 className="text-xs font-semibold text-gray-900 mb-3">底圖管理</h5>
                    <div className="grid grid-cols-2 gap-2">
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
                        className="flex items-center justify-center w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer transition-all"
                      >
                        <svg
                          className="w-3 h-3 mr-1"
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
                        {selectedProduct.mockupImage ? "更換" : "上傳"}
                      </label>
                    </div>

                    {/* 移除底圖 */}
                    {selectedProduct.mockupImage && (
                      <button
                        onClick={handleRemoveMockupImage}
                        className="flex items-center justify-center w-full px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-all"
                      >
                        <svg
                          className="w-3 h-3 mr-1"
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
                        移除
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">支援 JPG, PNG, GIF, WebP</p>
                </div>

                {/* === 背景圖映射配置 (2D 專用) === */}
                {selectedProduct.type === "2D" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      背景圖映射配置
                      {tempBackgroundImage && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded ml-3">
                          ✓ 已配置
                        </span>
                      )}
                    </h4>

                    {/* 背景圖上傳器 */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <BackgroundImageUploader
                        backgroundImage={tempBackgroundImage}
                        onUpload={handleBackgroundImageUpload}
                        onDelete={handleBackgroundImageDelete}
                        loading={backgroundImageLoading}
                        error={backgroundImageError}
                      />
                    </div>

                    {/* 出血區映射編輯器 */}
                    {tempBackgroundImage && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <BleedAreaMappingEditor
                          product={selectedProduct}
                          initialMapping={tempBleedAreaMapping}
                          onMappingChange={handleBleedAreaMappingChange}
                        />
                      </div>
                    )}

                    {/* 保存按鈕 */}
                    <button
                      onClick={handleSaveBackgroundConfig}
                      disabled={saving}
                      className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        saving
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {saving ? "保存中..." : "💾 保存背景圖配置"}
                    </button>
                  </div>
                )}

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

              {/* 右側：商品資訊 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">商品資訊</h3>
                    <button
                      onClick={() => setEditingProduct(!editingProduct)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        editingProduct
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {editingProduct ? "完成" : "✏️ 編輯"}
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
                {/* 商品圖片 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    商品主圖
                  </label>
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.title}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    {editingProduct && (
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer inline-block px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          📷 更換
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* 內容圖片 */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    內容圖片
                    <span className="text-xs text-gray-500 ml-2 font-normal">
                      ({selectedProduct.contentImages?.length || 0}/10)
                    </span>
                  </label>

                  {/* 圖片預覽區域 */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
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

                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    商品名稱
                  </label>
                  {editingProduct ? (
                    <input
                      type="text"
                      value={selectedProduct.title}
                      onChange={(e) =>
                        handleUpdateProduct("title", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {selectedProduct.title}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    類別
                  </label>
                  {editingProduct ? (
                    <select
                      value={selectedProduct.category}
                      onChange={(e) =>
                        handleUpdateProduct("category", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    價格
                  </label>
                  {editingProduct ? (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2">NT$</span>
                      <input
                        type="number"
                        value={selectedProduct.price}
                        onChange={(e) =>
                          handleUpdateProduct(
                            "price",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
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
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    商品描述
                  </label>
                  {editingProduct ? (
                    <textarea
                      value={selectedProduct.description || ""}
                      onChange={(e) =>
                        handleUpdateProduct("description", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all"
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
                  <div className="flex items-center justify-between">
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
                    {editingProduct && (
                      <button
                        onClick={() => handleToggleActive(selectedProduct.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          selectedProduct.isActive !== false
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {selectedProduct.isActive !== false ? "停用商品" : "啟用商品"}
                      </button>
                    )}
                  </div>
                </div>

                {tempPrintArea && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-900 mb-3">
                      設計區屬性
                    </h4>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          X
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempPrintArea.x.toFixed(1)}
                          onChange={(e) =>
                            updatePrintArea({ x: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Y
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempPrintArea.y.toFixed(1)}
                          onChange={(e) =>
                            updatePrintArea({ y: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          寬
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempPrintArea.width.toFixed(1)}
                          onChange={(e) =>
                            updatePrintArea({ width: parseFloat(e.target.value) || 50 })
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          高
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={tempPrintArea.height.toFixed(1)}
                          onChange={(e) =>
                            updatePrintArea({ height: parseFloat(e.target.value) || 50 })
                          }
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 出血區域設定 */}
                <BleedAreaSettings
                  tempBleedArea={tempBleedArea}
                  bleedMode={bleedMode}
                  onToggleEnable={() => {
                    if (tempBleedArea) {
                      disableBleedArea();
                      showNotification("已停用出血區域");
                    } else {
                      enableBleedArea();
                      showNotification("已啟用出血區域（預設3px）");
                    }
                  }}
                  onModeChange={(mode) => {
                    toggleBleedMode(mode);
                  }}
                  onValueChange={(updates) => {
                    updateBleedArea(updates);
                  }}
                />
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
      <NotificationMessage notification={notification} />
      </div>
    </Layout>
  );
};

export default ProductMaintenance;
