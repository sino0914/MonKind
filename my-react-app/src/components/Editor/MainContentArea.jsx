import React, { useMemo } from "react";
import ProductPreview from "../Preview/ProductPreview";
import TextToolbar from "./components/TextToolbar";
import CanvasArea from "./components/CanvasArea";

const MainContentArea = ({
  // 商品相關
  currentProduct,

  // 設計元素
  designElements,
  backgroundColor,
  hiddenLayers,

  // 選擇和編輯狀態
  selectedElement,
  editingText,
  editingContent,
  setEditingContent,
  showTextToolbar,

  // 拖曳相關
  draggedElement,

  // 圖片替換相關
  isReplacingImage,
  replacingImageId,
  getDisplayUrl,
  onReplaceClick,
  isHoveringImage,
  handleDragOver,
  handleDrop,

  // 事件處理函數
  handleMouseMove,
  handleMouseUp,
  handleCanvasClick,
  handleMouseDown,
  handleSelectElement,
  handleFinishTextEdit,
  handleDeleteElement,
  handleStartTextEdit,
  handleToggleBold,
  handleToggleItalic,
  handleFontSizeChange,
  handleColorChange,
  handleFontFamilyChange,
  handleCopyAndPaste,

  // 測量函數
  measureTextWidth,
  editingInputWidth,

  // 處理後的底圖
  processedMockupImage,

  // 視窗控制
  viewport,
}) => {
  return (
    <div className="flex-1 flex">
      {/* Canvas Area */}
      <div className="flex-1 bg-gray-50 p-8">
        <div className="h-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 overflow-visible">
            {/* 顯示全圖按鈕 - 放在 Canvas 上方 */}
            {viewport && (
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  {Math.round(viewport.zoom * 100)}%
                </div>
                <button
                  onClick={viewport.resetView}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors shadow-sm"
                  title="重置視圖縮放和位置 (Ctrl+0)"
                >
                  <span className="mr-1">🔍</span> 顯示全圖 
                </button>
              </div>
            )}
            <div className="relative">
              <CanvasArea
                currentProduct={currentProduct}
                processedMockupImage={processedMockupImage}
                designElements={designElements}
                backgroundColor={backgroundColor}
                hiddenLayers={hiddenLayers}
                selectedElement={selectedElement}
                editingText={editingText}
                editingContent={editingContent}
                setEditingContent={setEditingContent}
                draggedElement={draggedElement}
                isReplacingImage={isReplacingImage}
                replacingImageId={replacingImageId}
                getDisplayUrl={getDisplayUrl}
                onReplaceClick={onReplaceClick}
                isHoveringImage={isHoveringImage}
                handleMouseMove={handleMouseMove}
                handleMouseUp={handleMouseUp}
                handleCanvasClick={handleCanvasClick}
                handleMouseDown={handleMouseDown}
                handleSelectElement={handleSelectElement}
                handleFinishTextEdit={handleFinishTextEdit}
                handleDeleteElement={handleDeleteElement}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                measureTextWidth={measureTextWidth}
                editingInputWidth={editingInputWidth}
                viewport={viewport}
              />

              {/* 文字工具列 - 放在最外層，不受設計區裁切影響 */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1000 }}
              >
              {designElements
                .filter((element) => !hiddenLayers.has(element.id))
                .map((element) => {
                  if (
                    element.type === "text" &&
                    showTextToolbar &&
                    selectedElement &&
                    selectedElement.id === element.id
                  ) {
                    return (
                      <div key={`toolbar-${element.id}`}>
                        <TextToolbar
                          element={element}
                          onStartEdit={handleStartTextEdit}
                          onToggleBold={handleToggleBold}
                          onToggleItalic={handleToggleItalic}
                          onFontSizeChange={handleFontSizeChange}
                          onColorChange={handleColorChange}
                          onFontFamilyChange={handleFontFamilyChange}
                          onCopyAndPaste={handleCopyAndPaste}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
            </div>

            {/* 圖片工具列 - 放在最外層，不受設計區裁切影響 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 1000 }}
            >
              {designElements
                .filter((element) => !hiddenLayers.has(element.id))
                .map((element) => {
                  if (
                    element.type === "image" &&
                    selectedElement &&
                    selectedElement.id === element.id
                  ) {
                    return (
                      <div key={`image-toolbar-${element.id}`}>
                        {/* 圖片工具列 */}
                        <div
                          className="absolute bg-gray-800 text-white rounded-md shadow-lg flex items-center space-x-1 p-1 pointer-events-auto whitespace-nowrap"
                          style={{
                            left: `${(element.x / 400) * 100}%`,
                            top: `${(element.y / 400) * 100}%`,
                            transform:
                              "translate(-50%, calc(-100% - 80px))",
                            zIndex: 1000,
                          }}
                        >
                          {/* 替換按鈕 */}
                          <button
                            onClick={onReplaceClick}
                            className={`px-2 py-1 text-xs rounded transition-all ${
                              isReplacingImage
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : 'bg-gray-600 hover:bg-gray-700'
                            }`}
                            title={isReplacingImage ? '取消替換模式' : '替換圖片'}
                          >
                            🔄替換
                          </button>

                          {/* 複製並貼上按鈕 */}
                          <button
                            onClick={handleCopyAndPaste}
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
                            title="複製並貼上"
                          >
                            📋複製
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
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
                  width={440}
                  height={440}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContentArea;
