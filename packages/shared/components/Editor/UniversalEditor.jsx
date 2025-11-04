import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../services/api";
import { HttpAPI } from "../../services/HttpApiService";
import MainContentArea from "./MainContentArea";

// Hooks
import useEditorState from "./hooks/useEditorState";
import useCanvasInteraction from "./hooks/useCanvasInteraction";
import useImageManager from "./hooks/useImageManager";
import useTemplateManager from "./hooks/useTemplateManager";
import useLayerManager from "./hooks/useLayerManager";
import useTextEditor from "./hooks/useTextEditor";
import useImageReplace from "./hooks/useImageReplace";
import useCanvasViewport from "./hooks/useCanvasViewport";
import useFreeTransform from "./hooks/useFreeTransform";
import useImageCrop from "./hooks/useImageCrop";

// Components
import { ToolSidebar, TopToolbar, LoadingState, ErrorState } from "./components";
import {
  TemplatePanel,
  ElementPanel,
  TextPanel,
  ImagePanel,
  BackgroundPanel,
  LayerPanel,
} from "./components/ToolPanels";

// Constants
import { CANVAS_SIZE, DISPLAY_SIZE } from "./constants/editorConfig";

// Utils
import {
  calculateCenter,
  exportDesignToImage,
  calculateInputWidth,
} from "./utils/canvasUtils";
import { processImageColor } from "./utils/imageUtils";
import { saveDraft, getStorageInfo } from "./utils/storageUtils";
import { createTools } from "./constants/toolsConfig";
import { removeImageBackground } from "./utils/backgroundRemoval";

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
  initialWorkName = "",
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
  onDesignStateChange = null, // 當設計狀態變化時的回調

  // 草稿相關
  draftId = null, // 用於更新現有草稿的ID
  isEditingFromCart = false, // 是否從購物車編輯

  // 狀態相關
  loading = false,
  error = null,

  // 其他配置
  headerContent = null,

  // 權限相關
  isAdmin = false, // 是否為管理員
}) => {
  const navigate = useNavigate();

  // 內部商品狀態
  const [internalProduct, setInternalProduct] = useState(product);
  const [internalLoading, setInternalLoading] = useState(!product && !!productId);
  const [internalError, setInternalError] = useState(null);
  const [processedMockupImage, setProcessedMockupImage] = useState(null);

  // 用於避免初始化時觸發 onDesignStateChange 的標記
  const isInitialized = useRef(false);

  // Preview 的 ref，用於截取快照
  const previewRef = useRef(null);

  // 去背處理狀態
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);

  // 使用外部傳入的product或內部載入的product
  const currentProduct = product || internalProduct;
  const currentLoading = loading || internalLoading;
  const currentError = error || internalError;

  // 使用 EditorState Hook
  const editorState = useEditorState(
    initialElements,
    initialBackgroundColor,
    initialWorkName
  );

  // 使用圖片替換 Hook
  const imageReplace = useImageReplace(editorState);

  // 使用畫布視窗控制 Hook
  const viewport = useCanvasViewport();

  // 使用自由變形 Hook
  const freeTransform = useFreeTransform();

  // 使用圖片剪裁 Hook
  const imageCrop = useImageCrop(editorState);

  // 使用其他 Hooks
  const imageManager = useImageManager(editorState, imageReplace);
  const canvasInteraction = useCanvasInteraction(
    editorState,
    currentProduct,
    imageReplace,
    imageManager.draggingImageUrl,
    viewport,
    freeTransform.isFreeTransform,
    imageManager.handleAddImageToCanvas
  );
  const templateManager = useTemplateManager(
    currentProduct,
    mode,
    showTemplateTools,
    editorState
  );
  const layerManager = useLayerManager(editorState);
  const textEditor = useTextEditor(editorState);

  // 計算工具列表
  const tools = useMemo(() => createTools(showTemplateTools), [showTemplateTools]);

  // 計算編輯中文字的實際寬度
  const editingInputWidth = useMemo(() => {
    if (!editorState.editingText || !editorState.editingContent) return 100;

    const element = editorState.designElements.find(
      (el) => el.id === editorState.editingText
    );
    if (!element) return 100;

    const scaledFontSize = element.fontSize * (DISPLAY_SIZE / CANVAS_SIZE);
    const maxWidth = currentProduct?.printArea
      ? (currentProduct.printArea.width / CANVAS_SIZE) * DISPLAY_SIZE * 0.8
      : 300;

    return calculateInputWidth(
      editorState.editingContent,
      scaledFontSize,
      element.fontFamily || "Arial",
      element.fontWeight || "normal",
      element.fontStyle || "normal",
      maxWidth
    );
  }, [
    editorState.editingText,
    editorState.editingContent,
    editorState.designElements,
    currentProduct,
  ]);

  // 監聽初始化資料變化，更新內部狀態（僅在產品模式下）
  useEffect(() => {
    if (mode === "product" && initialElements) {
      editorState.setDesignElements(initialElements);
    }
  }, [initialElements, mode]);

  useEffect(() => {
    if (mode === "product" && initialBackgroundColor) {
      editorState.setBackgroundColor(initialBackgroundColor);
    }
  }, [initialBackgroundColor, mode]);

  useEffect(() => {
    if (mode === "product" && initialWorkName !== undefined) {
      editorState.setWorkName(initialWorkName);
      editorState.setEditingNameValue(initialWorkName);
    }
  }, [initialWorkName, mode]);

  // 載入版型數據（僅在template模式）
  useEffect(() => {
    if (template && mode === "template") {
      if (template.elements && Array.isArray(template.elements)) {
        editorState.setDesignElements(template.elements);
      }
      if (template.backgroundColor) {
        editorState.setBackgroundColor(template.backgroundColor);
      }
    }
  }, [template, mode]);

  // 處理商品圖片（保持原始圖片，不進行顏色處理）
  useEffect(() => {
    if (currentProduct?.mockupImage) {
      setProcessedMockupImage(currentProduct.mockupImage);
    } else {
      setProcessedMockupImage(null);
    }
  }, [currentProduct?.mockupImage]);

  // 當設計元素改變時，通知外部
  useEffect(() => {
    if (onElementsChange) {
      onElementsChange(editorState.designElements);
    }
  }, [editorState.designElements, onElementsChange]);

  // 當背景顏色改變時，通知外部
  useEffect(() => {
    if (onBackgroundColorChange) {
      onBackgroundColorChange(editorState.backgroundColor);
    }
  }, [editorState.backgroundColor, onBackgroundColorChange]);

  // 通知外部設計狀態變化
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    if (onDesignStateChange) {
      onDesignStateChange({
        elements: editorState.designElements,
        backgroundColor: editorState.backgroundColor,
      });
    }
  }, [editorState.designElements, editorState.backgroundColor, onDesignStateChange]);

  // 鍵盤事件監聽 - Del 按鍵刪除選中元素
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 如果正在編輯文字，不處理 Del 鍵
      if (editorState.editingText) return;

      // 如果在輸入框中，不處理
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Delete 或 Backspace 鍵
      if (e.key === 'Delete' || e.key === 'Del') {
        if (editorState.selectedElement) {
          e.preventDefault();
          editorState.deleteElement(editorState.selectedElement.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorState.selectedElement, editorState.editingText, editorState.deleteElement]);

  // 當選取元素改變或取消選取時，自動關閉自由變形
  useEffect(() => {
    if (freeTransform.isFreeTransform) {
      freeTransform.disableFreeTransform();
      console.log('🔲 元素選取改變，自動關閉自由變形模式');
    }
  }, [editorState.selectedElement?.id]);

  // 載入商品資料
  const loadProduct = async () => {
    if (!productId || product) return;

    try {
      setInternalLoading(true);
      setInternalError(null);

      const foundProduct = await API.products.getById(parseInt(productId));

      if (!foundProduct) {
        setInternalError("PRODUCT_NOT_FOUND");
        return;
      }

      if (foundProduct.isActive === false) {
        setInternalError("PRODUCT_INACTIVE");
        return;
      }

      if (!foundProduct.printArea) {
        foundProduct.printArea = { x: 50, y: 50, width: 200, height: 150 };
      }

      setInternalProduct(foundProduct);
    } catch (error) {
      if (error.message.includes("找不到")) {
        setInternalError("PRODUCT_NOT_FOUND");
      } else {
        setInternalError("LOAD_FAILED");
      }
    } finally {
      setInternalLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    if (productId && !product) {
      loadProduct();
    }
  }, [productId, product]);

  // 鍵盤事件監聽器（Ctrl+C、Ctrl+V、Ctrl+Z、Ctrl+Y、ESC）
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      // ESC 鍵取消替換模式
      if (e.key === "Escape" && imageReplace.isReplacingImage) {
        e.preventDefault();
        imageReplace.cancelReplaceMode();
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          canvasInteraction.handleCopyElement();
        } else if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          canvasInteraction.handlePasteElement();
        } else if (e.key === "z" || e.key === "Z") {
          e.preventDefault();
          editorState.undo();
        } else if (e.key === "y" || e.key === "Y") {
          e.preventDefault();
          editorState.redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    editorState.selectedElement,
    editorState.undo,
    editorState.redo,
    canvasInteraction.copiedElement,
    canvasInteraction.handleCopyElement,
    canvasInteraction.handlePasteElement,
    imageReplace.isReplacingImage,
    imageReplace.cancelReplaceMode,
  ]);

  // 保存草稿
  const handleSaveDraft = async () => {
    const defaultName = `${
      currentProduct?.title || "作品"
    } - ${new Date().toLocaleDateString("zh-TW")}`;
    const finalWorkName = editorState.workName.trim() || defaultName;

    const result = await saveDraft(
      currentProduct?.id || productId,
      {
        elements: editorState.designElements,
        backgroundColor: editorState.backgroundColor,
        workName: finalWorkName,
      },
      draftId,
      currentProduct, // 傳遞商品資料用於生成 3D 快照
      previewRef.current // 傳遞 ProductPreview 的 DOM 元素
    );

    console.log('儲存結果:', result);

    if (result.success) {
      editorState.resetDirty(); // 儲存成功後重置骯髒狀態
      alert(`${result.message}`);
    } else {
      const storageInfo = getStorageInfo();
      console.log('儲存失敗時空間使用:', storageInfo);

      // 提供更詳細的錯誤訊息和解決建議
      let errorMessage = result.message;
      errorMessage += `\n\n當前儲存空間使用:\n總計: ${storageInfo.total}\n草稿: ${storageInfo.drafts}\n圖片庫: ${storageInfo.imageLibrary}`;
      errorMessage += '\n\n💡 解決建議：\n1. 刪除不需要的舊草稿\n2. 減少圖片數量或降低圖片品質\n3. 使用「測試輸出」功能匯出設計';

      alert(errorMessage);
    }
  };

  // 加入購物車
  const handleAddToCart = async () => {
    if (onAddToCart) {
      editorState.resetDirty(); // 加入購物車後重置骯髒狀態
      onAddToCart({
        elements: editorState.designElements,
        backgroundColor: editorState.backgroundColor,
      });
    } else if (currentProduct) {
      // 確保產品有廠商資訊
      let vendorId = currentProduct.vendorId;
      if (!vendorId) {
        try {
          console.log('⚠️ 產品沒有廠商資訊，載入並分配第一個廠商');
          const activeVendors = await API.vendors.getActive();
          if (activeVendors.length > 0) {
            vendorId = activeVendors[0].id;
            console.log('✅ 自動分配廠商:', activeVendors[0]);
          } else {
            alert('目前沒有可用的廠商，無法加入購物車');
            return;
          }
        } catch (error) {
          console.error('❌ 載入廠商失敗:', error);
          alert('載入廠商資訊失敗，請稍後再試');
          return;
        }
      }
      // 如果是 3D 商品，生成快照並上傳到伺服器
      let snapshot3D = null;
      const glbUrl = currentProduct?.glbUrl || currentProduct?.model3D?.glbUrl;
      if (currentProduct.type === '3D' && glbUrl) {
        try {
          const { generate3DSnapshot } = await import('./utils/snapshot3D');
          const snapshotBase64 = await generate3DSnapshot(
            currentProduct,
            editorState.designElements,
            editorState.backgroundColor,
            400,
            400
          );
          console.log('✅ 購物車 3D 快照已生成');

          // 上傳快照到伺服器
          try {
            const uploadResult = await API.upload.snapshot(snapshotBase64, currentProduct.id);
            snapshot3D = uploadResult.url; // 儲存 URL 而非 base64
            console.log('✅ 購物車快照已上傳到伺服器:', uploadResult.url);
          } catch (uploadError) {
            console.error('❌ 上傳快照失敗，使用 base64 儲存:', uploadError);
            snapshot3D = snapshotBase64; // 失敗時回退到 base64
          }
        } catch (error) {
          console.error('❌ 生成購物車 3D 快照失敗:', error);
        }
      }

      // 只複製必要的商品欄位，排除 GLB 等大型資料
      const { model3D, ...productWithoutModel } = currentProduct;

      const customProduct = {
        ...productWithoutModel,
        id: `custom_${currentProduct.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalProductId: currentProduct.id, // 保存原始商品 ID
        title: `客製化 ${currentProduct.title}`,
        price: currentProduct.price + 50,
        isCustom: true,
        type: currentProduct.type, // 保留類型
        vendorId, // 包含廠商資訊
        designData: {
          elements: editorState.designElements,
          backgroundColor: editorState.backgroundColor,
        },
        snapshot3D, // 添加快照（URL 或 base64）
      };

      // shared 組件不應直接操作購物車，應由父組件處理
      console.warn('UniversalEditor: onAddToCart prop is required to add products to cart');
      alert("請確保父組件提供了 onAddToCart 回調函數");
      editorState.resetDirty(); // 重置骯髒狀態
    }
  };

  // 測試輸出功能
  const handleTestOutput = async () => {
    try {
      await exportDesignToImage(
        currentProduct,
        editorState.designElements,
        editorState.backgroundColor
      );
      alert("設計區域已成功輸出為圖片！");
    } catch (error) {
      alert("輸出失敗：" + error.message);
    }
  };

  // 添加文字
  const handleAddText = () => {
    const { x: centerX, y: centerY } = calculateCenter(currentProduct?.printArea);

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
      rotation: 0,
    };
    editorState.addElement(newTextElement);
  };

  // 處理替換按鈕點擊
  const handleReplaceClick = useCallback(() => {
    if (imageReplace.isReplacingImage) {
      // 如果已經在替換模式，則取消
      imageReplace.cancelReplaceMode();
    } else {
      // 啟動替換模式
      if (editorState.selectedElement && editorState.selectedElement.type === 'image') {
        imageReplace.startReplaceMode(editorState.selectedElement.id);
        // 自動切換到圖片工具面板
        editorState.setSelectedTool('image');
      }
    }
  }, [
    imageReplace.isReplacingImage,
    editorState.selectedElement,
    imageReplace,
    editorState,
  ]);

  // 處理去背
  const handleRemoveBackground = useCallback(async (element) => {
    if (!element || element.type !== 'image') {
      alert('請選擇一個圖片元素');
      return;
    }

    if (isRemovingBackground) {
      console.log('⚠️ 已經在處理去背中，請稍候');
      return;
    }

    try {
      setIsRemovingBackground(true);
      console.log('🎨 開始去背處理...', element.id);

      // 調用去背函數
      const removedBgImageBase64 = await removeImageBackground(element.url);

      // 更新圖片元素的 URL
      editorState.updateElement(element.id, {
        url: removedBgImageBase64,
      });

      console.log('✅ 去背完成！');
      alert('背景移除成功！');
    } catch (error) {
      console.error('❌ 去背失敗:', error);
      alert(`去背失敗：${error.message}\n\n可能原因：\n1. 圖片格式不支援\n2. 網路連線問題\n3. 圖片太大（建議小於 5MB）`);
    } finally {
      setIsRemovingBackground(false);
    }
  }, [isRemovingBackground, editorState]);

  // 處理失效圖片的上傳
  const handleUploadForBrokenImage = useCallback((element) => {
    if (!element || element.type !== 'image') {
      return;
    }

    // 創建隱藏的 input 元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false; // 只接受單張圖片

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片檔案');
        return;
      }

      // 檢查文件大小（最大 10MB）
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('圖片檔案過大，請選擇小於 10MB 的圖片');
        return;
      }

      try {
        // 使用 imageManager 的上傳邏輯
        const userId = 'guest'; // TODO: 未來需要從登入狀態取得實際的 userId
        const uploadResult = await HttpAPI.upload.editorImage(file, userId);

        // 構建完整的圖片 URL
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
        const imageUrl = uploadResult.url.startsWith('http')
          ? uploadResult.url
          : `${API_BASE_URL.replace('/api', '')}${uploadResult.url}`;

        // 更新元素的 URL
        editorState.updateElement(element.id, {
          url: imageUrl,
        });

        // 添加到圖片庫（與 ImagePanel 同步）
        const newImage = {
          id: uploadResult.filename || Date.now(),
          url: imageUrl,
          name: file.name,
          uploadedAt: new Date().toISOString(),
        };

        // 使用 imageManager 的方法添加到圖片列表
        if (imageManager.addUploadedImage) {
          imageManager.addUploadedImage(newImage);
        }

        console.log('✅ 圖片已上傳並替換，已添加到圖片庫:', uploadResult);
      } catch (error) {
        console.error('圖片上傳失敗:', error);
        alert(`圖片上傳失敗：${error.message || '請稍後重試'}`);
      }
    };

    // 觸發文件選擇
    input.click();
  }, [editorState, imageManager]);

  // 載入狀態
  if (currentLoading) {
    return <LoadingState />;
  }

  // 錯誤狀態
  if (currentError) {
    return (
      <ErrorState
        error={currentError}
        mode={mode}
        onNavigateBack={onNavigateBack || onBack}
        onRetry={loadProduct}
      />
    );
  }

  // 商品不存在
  if (!currentProduct) {
    return (
      <ErrorState
        error="PRODUCT_NOT_FOUND"
        mode={mode}
        onNavigateBack={onNavigateBack || onBack}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Top Toolbar */}
      <TopToolbar
        showTopToolbar={showTopToolbar}
        topToolbarLeft={topToolbarLeft}
        topToolbarRight={topToolbarRight}
        title={title}
        mode={mode}
        currentProduct={currentProduct}
        onNavigateBack={onNavigateBack || onBack}
        workName={editorState.workName}
        isEditingName={editorState.isEditingName}
        editingNameValue={editorState.editingNameValue}
        setWorkName={editorState.setWorkName}
        setIsEditingName={editorState.setIsEditingName}
        setEditingNameValue={editorState.setEditingNameValue}
        onSaveDraft={handleSaveDraft}
        onAddToCart={handleAddToCart}
        onTestOutput={handleTestOutput}
        isEditingFromCart={isEditingFromCart}
        onResetView={viewport.resetView}
        currentZoom={viewport.zoom}
        isDirty={editorState.isDirty}
        onUndo={editorState.undo}
        onRedo={editorState.redo}
        canUndo={editorState.canUndo}
        canRedo={editorState.canRedo}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar - Collapsible Tools */}
        <ToolSidebar
          tools={tools}
          currentTool={tools.find(
            (t) => t.id === (editorState.selectedTool || editorState.hoveredTool)
          )}
          hoveredTool={editorState.hoveredTool}
          selectedTool={editorState.selectedTool}
          setHoveredTool={editorState.setHoveredTool}
          setSelectedTool={editorState.setSelectedTool}
        >
          {(() => {
            const toolId = editorState.selectedTool || editorState.hoveredTool;
            if (!toolId) return null;

            switch (toolId) {
              case "template":
                return (
                  <TemplatePanel
                    availableTemplates={templateManager.availableTemplates}
                    loadingTemplates={templateManager.loadingTemplates}
                    applyTemplate={templateManager.applyTemplate}
                  />
                );
              case "elements":
                return (
                  <ElementPanel
                    managedElements={imageManager.managedElements}
                    loadingElements={imageManager.loadingElements}
                    loadManagedElements={imageManager.loadManagedElements}
                    addManagedElementToDesign={imageManager.addManagedElementToDesign}
                    handleDragStart={imageManager.handleDragStart}
                    handleDragEnd={imageManager.handleDragEnd}
                    isReplacingImage={imageReplace.isReplacingImage}
                    isAdmin={isAdmin}
                    addElement={editorState.addElement}
                  />
                );
              case "text":
                return <TextPanel handleAddText={handleAddText} />;
              case "image":
                return (
                  <ImagePanel
                    uploadedImages={imageManager.uploadedImages}
                    isUploading={imageManager.isUploading}
                    handleImageUpload={imageManager.handleImageUpload}
                    handleAddImageToCanvas={imageManager.handleAddImageToCanvas}
                    handleDeleteUploadedImage={imageManager.handleDeleteUploadedImage}
                    handleDragStart={imageManager.handleDragStart}
                    handleDragEnd={imageManager.handleDragEnd}
                    isReplacingImage={imageReplace.isReplacingImage}
                    uploadErrors={imageManager.uploadErrors}
                    clearUploadErrors={imageManager.clearUploadErrors}
                  />
                );
              case "background":
                return (
                  <BackgroundPanel
                    backgroundColor={editorState.backgroundColor}
                    setBackgroundColor={editorState.changeBackgroundColor}
                  />
                );
              case "layers":
                return (
                  <LayerPanel
                    designElements={editorState.designElements}
                    selectedElement={editorState.selectedElement}
                    hiddenLayers={editorState.hiddenLayers}
                    lockedLayers={editorState.lockedLayers}
                    handleSelectElement={editorState.selectElement}
                    toggleLayerVisibility={layerManager.toggleLayerVisibility}
                    toggleLayerLock={layerManager.toggleLayerLock}
                    renameLayer={layerManager.renameLayer}
                    moveLayerUp={layerManager.moveLayerUp}
                    moveLayerDown={layerManager.moveLayerDown}
                    handleDeleteElement={editorState.deleteElement}
                    backgroundColor={editorState.backgroundColor}
                    reorderLayers={layerManager.reorderLayers}
                  />
                );
              default:
                return null;
            }
          })()}
        </ToolSidebar>

        {/* Main Content Area */}
        <MainContentArea
          currentProduct={currentProduct}
          designElements={editorState.designElements}
          backgroundColor={editorState.backgroundColor}
          hiddenLayers={editorState.hiddenLayers}
          lockedLayers={editorState.lockedLayers}
          selectedElement={editorState.selectedElement}
          editingText={editorState.editingText}
          editingContent={editorState.editingContent}
          setEditingContent={editorState.setEditingContent}
          showTextToolbar={editorState.showTextToolbar}
          draggedElement={canvasInteraction.draggedElement}
          isReplacingImage={imageReplace.isReplacingImage}
          replacingImageId={imageReplace.replacingImageId}
          getDisplayUrl={imageReplace.getDisplayUrl}
          onReplaceClick={handleReplaceClick}
          onRemoveBackground={handleRemoveBackground}
          isRemovingBackground={isRemovingBackground}
          onUploadImage={handleUploadForBrokenImage}
          isFreeTransform={freeTransform.isFreeTransform}
          onToggleFreeTransform={freeTransform.toggleFreeTransform}
          onStartCrop={imageCrop.startCrop}
          croppingElement={imageCrop.croppingElement}
          maskRect={imageCrop.maskRect}
          onUpdateMaskRect={imageCrop.updateMaskRect}
          onUpdateElement={editorState.updateElement}
          onApplyCrop={imageCrop.applyCrop}
          onCancelCrop={imageCrop.cancelCrop}
          onResetCrop={imageCrop.resetCrop}
          imageLoadErrors={editorState.imageLoadErrors}
          isHoveringImage={canvasInteraction.isHoveringImage}
          handleMouseMove={canvasInteraction.handleMouseMove}
          handleMouseUp={canvasInteraction.handleMouseUp}
          handleCanvasClick={canvasInteraction.handleCanvasClick}
          handleMouseDown={canvasInteraction.handleMouseDown}
          handleSelectElement={editorState.selectElement}
          handleFinishTextEdit={textEditor.handleFinishTextEdit}
          handleDeleteElement={editorState.deleteElement}
          handleStartTextEdit={textEditor.handleStartTextEdit}
          handleToggleBold={textEditor.handleToggleBold}
          handleToggleItalic={textEditor.handleToggleItalic}
          handleFontSizeChange={textEditor.handleFontSizeChange}
          handleColorChange={textEditor.handleColorChange}
          handleFontFamilyChange={textEditor.handleFontFamilyChange}
          handleCopyAndPaste={canvasInteraction.handleCopyAndPaste}
          handleDragOver={canvasInteraction.handleDragOver}
          handleDrop={canvasInteraction.handleDrop}
          measureTextWidth={textEditor.measureTextWidth}
          editingInputWidth={editingInputWidth}
          processedMockupImage={processedMockupImage}
          viewport={viewport}
          previewRef={previewRef}
          markImageAsError={editorState.markImageAsError}
          clearImageError={editorState.clearImageError}
        />
      </div>
    </div>
  );
};

export default UniversalEditor;
