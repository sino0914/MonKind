import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API } from "../../services/api";
import MainContentArea from "./MainContentArea";

// Hooks
import useEditorState from "./hooks/useEditorState";
import useCanvasInteraction from "./hooks/useCanvasInteraction";
import useImageManager from "./hooks/useImageManager";
import useTemplateManager from "./hooks/useTemplateManager";
import useLayerManager from "./hooks/useLayerManager";
import useTextEditor from "./hooks/useTextEditor";

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

// Utils
import {
  calculateCenter,
  exportDesignToImage,
  calculateInputWidth,
} from "./utils/canvasUtils";
import { processImageColor } from "./utils/imageUtils";
import { saveDraft, getStorageInfo } from "./utils/storageUtils";
import { createTools } from "./constants/toolsConfig";

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

  // 狀態相關
  loading = false,
  error = null,

  // 其他配置
  headerContent = null,
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // 內部商品狀態
  const [internalProduct, setInternalProduct] = useState(product);
  const [internalLoading, setInternalLoading] = useState(!product && !!productId);
  const [internalError, setInternalError] = useState(null);
  const [processedMockupImage, setProcessedMockupImage] = useState(null);

  // 用於避免初始化時觸發 onDesignStateChange 的標記
  const isInitialized = useRef(false);

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

  // 使用其他 Hooks
  const canvasInteraction = useCanvasInteraction(editorState, currentProduct);
  const imageManager = useImageManager(editorState, currentProduct);
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

    const scaledFontSize = element.fontSize * (320 / 400);
    const maxWidth = currentProduct?.printArea
      ? (currentProduct.printArea.width / 400) * 320 * 0.8
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

  // 鍵盤事件監聽器（Ctrl+C 和 Ctrl+V）
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          canvasInteraction.handleCopyElement();
        } else if (e.key === "v" || e.key === "V") {
          e.preventDefault();
          canvasInteraction.handlePasteElement();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editorState.selectedElement, canvasInteraction.copiedElement]);

  // 保存草稿
  const handleSaveDraft = () => {
    const defaultName = `${
      currentProduct?.title || "作品"
    } - ${new Date().toLocaleDateString("zh-TW")}`;
    const finalWorkName = editorState.workName.trim() || defaultName;

    const result = saveDraft(
      currentProduct?.id || productId,
      {
        elements: editorState.designElements,
        backgroundColor: editorState.backgroundColor,
        workName: finalWorkName,
      },
      draftId
    );

    console.log('儲存結果:', result);

    if (result.success) {
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
  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({
        elements: editorState.designElements,
        backgroundColor: editorState.backgroundColor,
      });
    } else if (currentProduct) {
      const customProduct = {
        ...currentProduct,
        id: `custom_${Date.now()}`,
        title: `客製化 ${currentProduct.title}`,
        price: currentProduct.price + 50,
        isCustom: true,
        designData: {
          elements: editorState.designElements,
          backgroundColor: editorState.backgroundColor,
        },
      };
      addToCart(customProduct);
      alert("客製化商品已加入購物車！");
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
                  />
                );
              case "background":
                return (
                  <BackgroundPanel
                    backgroundColor={editorState.backgroundColor}
                    setBackgroundColor={editorState.setBackgroundColor}
                  />
                );
              case "layers":
                return (
                  <LayerPanel
                    designElements={editorState.designElements}
                    selectedElement={editorState.selectedElement}
                    hiddenLayers={editorState.hiddenLayers}
                    handleSelectElement={editorState.selectElement}
                    toggleLayerVisibility={layerManager.toggleLayerVisibility}
                    moveLayerUp={layerManager.moveLayerUp}
                    moveLayerDown={layerManager.moveLayerDown}
                    handleDeleteElement={editorState.deleteElement}
                    backgroundColor={editorState.backgroundColor}
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
          selectedElement={editorState.selectedElement}
          editingText={editorState.editingText}
          editingContent={editorState.editingContent}
          setEditingContent={editorState.setEditingContent}
          showTextToolbar={editorState.showTextToolbar}
          draggedElement={canvasInteraction.draggedElement}
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
          measureTextWidth={textEditor.measureTextWidth}
          editingInputWidth={editingInputWidth}
          processedMockupImage={processedMockupImage}
        />
      </div>
    </div>
  );
};

export default UniversalEditor;
