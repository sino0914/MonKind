import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API } from "../../services/api";
import ProductPreview from "../Preview/ProductPreview";
import TemplateThumbnail from "../Preview/TemplateThumbnail";

const UniversalEditor = ({
  // 模式配置
  mode = "product", // 'product' | 'template'
  showTemplateTools = true, // 是否顯示版型工具

  // 商品相關
  productId = null,
  product = null,

  // 版型相關 (僅template模式使用)
  template = null,

  // 設計元素 (可外部控制)
  initialElements = [],
  initialBackgroundColor = "#ffffff",
  onElementsChange = null,
  onBackgroundColorChange = null,

  // 頂部工具列配置
  showTopToolbar = true,
  topToolbarLeft = null,
  topToolbarRight = null,
  title = "",

  // 回調函數
  onBack = null,
  onNavigateBack = null,
  onAddToCart = null,
  onDesignStateChange = null, // 新增：當設計狀態變化時的回調

  // 草稿相關
  draftId = null, // 新增：用於更新現有草稿的ID

  // 狀態相關
  loading = false,
  error = null,

  // 其他配置
  headerContent = null,
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // 內部狀態
  const [internalProduct, setInternalProduct] = useState(product);
  const [internalLoading, setInternalLoading] = useState(
    !product && !!productId
  );
  const [internalError, setInternalError] = useState(null);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [designElements, setDesignElements] = useState(initialElements);
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);

  // 圖片相關狀態
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // 元素庫狀態
  const [managedElements, setManagedElements] = useState([]);
  const [loadingElements, setLoadingElements] = useState(false);

  // 文字編輯相關狀態
  const [editingText, setEditingText] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [showTextToolbar, setShowTextToolbar] = useState(false);

  // 背景顏色狀態
  const [backgroundColor, setBackgroundColor] = useState(
    initialBackgroundColor
  );
  const [processedMockupImage, setProcessedMockupImage] = useState(null);

  // 圖層管理狀態
  const [hiddenLayers, setHiddenLayers] = useState(new Set()); // 隱藏的圖層ID集合

  // 用於避免初始化時觸發 onDesignStateChange 的標記
  const isInitialized = useRef(false);

  // 監聽初始化資料變化，更新內部狀態（僅在產品模式下）
  useEffect(() => {
    if (mode === "product" && initialElements) {
      setDesignElements(initialElements);
    }
  }, [initialElements, mode]);

  useEffect(() => {
    if (mode === "product" && initialBackgroundColor) {
      setBackgroundColor(initialBackgroundColor);
    }
  }, [initialBackgroundColor, mode]);

  // 版型相關狀態
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // 版型相關狀態 - 移除內部狀態，完全使用外部 props

  // 使用外部傳入的product或內部載入的product
  const currentProduct = product || internalProduct;

  // 使用外部傳入的狀態或內部狀態
  const currentLoading = loading || internalLoading;
  const currentError = error || internalError;

  // 文字寬度測量工具函數
  const measureTextWidth = useCallback(
    (
      text,
      fontSize,
      fontFamily,
      fontWeight = "normal",
      fontStyle = "normal"
    ) => {
      if (!text || text.length === 0) {
        return 20;
      }

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      const width = context.measureText(text).width;

      return Math.max(20, Math.ceil(width) + 16);
    },
    []
  );

  // 計算編輯中文字的實際寬度
  const editingInputWidth = useMemo(() => {
    if (!editingText || !editingContent) return 100;

    const element = designElements.find((el) => el.id === editingText);
    if (!element) return 100;

    try {
      const scaledFontSize = element.fontSize * (320 / 400);
      const textWidth = measureTextWidth(
        editingContent,
        scaledFontSize,
        element.fontFamily || "Arial",
        element.fontWeight || "normal",
        element.fontStyle || "normal"
      );

      const maxWidth = currentProduct?.printArea
        ? (currentProduct.printArea.width / 400) * 320 * 0.8
        : 300;

      const minWidth = 60;

      return Math.max(minWidth, Math.min(textWidth, maxWidth));
    } catch (error) {
      return 100;
    }
  }, [
    editingText,
    editingContent,
    designElements,
    measureTextWidth,
    currentProduct,
  ]);

  // 圖片顏色處理函數
  const processImageColor = useCallback((imageUrl, color) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = img.width;
          canvas.height = img.height;

          // 繪製原始圖片
          ctx.drawImage(img, 0, 0);

          // 如果不是白色，則套用顏色濾鏡
          if (color && color !== "#ffffff") {
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            );
            const data = imageData.data;

            // 將hex顏色轉換為RGB
            const hexToRgb = (hex) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                hex
              );
              return result
                ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16),
                  }
                : null;
            };

            const targetColor = hexToRgb(color);

            // 確保顏色解析成功
            if (targetColor) {
              // 處理每個像素
              for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                // 如果是白色或接近白色的像素，替換為目標顏色
                if (r > 200 && g > 200 && b > 200 && a > 0) {
                  // 計算灰度值來保持明暗變化
                  const brightness = (r + g + b) / 3 / 255;

                  data[i] = targetColor.r * brightness; // Red
                  data[i + 1] = targetColor.g * brightness; // Green
                  data[i + 2] = targetColor.b * brightness; // Blue
                }
              }

              // 將處理後的數據繪製回canvas
              ctx.putImageData(imageData, 0, 0);
            }
          }

          // 轉換為DataURL
          resolve(canvas.toDataURL());
        } catch (error) {
          resolve(imageUrl); // 如果處理失敗，返回原圖
        }
      };

      img.onerror = (error) => {
        resolve(imageUrl); // 如果載入失敗，返回原圖URL
      };

      img.src = imageUrl;
    });
  }, []);

  // 背景色現在直接設定在設計區域，不再處理商品圖片顏色
  // 保持原始商品底圖，背景色通過設計區域背景色層顯示
  useEffect(() => {
    if (currentProduct?.mockupImage) {
      // 直接使用原始圖片，不進行顏色處理
      setProcessedMockupImage(currentProduct.mockupImage);
    } else {
      setProcessedMockupImage(null);
    }
  }, [currentProduct?.mockupImage]);

  // 當設計元素改變時，通知外部
  useEffect(() => {
    if (onElementsChange) {
      onElementsChange(designElements);
    }
  }, [designElements, onElementsChange]);

  // 當背景顏色改變時，通知外部
  useEffect(() => {
    if (onBackgroundColorChange) {
      onBackgroundColorChange(backgroundColor);
    }
  }, [backgroundColor, onBackgroundColorChange]);

  // 通知外部設計狀態變化
  useEffect(() => {
    // 標記為已初始化，避免初始化時觸發回調導致無限循環
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    if (onDesignStateChange) {
      onDesignStateChange({
        elements: designElements,
        backgroundColor: backgroundColor,
      });
    }
  }, [designElements, backgroundColor, onDesignStateChange]);

  // 載入版型數據
  useEffect(() => {
    if (template && mode === "template") {
      // 載入版型的設計元素
      if (template.elements && Array.isArray(template.elements)) {
        setDesignElements(template.elements);
      }

      // 載入版型的背景顏色
      if (template.backgroundColor) {
        setBackgroundColor(template.backgroundColor);
      }
    }
  }, [template, mode]);

  // 載入可用版型列表
  const loadAvailableTemplates = useCallback(async () => {
    if (!currentProduct || mode !== "product") return;

    try {
      setLoadingTemplates(true);
      const templates = await API.templates.getByProductId(currentProduct.id);
      setAvailableTemplates(templates.filter((t) => t.isActive));
    } catch (error) {
      // 載入版型列表失敗
    } finally {
      setLoadingTemplates(false);
    }
  }, [currentProduct, mode]);

  // 當商品載入後，載入對應的版型列表
  useEffect(() => {
    if (showTemplateTools && currentProduct && mode === "product") {
      loadAvailableTemplates();
    }
  }, [showTemplateTools, currentProduct, mode, loadAvailableTemplates]);

  // 應用版型
  const applyTemplate = (template) => {
    // 檢查設計區是否已有元素
    if (designElements && designElements.length > 0) {
      const hasElements = designElements.some(
        (element) => element.type === "text" || element.type === "image"
      );

      if (hasElements) {
        const confirmed = window.confirm(
          "套用模板將會覆蓋目前設計區的所有元素，確定要繼續嗎？"
        );

        if (!confirmed) {
          return; // 取消套用
        }
      }
    }

    // 應用模板
    if (template.elements && Array.isArray(template.elements)) {
      setDesignElements([...template.elements]);
    }
    if (template.backgroundColor) {
      setBackgroundColor(template.backgroundColor);
    }
  };

  // 工具列表
  const tools = [
    ...(showTemplateTools
      ? [
          {
            id: "template",
            icon: "📐",
            label: "版型",
            description: "選擇設計模板",
          },
        ]
      : []),
    { id: "elements", icon: "✨", label: "元素", description: "添加裝飾元素" },
    { id: "text", icon: "➕", label: "文字", description: "添加文字內容" },
    { id: "image", icon: "🖼️", label: "照片", description: "上傳圖片" },
    {
      id: "background",
      icon: "🎨",
      label: "底色",
      description: "設定背景顏色",
    },
    { id: "layers", icon: "📑", label: "圖層", description: "管理圖層順序" },
  ];

  // 載入商品資料
  const loadProduct = async () => {
    if (!productId || product) return;

    try {
      setInternalLoading(true);
      setInternalError(null);

      const foundProduct = await API.products.getById(parseInt(productId));

      if (!foundProduct) {
        setInternalError("找不到此商品");
        return;
      }

      if (foundProduct.isActive === false) {
        setInternalError("此商品目前無法使用");
        return;
      }

      if (!foundProduct.printArea) {
        foundProduct.printArea = { x: 50, y: 50, width: 200, height: 150 };
      }

      setInternalProduct(foundProduct);
    } catch (error) {
      if (error.message.includes("找不到")) {
        setInternalError("商品不存在或已被移除");
      } else {
        setInternalError("載入商品失敗，請重新嘗試");
      }
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    if (productId && !product) {
      loadProduct();
      loadUploadedImages();
      loadManagedElements();
    } else if (product) {
      loadUploadedImages();
      loadManagedElements();
    }
  }, [productId, product]);

  // 載入已上傳的圖片
  const loadUploadedImages = () => {
    try {
      const savedImages = localStorage.getItem("editor_uploaded_images");
      if (savedImages) {
        setUploadedImages(JSON.parse(savedImages));
      }
    } catch (error) {
      // 載入已上傳圖片失敗
    }
  };

  // 載入元素庫
  const loadManagedElements = async () => {
    try {
      setLoadingElements(true);
      const elements = await API.elements.getAll();
      setManagedElements(
        elements.filter((element) => element.type === "image")
      );
    } catch (error) {
      console.error("載入元素庫失敗:", error);
    } finally {
      setLoadingElements(false);
    }
  };

  // 保存已上傳的圖片到 localStorage
  const saveUploadedImages = (images) => {
    try {
      localStorage.setItem("editor_uploaded_images", JSON.stringify(images));
      setUploadedImages(images);
    } catch (error) {
      // 保存圖片失敗
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      productId: currentProduct?.id || productId,
      timestamp: new Date().toISOString(),
      elements: designElements,
      backgroundColor: backgroundColor,
    };

    // 如果有 draftId，表示是從"繼續編輯"進入，更新現有草稿
    if (draftId) {
      localStorage.setItem(draftId, JSON.stringify(draft));
      alert("草稿已更新！");
    } else {
      // 沒有 draftId，創建新的草稿
      const newDraftId = `draft_${
        currentProduct?.id || productId
      }_${Date.now()}`;
      localStorage.setItem(newDraftId, JSON.stringify(draft));
      alert("草稿已儲存！");
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      // 使用外部回調
      onAddToCart({
        elements: designElements,
        backgroundColor: backgroundColor,
      });
    } else if (currentProduct) {
      // 默認行為
      const customProduct = {
        ...currentProduct,
        id: `custom_${Date.now()}`,
        title: `客製化 ${currentProduct.title}`,
        price: currentProduct.price + 50,
        isCustom: true,
        designData: {
          elements: designElements,
          backgroundColor: backgroundColor,
        },
      };
      addToCart(customProduct);
      alert("客製化商品已加入購物車！");
    }
  };

  const handleAddText = () => {
    // 安全檢查：確保 currentProduct 和 printArea 存在
    const printArea = currentProduct?.printArea;
    const centerX = printArea ? printArea.x + printArea.width / 2 : 200;
    const centerY = printArea ? printArea.y + printArea.height / 2 : 200;

    const newTextElement = {
      id: `text-${Date.now()}`,
      type: "text",
      content: "新增文字",
      x: centerX,
      y: centerY,
      fontSize: 24,
      color: "#000000",
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
    };
    setDesignElements([...designElements, newTextElement]);
  };

  // 圖片壓縮函數
  const compressImage = (
    file,
    maxWidth = 600,
    maxHeight = 600,
    quality = 0.8
  ) => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
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

        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // 處理圖片上傳
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setIsUploading(true);

    try {
      const newImages = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          continue;
        }

        let imageUrl;
        if (file.size > 500 * 1024) {
          imageUrl = await compressImage(file, 800, 800, 0.8);
        } else {
          imageUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        const imageData = {
          id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: imageUrl,
          name: file.name,
          uploadDate: new Date().toISOString(),
          originalSize: file.size,
        };

        newImages.push(imageData);
      }

      const updatedImages = [...uploadedImages, ...newImages];
      saveUploadedImages(updatedImages);

      event.target.value = "";
    } catch (error) {
      alert("圖片上傳失敗，請重試");
    } finally {
      setIsUploading(false);
    }
  };

  // 添加圖片到畫布
  const handleAddImageToCanvas = (imageData) => {
    // 安全檢查：確保 currentProduct 和 printArea 存在
    const printArea = currentProduct?.printArea;
    const centerX = printArea ? printArea.x + printArea.width / 2 : 200;
    const centerY = printArea ? printArea.y + printArea.height / 2 : 200;

    const newImageElement = {
      id: `canvas-image-${Date.now()}`,
      type: "image",
      imageId: imageData.id,
      url: imageData.url,
      x: centerX,
      y: centerY,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
    };
    setDesignElements([...designElements, newImageElement]);
  };

  // 刪除已上傳的圖片
  const handleDeleteUploadedImage = (imageId) => {
    const isUsed = designElements.some(
      (el) => el.type === "image" && el.imageId === imageId
    );

    if (isUsed) {
      if (
        !window.confirm(
          "這張圖片正在畫布中使用，確定要刪除嗎？這會同時移除畫布中的圖片。"
        )
      ) {
        return;
      }
      setDesignElements((prev) =>
        prev.filter((el) => !(el.type === "image" && el.imageId === imageId))
      );
    }

    const updatedImages = uploadedImages.filter((img) => img.id !== imageId);
    saveUploadedImages(updatedImages);
  };

  // 從元素庫添加圖片到設計區
  const addManagedElementToDesign = (element) => {
    if (element.type !== "image") return;

    // 計算畫布中央位置
    const printArea = product?.printArea || {
      x: 0,
      y: 0,
      width: 400,
      height: 400,
    };
    const centerX = printArea.x + printArea.width / 2;
    const centerY = printArea.y + printArea.height / 2;

    const newElement = {
      id: Date.now(),
      type: "image",
      url: element.url,
      x: centerX,
      y: centerY,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 1,
    };

    const updatedElements = [...designElements, newElement];
    setDesignElements(updatedElements);
  };

  // 選擇元素
  const handleSelectElement = (element) => {
    setSelectedElement(element);
    if (element.type === "text") {
      setShowTextToolbar(true);
    } else {
      setShowTextToolbar(false);
      setEditingText(null);
    }
  };

  // 刪除畫布上的元素
  const handleDeleteElement = (elementId) => {
    setDesignElements((prev) => prev.filter((el) => el.id !== elementId));
    setSelectedElement(null);
    setShowTextToolbar(false);
    setEditingText(null);
    // 同時從隱藏圖層集合中移除
    setHiddenLayers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(elementId);
      return newSet;
    });
  };

  // 圖層管理函數
  const toggleLayerVisibility = (elementId) => {
    setHiddenLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      return newSet;
    });
  };

  const moveLayerUp = (elementId) => {
    setDesignElements((prev) => {
      const elements = [...prev];
      const currentIndex = elements.findIndex((el) => el.id === elementId);
      if (currentIndex < elements.length - 1) {
        // 交換當前元素和上一個元素的位置
        [elements[currentIndex], elements[currentIndex + 1]] = [
          elements[currentIndex + 1],
          elements[currentIndex],
        ];
      }
      return elements;
    });
  };

  const moveLayerDown = (elementId) => {
    setDesignElements((prev) => {
      const elements = [...prev];
      const currentIndex = elements.findIndex((el) => el.id === elementId);
      if (currentIndex > 0) {
        // 交換當前元素和下一個元素的位置
        [elements[currentIndex], elements[currentIndex - 1]] = [
          elements[currentIndex - 1],
          elements[currentIndex],
        ];
      }
      return elements;
    });
  };

  const moveLayerToTop = (elementId) => {
    setDesignElements((prev) => {
      const elements = [...prev];
      const elementIndex = elements.findIndex((el) => el.id === elementId);
      if (elementIndex !== -1) {
        const element = elements.splice(elementIndex, 1)[0];
        elements.push(element); // 移到陣列最後（最上層）
      }
      return elements;
    });
  };

  const moveLayerToBottom = (elementId) => {
    setDesignElements((prev) => {
      const elements = [...prev];
      const elementIndex = elements.findIndex((el) => el.id === elementId);
      if (elementIndex !== -1) {
        const element = elements.splice(elementIndex, 1)[0];
        elements.unshift(element); // 移到陣列最前（最下層）
      }
      return elements;
    });
  };

  // 開始編輯文字
  const handleStartTextEdit = (element) => {
    setEditingText(element.id);
    setEditingContent(element.content);
  };

  // 完成文字編輯
  const handleFinishTextEdit = () => {
    if (editingText) {
      setDesignElements((prev) =>
        prev.map((el) =>
          el.id === editingText ? { ...el, content: editingContent } : el
        )
      );
    }
    setEditingText(null);
    setEditingContent("");
  };

  // 切換粗體
  const handleToggleBold = () => {
    if (selectedElement && selectedElement.type === "text") {
      const newWeight =
        selectedElement.fontWeight === "bold" ? "normal" : "bold";
      setDesignElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement.id ? { ...el, fontWeight: newWeight } : el
        )
      );
      setSelectedElement((prev) => ({ ...prev, fontWeight: newWeight }));
    }
  };

  // 切換斜體
  const handleToggleItalic = () => {
    if (selectedElement && selectedElement.type === "text") {
      const newStyle =
        selectedElement.fontStyle === "italic" ? "normal" : "italic";
      setDesignElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement.id ? { ...el, fontStyle: newStyle } : el
        )
      );
      setSelectedElement((prev) => ({ ...prev, fontStyle: newStyle }));
    }
  };

  // 調整字體大小
  const handleFontSizeChange = (change) => {
    if (selectedElement && selectedElement.type === "text") {
      const newSize = Math.max(
        8,
        Math.min(72, selectedElement.fontSize + change)
      );
      setDesignElements((prev) =>
        prev.map((el) =>
          el.id === selectedElement.id ? { ...el, fontSize: newSize } : el
        )
      );
      setSelectedElement((prev) => ({ ...prev, fontSize: newSize }));

      if (editingText === selectedElement.id) {
        // useMemo 會自動重新計算
      }
    }
  };

  const handleMouseDown = (e, element, handle = null) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedElement(element);

    if (handle) {
      setResizeHandle(handle);
      setDraggedElement(null);
    } else {
      setDraggedElement(element.id);
      setResizeHandle(null);

      const rect = e.currentTarget.getBoundingClientRect();

      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!draggedElement && !resizeHandle) return;

    // 安全檢查：如果沒有 printArea，使用預設範圍
    const printArea = currentProduct?.printArea || {
      x: 0,
      y: 0,
      width: 400,
      height: 400,
    };

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    if (draggedElement) {
      const relativeX = e.clientX - canvasRect.left - dragOffset.x;
      const relativeY = e.clientY - canvasRect.top - dragOffset.y;

      const canvasX = (relativeX / canvasWidth) * 400;
      const canvasY = (relativeY / canvasHeight) * 400;

      const minX = printArea.x;
      const maxX = printArea.x + printArea.width;
      const minY = printArea.y;
      const maxY = printArea.y + printArea.height;

      const constrainedX = Math.max(minX, Math.min(maxX, canvasX));
      const constrainedY = Math.max(minY, Math.min(maxY, canvasY));

      setDesignElements((elements) =>
        elements.map((el) =>
          el.id === draggedElement
            ? { ...el, x: constrainedX, y: constrainedY }
            : el
        )
      );
    } else if (resizeHandle && selectedElement) {
      // 縮放和旋轉處理邏輯...
      const currentX = ((e.clientX - canvasRect.left) / canvasWidth) * 400;
      const currentY = ((e.clientY - canvasRect.top) / canvasHeight) * 400;

      setDesignElements((elements) =>
        elements.map((el) => {
          if (el.id === selectedElement.id) {
            if (resizeHandle === "rotate") {
              const centerX = el.x;
              const centerY = el.y;
              const angle = Math.atan2(currentY - centerY, currentX - centerX);
              const degrees = (angle * 180) / Math.PI + 90;
              return { ...el, rotation: degrees };
            } else {
              // 圖片縮放處理
              let newWidth = el.width;
              let newHeight = el.height;
              let newX = el.x;
              let newY = el.y;

              const aspectRatio = el.width / el.height;
              const minSize = 20;

              if (resizeHandle === "se") {
                const deltaX = currentX - el.x;
                const deltaY = currentY - el.y;
                if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                  newWidth = Math.max(minSize, Math.abs(deltaX) * 2);
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = Math.max(minSize, Math.abs(deltaY) * 2);
                  newWidth = newHeight * aspectRatio;
                }
              } else if (resizeHandle === "nw") {
                const deltaX = el.x - currentX;
                const deltaY = el.y - currentY;
                if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                  newWidth = Math.max(minSize, Math.abs(deltaX) * 2);
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = Math.max(minSize, Math.abs(deltaY) * 2);
                  newWidth = newHeight * aspectRatio;
                }
              } else if (resizeHandle === "ne") {
                const deltaX = currentX - el.x;
                const deltaY = el.y - currentY;
                if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                  newWidth = Math.max(minSize, Math.abs(deltaX) * 2);
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = Math.max(minSize, Math.abs(deltaY) * 2);
                  newWidth = newHeight * aspectRatio;
                }
              } else if (resizeHandle === "sw") {
                const deltaX = el.x - currentX;
                const deltaY = currentY - el.y;
                if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                  newWidth = Math.max(minSize, Math.abs(deltaX) * 2);
                  newHeight = newWidth / aspectRatio;
                } else {
                  newHeight = Math.max(minSize, Math.abs(deltaY) * 2);
                  newWidth = newHeight * aspectRatio;
                }
              }

              // 限制在設計區域內
              const halfWidth = newWidth / 2;
              const halfHeight = newHeight / 2;
              const minX = printArea.x + halfWidth;
              const maxX = printArea.x + printArea.width - halfWidth;
              const minY = printArea.y + halfHeight;
              const maxY = printArea.y + printArea.height - halfHeight;

              newX = Math.max(minX, Math.min(maxX, el.x));
              newY = Math.max(minY, Math.min(maxY, el.y));

              if (newX - halfWidth < printArea.x) {
                newWidth = (newX - printArea.x) * 2;
                newHeight = newWidth / aspectRatio;
              }
              if (newX + halfWidth > printArea.x + printArea.width) {
                newWidth = (printArea.x + printArea.width - newX) * 2;
                newHeight = newWidth / aspectRatio;
              }
              if (newY - halfHeight < printArea.y) {
                newHeight = (newY - printArea.y) * 2;
                newWidth = newHeight * aspectRatio;
              }
              if (newY + halfHeight > printArea.y + printArea.height) {
                newHeight = (printArea.y + printArea.height - newY) * 2;
                newWidth = newHeight * aspectRatio;
              }

              return {
                ...el,
                width: newWidth,
                height: newHeight,
                x: newX,
                y: newY,
              };
            }
          }
          return el;
        })
      );
    }
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizeHandle(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // 點擊畫布空白處取消選擇
  const handleCanvasClick = (e) => {
    if (
      e.target.classList.contains("canvas-container") ||
      e.target.classList.contains("w-96") ||
      e.target.classList.contains("h-96")
    ) {
      setSelectedElement(null);
      setShowTextToolbar(false);
      setEditingText(null);
    }
  };
  // 測試輸出功能：將設計區域元素輸出為圖片（不含底圖）
  const handleTestOutput = async () => {
    if (!currentProduct?.printArea) {
      alert("無法輸出：商品未設定設計區域");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const { width: printWidth, height: printHeight } =
        currentProduct.printArea;

      // 判斷是否為3D商品，需要輸出正方形圖片
      const is3D = currentProduct.type === "3D";
      let canvasWidth = printWidth;
      let canvasHeight = printHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (is3D) {
        // 計算正方形尺寸
        const maxSize = Math.max(printWidth, printHeight);
        canvasWidth = maxSize;
        canvasHeight = maxSize;

        // 計算偏移量讓設計區域居中或對齊
        if (printHeight > printWidth) {
          // 高度大於寬度，往右邊補齊
          offsetX = 0; // 設計區域在左邊
          offsetY = 0;
        } else if (printWidth > printHeight) {
          // 寬度大於高度，往下補齊
          offsetX = 0;
          offsetY = 0; // 設計區域在上面
        } else {
          // 已經是正方形
          offsetX = 0;
          offsetY = 0;
        }

        console.log("3D商品正方形輸出:", {
          原始設計區域: `${printWidth}×${printHeight}`,
          正方形畫布: `${canvasWidth}×${canvasHeight}`,
          設計區域偏移: `${offsetX}, ${offsetY}`,
        });
      }

      // 設定高解析度
      const scale = 3; // 提高解析度用於輸出
      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;
      ctx.scale(scale, scale);

      // 設定背景（透明背景或背景色）
      if (is3D) {
        // 3D 商品：整張底圖先塗白，再把設計區域塗上背景色
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (backgroundColor && backgroundColor !== "#ffffff") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(offsetX, offsetY, printWidth, printHeight);
        }
      } else {
        // 2D 商品：整張直接用背景色（或透明）
        if (backgroundColor && backgroundColor !== "#ffffff") {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } else {
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        }
      }

      console.log("開始輸出設計區域:", {
        設計區域: `${printWidth}×${printHeight}`,
        元素數量: designElements.length,
        背景色: backgroundColor,
      });

      // 確保元素依照順序繪製（有 zIndex 則優先排序）
      const sortedElements = [...designElements].sort((a, b) => {
        const zA = a.zIndex ?? 0;
        const zB = b.zIndex ?? 0;
        return zA - zB;
      });

      // 幫助載入圖片的工具函式
      const loadImage = (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });

      // 順序繪製
      for (const element of sortedElements) {
        if (!element) continue;

        // 計算元素在設計區域內的相對位置
        const elementX = element.x - currentProduct.printArea.x;
        const elementY = element.y - currentProduct.printArea.y;

        // 加上畫布偏移量（3D商品正方形補齊）
        const finalX = elementX + offsetX;
        const finalY = elementY + offsetY;

        if (element.type === "text") {
          ctx.fillStyle = element.color || "#000000";
          ctx.font = `${element.fontSize || 16}px ${
            element.fontFamily || "Arial"
          }`;
          ctx.textBaseline = "middle";
          ctx.textAlign = "center";
          ctx.fillText(element.content || "", finalX, finalY);

          console.log(
            "✅ 輸出文字元素:",
            element.content,
            `位置: ${finalX}, ${finalY}`
          );
        }

        if (element.type === "image") {
          let img = element.imageElement;
          if (!img && element.url) {
            img = await loadImage(element.url);
          }
          if (img) {
            const imgWidth = element.width || 100;
            const imgHeight = element.height || 100;
            const centerX = finalX - imgWidth / 2;
            const centerY = finalY - imgHeight / 2;
            ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);

            console.log(
              "✅ 輸出圖片元素:",
              element.url,
              `位置: ${centerX}, ${centerY}`
            );
          } else {
            console.warn("❌ 圖片載入失敗:", element.url);
          }
        }
      }

      console.log("所有元素渲染完成，開始輸出圖片...");

      // 下載圖片
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${currentProduct.title}_設計區域_${new Date()
              .toISOString()
              .slice(0, 19)
              .replace(/:/g, "-")}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("✅ 圖片輸出完成");
            alert("設計區域已成功輸出為圖片！");
          } else {
            console.error("❌ Canvas轉換失敗");
            alert("輸出失敗：無法生成圖片");
          }
        },
        "image/png",
        1.0
      );
    } catch (error) {
      console.error("輸出過程發生錯誤:", error);
      alert("輸出失敗：" + error.message);
    }
  };

  // 預設頂部工具列按鈕 - 現在只有產品模式的基本按鈕，版型模式完全由外部控制
  const defaultTopToolbarRight =
    mode === "product" ? (
      <div className="flex items-center space-x-3">
        <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
          <span className="mr-1">↶</span> 撤銷
        </button>
        <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
          <span className="mr-1">↷</span> 重做
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <button
          onClick={handleTestOutput}
          className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
          title="輸出設計區域為圖片（不含底圖）"
        >
          <span className="mr-1">📸</span> 測試輸出
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <button
          onClick={handleSaveDraft}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          💾 儲存
        </button>
        <button
          onClick={handleAddToCart}
          className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          🛒 加入購物車
        </button>
      </div>
    ) : null; // 版型模式不提供預設按鈕，完全由外部控制

  // 預設頂部工具列左側
  const defaultTopToolbarLeft = (
    <div className="flex items-center space-x-4">
      <button
        onClick={onNavigateBack || onBack || (() => navigate(-1))}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
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
      <div className="h-6 w-px bg-gray-300"></div>
      <h1 className="text-lg font-semibold text-gray-900">
        {title || (mode === "template" ? "📐 版型編輯器" : "編輯器")} -{" "}
        {currentProduct?.title}
      </h1>
    </div>
  );

  // 載入狀態
  if (currentLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入編輯器中...</p>
          <p className="text-sm text-gray-500 mt-2">
            正在載入商品資料與設計區域
          </p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (currentError) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            無法開啟編輯器
          </h3>
          <p className="text-gray-600 mb-4">{currentError}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={
                onNavigateBack || onBack || (() => navigate("/products"))
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {mode === "template" ? "回到版型管理" : "回到商品頁"}
            </button>
            <button
              onClick={loadProduct}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 商品不存在
  if (!currentProduct) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            商品不存在
          </h3>
          <p className="text-gray-600 mb-4">找不到此商品或商品已被移除</p>
          <button
            onClick={onNavigateBack || onBack || (() => navigate("/products"))}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {mode === "template" ? "回到版型管理" : "回到商品頁"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Top Toolbar */}
      {showTopToolbar && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          {topToolbarLeft || defaultTopToolbarLeft}
          {topToolbarRight || defaultTopToolbarRight}
        </div>
      )}

      <div className="flex-1 flex">
        {/* Left Sidebar - Collapsible Tools */}
        <div className="bg-white border-r border-gray-200 transition-all duration-300 ease-in-out">
          <div className="flex">
            {/* Tool Icons */}
            <div className="w-16 bg-gray-50 border-r border-gray-200">
              <div className="p-2 space-y-1">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                    onClick={() =>
                      setSelectedTool(selectedTool === tool.id ? null : tool.id)
                    }
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${
                      selectedTool === tool.id
                        ? "bg-blue-500 text-white shadow-md"
                        : hoveredTool === tool.id
                        ? "bg-gray-200"
                        : "hover:bg-gray-100"
                    }`}
                    title={tool.label}
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded Tool Panel */}
            <div
              className={`bg-white transition-all duration-300 ease-in-out overflow-hidden ${
                hoveredTool || selectedTool ? "w-80" : "w-0"
              }`}
            >
              {(hoveredTool || selectedTool) && (
                <div className="p-4 w-80">
                  {(() => {
                    const currentTool = tools.find(
                      (t) => t.id === (selectedTool || hoveredTool)
                    );
                    return (
                      <div>
                        <div className="flex items-center mb-4">
                          <span className="text-2xl mr-3">
                            {currentTool?.icon}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {currentTool?.label}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {currentTool?.description}
                            </p>
                          </div>
                        </div>

                        {/* Tool-specific content */}
                        <div className="space-y-3">
                          {currentTool?.id === "template" && (
                            <div className="space-y-3">
                              {loadingTemplates ? (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                  <p className="text-sm text-gray-600">
                                    載入版型中...
                                  </p>
                                </div>
                              ) : availableTemplates.length > 0 ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium text-gray-700">
                                      可用版型
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                      {availableTemplates.length} 個版型
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
                                    {availableTemplates.map((template) => (
                                      <button
                                        key={template.id}
                                        onClick={() => applyTemplate(template)}
                                        className="p-2 bg-gray-50 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition-colors text-center group"
                                        title={`點擊應用版型：${template.name}`}
                                      >
                                        {/* 版型縮圖 */}
                                        <div className="w-full aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden mb-2">
                                          <TemplateThumbnail
                                            template={template}
                                            width={120}
                                            height={120}
                                            showName={false}
                                            showElementCount={false}
                                            className="w-full h-full group-hover:scale-105 transition-transform duration-200"
                                          />
                                        </div>

                                        {/* 版型標題 */}
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                          {template.name}
                                        </p>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-6 text-gray-500 text-sm">
                                  <div className="text-2xl mb-2">📐</div>
                                  此商品還沒有可用版型
                                  <br />
                                  可在後台管理中新增版型
                                </div>
                              )}

                              {/* 使用說明 */}
                              <div className="bg-blue-50 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  💡 使用說明
                                </h5>
                                <ul className="text-xs text-blue-800 space-y-1">
                                  <li>• 點擊版型即可套用設計</li>
                                  <li>• 套用後可繼續編輯調整</li>
                                  <li>• 版型會覆蓋目前的設計內容</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {currentTool?.id === "elements" && (
                            <div className="space-y-4">
                              {/* 設計元素庫 */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-gray-700">
                                    設計元素庫
                                  </h4>
                                  <button
                                    onClick={loadManagedElements}
                                    disabled={loadingElements}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    {loadingElements ? "載入中..." : "重新載入"}
                                  </button>
                                </div>

                                {loadingElements ? (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <span className="text-xs text-gray-500">
                                      載入元素中...
                                    </span>
                                  </div>
                                ) : managedElements.length > 0 ? (
                                  <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
                                    {managedElements.map((element) => (
                                      <div
                                        key={element.id}
                                        className="relative aspect-square border border-gray-200 rounded cursor-pointer hover:border-blue-400 transition-colors group overflow-hidden"
                                        onClick={() =>
                                          addManagedElementToDesign(element)
                                        }
                                      >
                                        <img
                                          src={element.url}
                                          alt={element.name}
                                          className="w-full h-full object-cover"
                                        />

                                        {/* 元素名稱 */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                          {element.name}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-gray-500 text-sm">
                                    <div className="text-2xl mb-2">🎨</div>
                                    沒有可用的設計元素
                                    <br />
                                    <span className="text-xs">
                                      前往管理頁面上傳元素
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* 使用說明 */}
                              <div className="bg-blue-50 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  💡 使用說明
                                </h5>
                                <ul className="text-xs text-blue-800 space-y-1">
                                  <li>• 點擊設計元素庫中的元素添加到畫布</li>
                                  <li>• 在畫布上可拖曳調整位置和大小</li>
                                  <li>• 滑鼠右鍵可刪除畫布上的圖片</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {currentTool?.id === "text" && (
                            <div className="space-y-2">
                              <button
                                onClick={handleAddText}
                                className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                ➕ 基本文字
                              </button>
                            </div>
                          )}

                          {currentTool?.id === "image" && (
                            <div className="space-y-4">
                              {/* 圖片上傳區 */}
                              <div>
                                <input
                                  type="file"
                                  id="imageUpload"
                                  multiple
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="imageUpload"
                                  className={`w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors text-center cursor-pointer block ${
                                    isUploading
                                      ? "bg-blue-50 border-blue-300"
                                      : "hover:bg-gray-50"
                                  }`}
                                >
                                  {isUploading ? (
                                    <div className="flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                                      上傳中...
                                    </div>
                                  ) : (
                                    <>
                                      📁 點擊上傳圖片
                                      <div className="text-xs text-gray-500 mt-1">
                                        支援 JPG、PNG 格式
                                      </div>
                                    </>
                                  )}
                                </label>
                              </div>

                              {/* 已上傳圖片庫 */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-medium text-gray-700">
                                    圖片庫
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {uploadedImages.length} 張圖片
                                  </span>
                                </div>

                                {uploadedImages.length > 0 ? (
                                  <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
                                    {uploadedImages.map((image) => (
                                      <div
                                        key={image.id}
                                        className="relative group"
                                      >
                                        <button
                                          onClick={() =>
                                            handleAddImageToCanvas(image)
                                          }
                                          className="aspect-square bg-gray-100 rounded border hover:border-blue-400 transition-colors overflow-hidden w-full"
                                          title={`點擊添加到畫布 - ${image.name}`}
                                        >
                                          <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </button>

                                        {/* 刪除按鈕 */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteUploadedImage(image.id);
                                          }}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="刪除圖片"
                                        >
                                          ×
                                        </button>

                                        {/* 圖片名稱 */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                          {image.name}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-gray-500 text-sm">
                                    <div className="text-2xl mb-2">📷</div>
                                    還沒有上傳圖片
                                    <br />
                                    點擊上方按鈕開始上傳
                                  </div>
                                )}
                              </div>

                              {/* 使用說明 */}
                              <div className="bg-blue-50 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  💡 使用說明
                                </h5>
                                <ul className="text-xs text-blue-800 space-y-1">
                                  <li>• 點擊圖片庫中的圖片添加到畫布</li>
                                  <li>• 在畫布上可拖曳調整位置和大小</li>
                                  <li>• 滑鼠右鍵可刪除畫布上的圖片</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {currentTool?.id === "background" && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  商品底色
                                </label>
                                <input
                                  type="color"
                                  value={backgroundColor}
                                  onChange={(e) =>
                                    setBackgroundColor(e.target.value)
                                  }
                                  className="w-full h-10 rounded border"
                                />
                              </div>

                              <div className="text-xs text-gray-600 mb-2">
                                當前顏色: {backgroundColor}
                              </div>

                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  "#ffffff",
                                  "#f3f4f6",
                                  "#fef3c7",
                                  "#dbeafe",
                                  "#fce7f3",
                                  "#f3e8ff",
                                  "#fecaca",
                                  "#fed7aa",
                                  "#fde68a",
                                  "#bbf7d0",
                                  "#bfdbfe",
                                  "#e0e7ff",
                                ].map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => setBackgroundColor(color)}
                                    className={`w-12 h-12 rounded border-2 transition-colors ${
                                      backgroundColor === color
                                        ? "border-blue-500 shadow-md scale-105"
                                        : "border-gray-200 hover:border-gray-400"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={`選擇顏色: ${color}`}
                                  />
                                ))}
                              </div>

                              {/* 重置按鈕 */}
                              <button
                                onClick={() => setBackgroundColor("#ffffff")}
                                className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                              >
                                🔄 重置為白色
                              </button>

                              {/* 說明文字 */}
                              <div className="bg-blue-50 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  💡 使用說明
                                </h5>
                                <ul className="text-xs text-blue-800 space-y-1">
                                  <li>• 選擇顏色會設定設計區域的背景色</li>
                                  <li>• 背景色會顯示在設計區域和即時預覽中</li>
                                  <li>• 設計元素會顯示在背景色上方</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {currentTool?.id === "layers" && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-700">
                                  圖層列表
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {designElements.length + 1} 個圖層
                                </span>
                              </div>

                              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                                {/* 設計元素圖層 - 按照z-index順序顯示 */}
                                {[...designElements]
                                  .reverse()
                                  .map((element, index) => {
                                    const isSelected =
                                      selectedElement?.id === element.id;
                                    const isHidden = hiddenLayers.has(
                                      element.id
                                    );
                                    const layerName =
                                      element.type === "text"
                                        ? `文字: ${
                                            element.content?.substring(0, 10) ||
                                            "新增文字"
                                          }${
                                            element.content?.length > 10
                                              ? "..."
                                              : ""
                                          }`
                                        : `圖片: ${
                                            element.url ? "自訂圖片" : "圖片"
                                          }`;

                                    return (
                                      <div
                                        key={element.id}
                                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors select-none ${
                                          isSelected
                                            ? "bg-blue-100 border border-blue-300"
                                            : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                                        } ${isHidden ? "opacity-50" : ""}`}
                                        onClick={() =>
                                          handleSelectElement(element)
                                        }
                                      >
                                        <div className="flex items-center space-x-2 flex-1">
                                          <span className="text-lg">
                                            {element.type === "text"
                                              ? "📝"
                                              : "🖼️"}
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                              {layerName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              圖層{" "}
                                              {designElements.length - index}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center space-x-1">
                                          {/* 可見性切換 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleLayerVisibility(element.id);
                                            }}
                                            className={`text-xs px-2 py-1 rounded transition-colors ${
                                              isHidden
                                                ? "bg-gray-300 text-gray-600 hover:bg-gray-400"
                                                : "bg-blue-500 text-white hover:bg-blue-600"
                                            }`}
                                            title={
                                              isHidden ? "顯示圖層" : "隱藏圖層"
                                            }
                                          >
                                            {isHidden ? "👁️‍🗨️" : "👁️"}
                                          </button>

                                          {/* 圖層順序控制 */}
                                          <div className="flex flex-col">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                moveLayerUp(element.id);
                                              }}
                                              className="text-xs px-1 py-0.5 bg-white hover:bg-gray-100 rounded-t border border-gray-300"
                                              title="向上移動"
                                              disabled={index === 0}
                                            >
                                              ↑
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                moveLayerDown(element.id);
                                              }}
                                              className="text-xs px-1 py-0.5 bg-white hover:bg-gray-100 rounded-b border border-gray-300 border-t-0"
                                              title="向下移動"
                                              disabled={
                                                index ===
                                                designElements.length - 1
                                              }
                                            >
                                              ↓
                                            </button>
                                          </div>

                                          {/* 刪除按鈕 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (
                                                window.confirm(
                                                  "確定要刪除這個圖層嗎？"
                                                )
                                              ) {
                                                handleDeleteElement(element.id);
                                              }
                                            }}
                                            className="text-xs px-2 py-1 bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
                                            title="刪除圖層"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                {/* 背景圖層 - 始終在最底層 */}
                                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">🎨</span>
                                    <div>
                                      <span className="text-sm font-medium text-blue-900">
                                        背景顏色
                                      </span>
                                      <div className="text-xs text-blue-700">
                                        {backgroundColor}
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    className="w-4 h-4 border border-gray-300 rounded"
                                    style={{ backgroundColor: backgroundColor }}
                                  />
                                </div>

                                {designElements.length === 0 && (
                                  <div className="text-center py-6 text-gray-500 text-sm">
                                    <div className="text-2xl mb-2">📑</div>
                                    還沒有設計元素
                                    <br />
                                    使用左側工具開始添加元素
                                  </div>
                                )}
                              </div>

                              {/* 圖層操作提示 */}
                              <div className="bg-blue-50 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-blue-900 mb-1">
                                  💡 圖層操作
                                </h5>
                                <ul className="text-xs text-blue-800 space-y-1">
                                  <li>• 點擊圖層可選中對應元素</li>
                                  <li>• 👁️ 控制圖層顯示/隱藏</li>
                                  <li>• ↑↓ 調整圖層順序</li>
                                  <li>• 🗑️ 刪除圖層</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Canvas Area */}
          <div className="flex-1 bg-gray-50 p-8">
            <div className="h-full flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl p-8">
                <div
                  className="w-80 h-80 border-2 border-gray-200 rounded-lg relative overflow-hidden bg-white canvas-container"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handleCanvasClick}
                >
                  {/* 產品背景 - 3D和2D產品使用不同顯示方式 */}
                  {currentProduct.type === "3D" ? (
                    /* 3D產品：只在設計區域顯示底圖 */
                    <>
                      {/* 3D產品的畫布背景 - 淺色背景用於對比 */}
                      <div className="absolute inset-0 bg-gray-50"></div>

                      {/* 在設計區域內顯示底圖 */}
                      {currentProduct.mockupImage &&
                        currentProduct.printArea && (
                          <div
                            className="absolute overflow-hidden"
                            style={{
                              left: `${
                                (currentProduct.printArea.x / 400) * 100
                              }%`,
                              top: `${
                                (currentProduct.printArea.y / 400) * 100
                              }%`,
                              width: `${
                                (currentProduct.printArea.width / 400) * 100
                              }%`,
                              height: `${
                                (currentProduct.printArea.height / 400) * 100
                              }%`,
                              zIndex: 0,
                            }}
                          >
                            <img
                              src={
                                processedMockupImage ||
                                currentProduct.mockupImage
                              }
                              alt={`${currentProduct.title} 設計區底圖`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error("3D產品底圖載入失敗");
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                    </>
                  ) : (
                    /* 2D產品：傳統顯示方式 - 整個畫布顯示完整底圖 */
                    <>
                      {currentProduct.mockupImage ? (
                        <img
                          src={
                            processedMockupImage || currentProduct.mockupImage
                          }
                          alt={`${currentProduct.title} 底圖`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}

                      {/* 2D產品的Fallback內容 */}
                      <div
                        className="absolute inset-0 bg-gray-100 border border-dashed border-gray-400 rounded flex items-center justify-center"
                        style={{
                          display: currentProduct.mockupImage ? "none" : "flex",
                        }}
                      >
                        <div className="text-center">
                          <img
                            src={currentProduct.image}
                            alt={currentProduct.title}
                            className="w-16 h-16 mx-auto mb-2 opacity-30"
                          />
                          <p className="text-gray-600 text-sm">
                            商品底圖載入中...
                          </p>
                          <p className="text-gray-500 text-xs">
                            點擊工具開始設計
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 3D產品的Fallback內容 */}
                  {currentProduct.type === "3D" &&
                    !currentProduct.mockupImage && (
                      <div
                        className="absolute bg-gray-100 border border-dashed border-gray-400 rounded flex items-center justify-center"
                        style={{
                          left: `${
                            ((currentProduct.printArea?.x || 50) / 400) * 100
                          }%`,
                          top: `${
                            ((currentProduct.printArea?.y || 50) / 400) * 100
                          }%`,
                          width: `${
                            ((currentProduct.printArea?.width || 200) / 400) *
                            100
                          }%`,
                          height: `${
                            ((currentProduct.printArea?.height || 150) / 400) *
                            100
                          }%`,
                          zIndex: 0,
                        }}
                      >
                        <div className="text-center">
                          <p className="text-gray-600 text-xs">設計區域</p>
                          <p className="text-gray-500 text-xs">
                            請先在後台設定底圖
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Print Area Overlay */}
                  {currentProduct.printArea && (
                    <>
                      <div
                        className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-sm z-10"
                        style={{
                          left: `${(currentProduct.printArea.x / 400) * 100}%`,
                          top: `${
                            (currentProduct.printArea.y / 400) * 100 - 2
                          }%`,
                          transform: "translateY(-100%)",
                        }}
                      >
                        設計區 {currentProduct.printArea.width}×
                        {currentProduct.printArea.height}px
                      </div>

                      {/* 設計區域背景色 - 與即時預覽區保持一致 */}
                      {/* 對於3D產品，背景色應該顯示在底圖之上；對於2D產品，背景色保持原有邏輯 */}
                      <div
                        className="absolute"
                        style={{
                          left: `${(currentProduct.printArea.x / 400) * 100}%`,
                          top: `${(currentProduct.printArea.y / 400) * 100}%`,
                          width: `${
                            (currentProduct.printArea.width / 400) * 100
                          }%`,
                          height: `${
                            (currentProduct.printArea.height / 400) * 100
                          }%`,
                          backgroundColor:
                            currentProduct.type === "3D"
                              ? "transparent"
                              : backgroundColor,
                          zIndex: currentProduct.type === "3D" ? 0 : 1,
                        }}
                      />

                      {/* 3D產品的背景色層，顯示在底圖之上 */}
                      {currentProduct.type === "3D" &&
                        backgroundColor &&
                        backgroundColor !== "#ffffff" && (
                          <div
                            className="absolute"
                            style={{
                              left: `${
                                (currentProduct.printArea.x / 400) * 100
                              }%`,
                              top: `${
                                (currentProduct.printArea.y / 400) * 100
                              }%`,
                              width: `${
                                (currentProduct.printArea.width / 400) * 100
                              }%`,
                              height: `${
                                (currentProduct.printArea.height / 400) * 100
                              }%`,
                              backgroundColor: backgroundColor,
                              opacity: 0.8,
                              zIndex: 1,
                            }}
                          />
                        )}

                      {/* 設計區域邊框 */}
                      <div
                        className="absolute border-2 border-blue-500 border-dashed bg-transparent"
                        style={{
                          left: `${(currentProduct.printArea.x / 400) * 100}%`,
                          top: `${(currentProduct.printArea.y / 400) * 100}%`,
                          width: `${
                            (currentProduct.printArea.width / 400) * 100
                          }%`,
                          height: `${
                            (currentProduct.printArea.height / 400) * 100
                          }%`,
                          zIndex: 2,
                        }}
                      />
                    </>
                  )}

                  {/* Design Elements Layer */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 10 }}
                  >
                    <div className="w-full h-full relative">
                      {designElements
                        .filter((element) => !hiddenLayers.has(element.id)) // 過濾隱藏的圖層
                        .map((element) => {
                          if (element.type === "text") {
                            const isEditing = editingText === element.id;
                            return (
                              <div key={element.id}>
                                {/* 文字工具列 */}
                                {showTextToolbar &&
                                  selectedElement &&
                                  selectedElement.id === element.id && (
                                    <div
                                      className="absolute bg-gray-800 text-white rounded-md shadow-lg flex items-center space-x-1 p-1 pointer-events-auto"
                                      style={{
                                        left: `${(element.x / 400) * 100}%`,
                                        top: `${(element.y / 400) * 100}%`,
                                        transform:
                                          "translate(-50%, calc(-100% - 40px))",
                                        zIndex: 1000,
                                      }}
                                    >
                                      {/* 編輯文字按鈕 */}
                                      <button
                                        onClick={() =>
                                          handleStartTextEdit(element)
                                        }
                                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                                        title="編輯文字"
                                      >
                                        ✏️
                                      </button>

                                      {/* 粗體按鈕 */}
                                      <button
                                        onClick={handleToggleBold}
                                        className={`px-2 py-1 text-xs rounded font-bold ${
                                          element.fontWeight === "bold"
                                            ? "bg-yellow-600 text-white"
                                            : "bg-gray-600 hover:bg-gray-500"
                                        }`}
                                        title="粗體"
                                      >
                                        B
                                      </button>

                                      {/* 斜體按鈕 */}
                                      <button
                                        onClick={handleToggleItalic}
                                        className={`px-2 py-1 text-xs rounded italic ${
                                          element.fontStyle === "italic"
                                            ? "bg-yellow-600 text-white"
                                            : "bg-gray-600 hover:bg-gray-500"
                                        }`}
                                        title="斜體"
                                      >
                                        I
                                      </button>

                                      {/* 分隔線 */}
                                      <div className="w-px h-4 bg-gray-500" />

                                      {/* 字體大小調整 */}
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() =>
                                            handleFontSizeChange(-2)
                                          }
                                          className="px-1 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                                          title="縮小字體"
                                        >
                                          A-
                                        </button>
                                        <span className="text-xs px-1 min-w-6 text-center">
                                          {element.fontSize}
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleFontSizeChange(2)
                                          }
                                          className="px-1 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                                          title="放大字體"
                                        >
                                          A+
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                {/* 文字元素 */}
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editingContent}
                                    onChange={(e) =>
                                      setEditingContent(e.target.value)
                                    }
                                    onBlur={handleFinishTextEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleFinishTextEdit();
                                      }
                                      if (e.key === "Escape") {
                                        setEditingText(null);
                                        setEditingContent("");
                                      }
                                    }}
                                    autoFocus
                                    className="absolute bg-white border-2 border-blue-500 p-1 pointer-events-auto z-40"
                                    style={{
                                      left: `${(element.x / 400) * 100}%`,
                                      top: `${(element.y / 400) * 100}%`,
                                      transform: "translate(-50%, -50%)",
                                      fontSize: `${
                                        element.fontSize * (320 / 400)
                                      }px`,
                                      color: element.color,
                                      fontFamily: element.fontFamily,
                                      fontWeight:
                                        element.fontWeight || "normal",
                                      fontStyle: element.fontStyle || "normal",
                                      width: `${editingInputWidth}px`,
                                      border: "2px solid #3b82f6",
                                      borderRadius: "2px",
                                      outline: "none",
                                      textAlign: "center",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className={`absolute bg-opacity-90 border border-blue-400 p-1 pointer-events-auto select-none ${
                                      draggedElement === element.id
                                        ? "cursor-grabbing z-50"
                                        : "cursor-grab hover:bg-opacity-100"
                                    }`}
                                    style={{
                                      left: `${(element.x / 400) * 100}%`,
                                      top: `${(element.y / 400) * 100}%`,
                                      transform: "translate(-50%, -50%)",
                                      fontSize: `${
                                        element.fontSize * (320 / 400)
                                      }px`,
                                      color: element.color,
                                      fontFamily: element.fontFamily,
                                      fontWeight:
                                        element.fontWeight || "normal",
                                      fontStyle: element.fontStyle || "normal",
                                      userSelect: "none",
                                      whiteSpace: "nowrap",
                                    }}
                                    onMouseDown={(e) =>
                                      handleMouseDown(e, element)
                                    }
                                    onClick={() => handleSelectElement(element)}
                                  >
                                    {element.content}
                                  </div>
                                )}
                              </div>
                            );
                          } else if (element.type === "image") {
                            const isSelected =
                              selectedElement &&
                              selectedElement.id === element.id;
                            return (
                              <div
                                key={element.id}
                                className={`absolute pointer-events-auto select-none ${
                                  draggedElement === element.id
                                    ? "cursor-grabbing z-50"
                                    : "cursor-grab"
                                }`}
                                style={{
                                  left: `${(element.x / 400) * 100}%`,
                                  top: `${(element.y / 400) * 100}%`,
                                  width: `${(element.width / 400) * 100}%`,
                                  height: `${(element.height / 400) * 100}%`,
                                  transform: "translate(-50%, -50%)",
                                  transformOrigin: "center",
                                  opacity: element.opacity || 1,
                                }}
                                onMouseDown={(e) => handleMouseDown(e, element)}
                                onClick={() => handleSelectElement(element)}
                              >
                                {/* 圖片內容 */}
                                <img
                                  src={element.url}
                                  alt="設計圖片"
                                  className="w-full h-full object-contain pointer-events-none"
                                  style={{
                                    transform: `rotate(${
                                      element.rotation || 0
                                    }deg)`,
                                  }}
                                  draggable={false}
                                />

                                {/* 選中狀態的邊框和控制點 */}
                                {isSelected && (
                                  <>
                                    {/* 選中邊框 */}
                                    <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

                                    {/* 縮放控制點 */}
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize pointer-events-auto"
                                      style={{ top: "-6px", left: "-6px" }}
                                      onMouseDown={(e) =>
                                        handleMouseDown(e, element, "nw")
                                      }
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize pointer-events-auto"
                                      style={{ top: "-6px", right: "-6px" }}
                                      onMouseDown={(e) =>
                                        handleMouseDown(e, element, "ne")
                                      }
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize pointer-events-auto"
                                      style={{ bottom: "-6px", left: "-6px" }}
                                      onMouseDown={(e) =>
                                        handleMouseDown(e, element, "sw")
                                      }
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize pointer-events-auto"
                                      style={{ bottom: "-6px", right: "-6px" }}
                                      onMouseDown={(e) =>
                                        handleMouseDown(e, element, "se")
                                      }
                                    />

                                    {/* 旋轉控制點 */}
                                    <div
                                      className="absolute w-3 h-3 bg-green-500 border border-white rounded-full cursor-grab pointer-events-auto"
                                      style={{
                                        top: "-20px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                      }}
                                      onMouseDown={(e) =>
                                        handleMouseDown(e, element, "rotate")
                                      }
                                      title="拖曳旋轉"
                                    />
                                  </>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {currentProduct.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    可印刷區域:{" "}
                    {currentProduct.printArea
                      ? `${currentProduct.printArea.width} x ${currentProduct.printArea.height} px`
                      : "準備中..."}
                  </p>
                  <div className="mt-2 flex justify-center space-x-4 text-xs text-gray-500">
                    <span>🎯 點擊工具開始設計</span>
                    <span>📏 虛線框為可印刷區域</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Preview */}
          <div className="flex-1 bg-white border-l border-gray-200">
            <div className="h-full flex flex-col">
              {/* Live Preview */}
              <div className="flex-1 p-8">
                <div className="h-full flex items-center justify-center">
                  <div
                    className="bg-white rounded-lg shadow-xl p-8"
                    style={{ marginTop: "-48px" }}
                  >
                    <h3 className="font-semibold text-gray-900 mb-4 text-center">
                      即時預覽
                    </h3>
                    <ProductPreview
                      productId={currentProduct.id}
                      designElements={designElements}
                      backgroundColor={backgroundColor}
                      width={320}
                      height={320}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalEditor;
