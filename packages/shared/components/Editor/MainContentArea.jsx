import React, { useMemo, useRef } from "react";
import ProductPreview from "../Preview/ProductPreview";
import TextToolbar from "./components/TextToolbar";
import CanvasArea from "./components/CanvasArea";
import { calculateSelectionBoxBounds } from './utils/canvasUtils';
import { TOOLBAR_MARGIN } from './constants/editorConfig';

const MainContentArea = ({
  // 商品相關
  currentProduct,

  // 設計元素
  designElements,
  backgroundColor,
  hiddenLayers,
  lockedLayers,

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

  // 圖片去背相關
  onRemoveBackground,
  isRemovingBackground,

  // 圖片上傳相關
  onUploadImage,

  // 自由變形相關
  isFreeTransform,
  onToggleFreeTransform,

  // 剪裁相關
  onStartCrop,
  croppingElement,
  maskRect,
  onUpdateMaskRect,
  onUpdateElement,
  onApplyCrop,
  onCancelCrop,
  onResetCrop,

  // 圖片載入錯誤狀態
  imageLoadErrors,
  markImageAsError,
  clearImageError,

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

  // Preview Ref (用於快照)
  previewRef,
}) => {
  return (
    <div className="flex-1 flex">
      {/* Canvas Area */}
      <div className="flex-1 bg-gray-50 p-4">
        <div className="h-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full h-full ">
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
              {/* Canvas 區域 */}
              <div className="canvas-wrapper" style={{ position: 'relative' }}>
                <CanvasArea
                  currentProduct={currentProduct}
                  processedMockupImage={processedMockupImage}
                  designElements={designElements}
                  backgroundColor={backgroundColor}
                  hiddenLayers={hiddenLayers}
                  lockedLayers={lockedLayers}
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
                  handleStartTextEdit={handleStartTextEdit}
                  handleDeleteElement={handleDeleteElement}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  measureTextWidth={measureTextWidth}
                  editingInputWidth={editingInputWidth}
                  viewport={viewport}
                  markImageAsError={markImageAsError}
                  clearImageError={clearImageError}
                  croppingElement={croppingElement}
                  maskRect={maskRect}
                  onUpdateMaskRect={onUpdateMaskRect}
                  onUpdateElement={onUpdateElement}
                  onApplyCrop={onApplyCrop}
                  onCancelCrop={onCancelCrop}
                  onResetCrop={onResetCrop}
                  isFreeTransform={isFreeTransform}
                  onToggleFreeTransform={onToggleFreeTransform}
                />

                {/* 工具列容器 - 與 Canvas 內容使用相同的 transform */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    zIndex: 9999,
                    pointerEvents: 'none',
                    transformOrigin: 'center center',
                    transform: viewport
                      ? `scale(${viewport.zoom}) translate(${viewport.pan.x}px, ${viewport.pan.y}px)`
                      : 'none',
                    transition: viewport?.isPanning ? 'none' : 'transform 0.1s ease-out',
                    width: '100%',
                    height: '100%',
                    left: '0',
                    top: '0',
                  }}
                >
              {/* 文字工具列 */}
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
                      <div key={`toolbar-${element.id}`} style={{ pointerEvents: 'auto' }}>
                        <TextToolbar
                          element={element}
                          onStartEdit={handleStartTextEdit}
                          onToggleBold={handleToggleBold}
                          onToggleItalic={handleToggleItalic}
                          onFontSizeChange={handleFontSizeChange}
                          onColorChange={handleColorChange}
                          onFontFamilyChange={handleFontFamilyChange}
                          onCopyAndPaste={handleCopyAndPaste}
                          viewport={viewport}
                        />
                      </div>
                    );
                  }
                  return null;
                })}

              {/* 圖片工具列 - 剪裁模式時隱藏 */}
              {!croppingElement && designElements
                .filter((element) => !hiddenLayers.has(element.id))
                .map((element) => {
                  if (
                    element.type === "image" &&
                    selectedElement &&
                    selectedElement.id === element.id
                  ) {
                    // 計算選取框邊界（考慮旋轉和 hasMask）
                    const bounds = calculateSelectionBoxBounds(element);

                    // 計算工具列位置：選取框頂部上方
                    const toolbarTop = bounds.top - TOOLBAR_MARGIN;

                    const left = `${(bounds.centerX / 400) * 100}%`;
                    const top = `${(toolbarTop / 400) * 100}%`;

                    // 檢查圖片是否載入失敗
                    const isImageBroken = imageLoadErrors && imageLoadErrors.has(element.id);

                    return (
                      <div
                        key={`image-toolbar-${element.id}`}
                        className="absolute pointer-events-auto"
                        style={{
                          left,
                          top,
                          // 置中對齊，並向上移動工具列自身的高度
                          transform: "translate(-50%, -100%)",
                          transformOrigin: 'center bottom',
                          zIndex: 10000,
                        }}
                      >
                        {/* 圖片工具列 */}
                        <div
                          className="bg-gray-800 text-white rounded-md shadow-lg flex items-center space-x-1 p-1 whitespace-nowrap"
                          style={{
                            // 內層只處理反向縮放
                            transform: viewport ? `scale(${1 / viewport.zoom})` : 'none',
                            transformOrigin: 'center bottom',
                            pointerEvents: 'auto'
                          }}
                        >
                          {/* 上傳按鈕 - 僅在圖片失效時顯示 */}
                          {isImageBroken && onUploadImage && (
                            <button
                              onClick={() => onUploadImage(element)}
                              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                              title="上傳圖片"
                            >
                              📤上傳
                            </button>
                          )}

                          {/* 替換按鈕 - 始終顯示 */}
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

                          {/* 複製按鈕 - 始終顯示（包含圖片失效時） */}
                          <button
                            onClick={handleCopyAndPaste}
                            className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded"
                            title="複製並貼上"
                          >
                            📋複製
                          </button>

                          {/* 去背按鈕 - 僅在圖片正常時顯示 */}
                          {!isImageBroken && (
                            <button
                              onClick={() => onRemoveBackground(element)}
                              disabled={isRemovingBackground}
                              className={`px-2 py-1 text-xs rounded transition-all ${
                                isRemovingBackground
                                  ? 'bg-gray-500 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-700'
                              }`}
                              title={isRemovingBackground ? '處理中...' : '移除背景'}
                            >
                              {isRemovingBackground ? '⏳處理中...' : '✂️去背'}
                            </button>
                          )}

                          {/* 自由變形按鈕 - 始終顯示（包含圖片失效時） */}
                          {onToggleFreeTransform && (
                            <button
                              onClick={onToggleFreeTransform}
                              className={`px-2 py-1 text-xs rounded transition-all ${
                                isFreeTransform
                                  ? 'bg-yellow-600 hover:bg-yellow-700'
                                  : 'bg-gray-600 hover:bg-gray-700'
                              }`}
                              title={isFreeTransform ? '退出自由變形（非等比例縮放）' : '自由變形（非等比例縮放）'}
                            >
                              {isFreeTransform ? '🔲啟用中' : '🔲變形'}
                            </button>
                          )}

                          {/* 剪裁按鈕 - 僅在圖片正常時顯示 */}
                          {!isImageBroken && onStartCrop && (
                            <button
                              onClick={() => onStartCrop(element)}
                              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                              title="剪裁圖片"
                            >
                              ✂️剪裁
                            </button>
                          )}
                        </div>
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
          <div className="flex-1 p-4">
            <div className="h-full flex items-center justify-center">
              <div
                ref={previewRef}
                className="bg-white rounded-lg shadow-xl p-2 w-full max-w-[calc(100%-2rem)] h-full max-h-[calc(100vh-200px)]"
              >
                <h3 className="font-semibold text-gray-900 mb-2 text-center">
                  即時預覽
                </h3>
                <div className="w-full h-full flex items-center justify-center">
                  <ProductPreview
                    productId={currentProduct.id}
                    designElements={designElements}
                    backgroundColor={backgroundColor}
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContentArea;
