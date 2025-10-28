import React from 'react';
import TextEditingInput from './TextEditingInput';
import CropOverlay from './CropOverlay';
import { CANVAS_SIZE, DISPLAY_SIZE } from '../constants/editorConfig';

/**
 * 設計元素圖層組件
 * 負責渲染所有設計元素(文字、圖片)及其互動層(選取框、控制點)
 */
const DesignElementsLayer = ({
  // 商品相關
  currentProduct,

  // 設計元素
  designElements,
  hiddenLayers,
  lockedLayers,

  // 選擇和編輯狀態
  selectedElement,
  editingText,
  editingContent,
  setEditingContent,
  draggedElement,

  // 圖片替換相關
  isReplacingImage,
  replacingImageId,
  getDisplayUrl,

  // 圖片載入錯誤管理
  markImageAsError,
  clearImageError,

  // 剪裁相關（蒙版模式）
  croppingElement,
  maskRect,
  onUpdateMaskRect,
  onUpdateElement,
  onApplyCrop,
  onCancelCrop,
  onResetCrop,

  // 事件處理函數
  handleMouseDown,
  handleSelectElement,
  handleFinishTextEdit,
  handleStartTextEdit,
  handleDeleteElement,

  // 測量函數
  measureTextWidth,
  editingInputWidth,
}) => {
  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 10, pointerEvents: 'none' }}
    >
      <div
        className="w-full h-full relative"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          // 阻止事件冒泡到畫布，避免取消選取
          // 但只阻止冒泡，不阻止預設行為，讓子元素的點擊事件正常執行
          e.stopPropagation();
        }}
      >
        {/* 設計區域裁切容器 - 只裁切元素內容，不裁切選取框 */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: `${(currentProduct.printArea.x / 400) * 100}%`,
            top: `${(currentProduct.printArea.y / 400) * 100}%`,
            width: `${(currentProduct.printArea.width / 400) * 100}%`,
            height: `${(currentProduct.printArea.height / 400) * 100}%`,
          }}
        >
          {/* 元素內容渲染區 - 使用負偏移回到畫布原點 */}
          <div
            className="absolute"
            style={{
              left: `${
                -(currentProduct.printArea.x / currentProduct.printArea.width) * 100
              }%`,
              top: `${
                -(currentProduct.printArea.y / currentProduct.printArea.height) * 100
              }%`,
              width: `${(400 / currentProduct.printArea.width) * 100}%`,
              height: `${(400 / currentProduct.printArea.height) * 100}%`,
            }}
          >
            {designElements
              .filter((element) => !hiddenLayers.has(element.id))
              .map((element) => {
                if (element.type === "text") {
                  const isEditing = editingText === element.id;
                  return (
                    <div key={element.id}>
                      {/* 文字元素 */}
                      {isEditing ? (
                        <TextEditingInput
                          element={element}
                          editingContent={editingContent}
                          onContentChange={setEditingContent}
                          onFinishEdit={handleFinishTextEdit}
                          inputWidth={editingInputWidth}
                        />
                      ) : (
                        <div
                          className="absolute pointer-events-none select-none"
                          style={{
                            left: `${(element.x / 400) * 100}%`,
                            top: `${(element.y / 400) * 100}%`,
                            transform: "translate(-50%, -50%)",
                            transformOrigin: "center",
                          }}
                        >
                          {/* 文字內容 */}
                          <div
                            style={{
                              fontSize: `${element.fontSize * (DISPLAY_SIZE / CANVAS_SIZE)}px`,
                              color: element.color,
                              fontFamily: element.fontFamily,
                              fontWeight: element.fontWeight || "normal",
                              fontStyle: element.fontStyle || "normal",
                              userSelect: "none",
                              whiteSpace: "nowrap",
                              transform: `rotate(${element.rotation || 0}deg)`,
                              padding: "4px",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            {element.content}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else if (element.type === "image") {
                  // 使用 getDisplayUrl 獲取實際顯示的 URL（考慮預覽狀態）
                  const displayUrl = getDisplayUrl ? getDisplayUrl(element) : element.url;

                  return (
                    <div
                      key={element.id}
                      className="absolute pointer-events-none select-none"
                      style={{
                        left: `${(element.x / 400) * 100}%`,
                        top: `${(element.y / 400) * 100}%`,
                        width: `${(element.width / 400) * 100}%`,
                        height: `${(element.height / 400) * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
                        transformOrigin: "center",
                        opacity: element.opacity || 1,
                        overflow: 'hidden', // 重要：隱藏超出部分
                      }}
                    >
                      {/* 圖片內容 - 使用蒙版時的特殊處理 */}
                      {/* 測試：強制使用固定蒙版參數（50%, 50%, 寬高=元素寬高） */}
                      {element.hasMask && element.mask ? (
                        <div
                          className="w-full h-full relative"
                          style={{
                            overflow: 'hidden', // 關鍵：隱藏超出蒙版的部分
                          }}
                        >
                          {/* 使用 clip-path 裁切圖片 - 但剪裁模式中不套用 */}
                          <img
                            src={displayUrl}
                            alt="設計圖片"
                            className="w-full h-full pointer-events-none"
                            style={{
                              objectFit: 'contain',
                              // 只有在非剪裁模式時才套用 clip-path
                              clipPath: (croppingElement && croppingElement.id === element.id) ? 'none' : `inset(
                                ${((element.mask.y - element.mask.height / 2) / element.height) * 100}%
                                ${(1 - (element.mask.x + element.mask.width / 2) / element.width) * 100}%
                                ${(1 - (element.mask.y + element.mask.height / 2) / element.height) * 100}%
                                ${((element.mask.x - element.mask.width / 2) / element.width) * 100}%
                              )`
                            }}
                            draggable={false}
                              onLoad={(e) => {
                                // 圖片載入成功時，清除錯誤狀態並移除錯誤提示
                                if (clearImageError) {
                                  clearImageError(element.id);
                                }
                                e.target.style.display = '';
                                const parent = e.target.parentElement?.parentElement?.parentElement;
                                const placeholder = parent?.querySelector('.image-error-placeholder');
                                if (placeholder) {
                                  placeholder.remove();
                                }
                              }}
                              onError={(e) => {
                                // 圖片載入失敗時，標記錯誤狀態並顯示上傳提示
                                if (markImageAsError) {
                                  markImageAsError(element.id);
                                }
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement?.parentElement?.parentElement;
                                if (parent && !parent.querySelector('.image-error-placeholder')) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'image-error-placeholder w-full h-full flex items-center justify-center bg-blue-50 border-2 border-blue-300 border-dashed rounded';
                                  placeholder.innerHTML = `
                                    <div class="text-center p-2">
                                      <svg class="w-8 h-8 mx-auto mb-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                      </svg>
                                      <div class="text-xs text-blue-600 font-medium whitespace-nowrap">上傳圖片</div>
                                    </div>
                                  `;
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                        </div>
                      ) : (
                        <img
                          src={displayUrl}
                          alt="設計圖片"
                          className="w-full h-full object-contain pointer-events-none"
                          draggable={false}
                          onLoad={(e) => {
                          // 圖片載入成功時，清除錯誤狀態並移除錯誤提示
                          if (clearImageError) {
                            clearImageError(element.id);
                          }
                          e.target.style.display = '';
                          const parent = e.target.parentElement;
                          const placeholder = parent?.querySelector('.image-error-placeholder');
                          if (placeholder) {
                            placeholder.remove();
                          }
                        }}
                        onError={(e) => {
                          // 圖片載入失敗時，標記錯誤狀態並顯示上傳提示
                          if (markImageAsError) {
                            markImageAsError(element.id);
                          }
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          if (!parent.querySelector('.image-error-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'image-error-placeholder w-full h-full flex items-center justify-center bg-blue-50 border-2 border-blue-300 border-dashed rounded';
                            placeholder.innerHTML = `
                              <div class="text-center p-2">
                                <svg class="w-8 h-8 mx-auto mb-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                                <div class="text-xs text-blue-600 font-medium whitespace-nowrap">上傳圖片</div>
                              </div>
                            `;
                            placeholder.style.transform = `rotate(${element.rotation || 0}deg)`;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                      )}

                      {/* 替換模式提示 */}
                      {isReplacingImage && replacingImageId === element.id && (
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed rounded pointer-events-none"
                          style={{
                            transform: `rotate(${element.rotation || 0}deg)`,
                          }}
                        >
                          <div className="text-4xl">🔄</div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })}
          </div>
        </div>

        {/* 互動層 - 在裁切容器外，可拖曳選取 */}
        {designElements
          .filter((element) => !hiddenLayers.has(element.id))
          .map((element) => {
            const isSelected =
              selectedElement && selectedElement.id === element.id;
            const isLocked = lockedLayers?.has(element.id);

            // 計算文字元素的寬高
            let elementWidth = element.width || 100;
            let elementHeight = element.height || 30;

            if (element.type === "text") {
              // 文字元素使用測量的寬度
              const textWidth = measureTextWidth(
                element.content,
                element.fontSize,
                element.fontFamily,
                element.fontWeight,
                element.fontStyle
              );
              elementWidth = textWidth * (DISPLAY_SIZE / CANVAS_SIZE);
              elementHeight = element.fontSize * (DISPLAY_SIZE / CANVAS_SIZE) * 1.5;
            }

            return (
              <React.Fragment key={`interaction-${element.id}`}>
                {/* 主要互動層（元素框） */}
                <div
                  className={`absolute pointer-events-auto ${
                    isLocked
                      ? "cursor-not-allowed"
                      : draggedElement === element.id
                      ? "cursor-grabbing z-50"
                      : "cursor-grab"
                  }`}
                  style={{
                    left: `${(element.x / 400) * 100}%`,
                    top: `${(element.y / 400) * 100}%`,
                    width:
                      element.type === "text"
                        ? `${elementWidth}px`
                        : `${(element.width / 400) * 100}%`,
                    height:
                      element.type === "text"
                        ? `${elementHeight}px`
                        : `${(element.height / 400) * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${
                      element.rotation || 0
                    }deg)`,
                    transformOrigin: "center",
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element)}
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止冒泡到畫布
                    handleSelectElement(element);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    // 雙擊文字元素進入編輯模式
                    if (element.type === 'text' && !isLocked) {
                      handleStartTextEdit(element);
                    }
                  }}
                >
                {/* 選取框 */}
                {isSelected && (
                  <>
                    {/* 原本的元素框線 - 當有 mask 時隱藏 */}
                    {!element.hasMask && (
                      <div className={`absolute inset-0 border-2 ${
                        isLocked
                          ? "border-orange-500"
                          : "border-blue-500"
                      } pointer-events-none z-40`} style={{ backgroundColor: 'transparent' }} />
                    )}

                    {/* 鎖定圖層顯示鎖定圖示 */}
                    {isLocked && (
                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-bl pointer-events-none">
                        🔒
                      </div>
                    )}

                    {/* 縮放控制點 - 圖片和文字都顯示，且未鎖定、未編輯、無 mask */}
                    {(element.type === "image" || (element.type === "text" && editingText !== element.id)) && !isLocked && !element.hasMask && (
                      <>
                        <div
                          className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize pointer-events-auto"
                          style={{
                            top: "-6px",
                            left: "-6px",
                          }}
                          onMouseDown={(e) => handleMouseDown(e, element, "nw")}
                        />
                        <div
                          className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize pointer-events-auto"
                          style={{
                            top: "-6px",
                            right: "-6px",
                          }}
                          onMouseDown={(e) => handleMouseDown(e, element, "ne")}
                        />
                        <div
                          className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize pointer-events-auto"
                          style={{
                            bottom: "-6px",
                            left: "-6px",
                          }}
                          onMouseDown={(e) => handleMouseDown(e, element, "sw")}
                        />
                        <div
                          className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize pointer-events-auto"
                          style={{
                            bottom: "-6px",
                            right: "-6px",
                          }}
                          onMouseDown={(e) => handleMouseDown(e, element, "se")}
                        />
                      </>
                    )}

                    {/* 旋轉控制點 - 圖片和文字都顯示，且未鎖定、無 mask */}
                    {!isLocked && !element.hasMask && (
                      <div
                        className="absolute w-3 h-3 bg-green-500 border border-white rounded-full pointer-events-auto"
                        style={{
                          top: "-20px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          cursor:
                            'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>\') 12 12, auto',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element, "rotate")}
                        title="拖曳旋轉"
                      />
                    )}

                    {/* 刪除按鈕 - 未鎖定且無 mask 才顯示 */}
                    {!isLocked && !element.hasMask && (
                      <button
                        className="absolute w-6 h-6 bg-red-500 hover:bg-red-600 text-white border border-white rounded-full pointer-events-auto flex items-center justify-center text-xs font-bold transition-colors"
                        style={{
                          top: "-12px",
                          right: "-12px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement(element.id);
                        }}
                        title="刪除元素"
                      >
                        ✕
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* 裁剪區域框 - 顯示 mask 的實際範圍（不在剪裁模式時顯示） */}
              {element.type === "image" && element.hasMask && element.mask && !croppingElement && isSelected && (() => {
                // 計算考慮旋轉後的 mask 中心點位置
                const rotation = (element.rotation || 0) * Math.PI / 180;

                // mask 相對於元素左上角的偏移
                const maskOffsetX = element.mask.x - element.width / 2;
                const maskOffsetY = element.mask.y - element.height / 2;

                // 應用旋轉矩陣計算實際偏移
                const rotatedOffsetX = maskOffsetX * Math.cos(rotation) - maskOffsetY * Math.sin(rotation);
                const rotatedOffsetY = maskOffsetX * Math.sin(rotation) + maskOffsetY * Math.cos(rotation);

                // 計算 mask 中心點的絕對位置
                const maskCenterX = element.x + rotatedOffsetX;
                const maskCenterY = element.y + rotatedOffsetY;

                return (
                  <div
                    className="absolute"
                    style={{
                      // 使用中心點定位
                      left: `${(maskCenterX / 400) * 100}%`,
                      top: `${(maskCenterY / 400) * 100}%`,
                      width: `${(element.mask.width / 400) * 100}%`,
                      height: `${(element.mask.height / 400) * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
                      transformOrigin: "center",
                      zIndex: 9990,
                    }}
                  onMouseDown={(e) => {
                    console.log('🔵 剪裁框 onMouseDown', { elementId: element.id, hasMask: element.hasMask });
                    e.stopPropagation();
                    handleMouseDown(e, element);
                  }}
                  onClick={(e) => {
                    console.log('🟢 剪裁框 onClick', { elementId: element.id, hasMask: element.hasMask });
                    e.stopPropagation();
                    handleSelectElement(element);
                  }}
                >
                  {/* 邊框 */}
                  <div
                    className="absolute inset-0 border-2 border-blue-500 pointer-events-none"
                    style={{ backgroundColor: 'transparent' }}
                  />

                  {/* 縮放控制點 - 四個角 */}
                  {!isLocked && (
                    <>
                      <div
                        className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize pointer-events-auto"
                        style={{
                          top: "-6px",
                          left: "-6px",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element, "nw")}
                      />
                      <div
                        className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize pointer-events-auto"
                        style={{
                          top: "-6px",
                          right: "-6px",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element, "ne")}
                      />
                      <div
                        className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize pointer-events-auto"
                        style={{
                          bottom: "-6px",
                          left: "-6px",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element, "sw")}
                      />
                      <div
                        className="absolute w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize pointer-events-auto"
                        style={{
                          bottom: "-6px",
                          right: "-6px",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, element, "se")}
                      />
                    </>
                  )}

                  {/* 旋轉控制點 */}
                  {!isLocked && (
                    <div
                      className="absolute w-3 h-3 bg-green-500 border border-white rounded-full pointer-events-auto"
                      style={{
                        top: "-20px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        cursor:
                          'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>\') 12 12, auto',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, element, "rotate")}
                      title="拖曳旋轉"
                    />
                  )}

                  {/* 刪除按鈕 */}
                  {!isLocked && (
                    <button
                      className="absolute w-6 h-6 bg-red-500 hover:bg-red-600 text-white border border-white rounded-full pointer-events-auto flex items-center justify-center text-xs font-bold transition-colors"
                      style={{
                        top: "-12px",
                        right: "-12px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteElement(element.id);
                      }}
                      title="刪除元素"
                    >
                      ✕
                    </button>
                  )}
                </div>
                );
              })()}
            </React.Fragment>
            );
          })}

        {/* 剪裁覆蓋層（蒙版模式） */}
        {croppingElement && maskRect && (
          <CropOverlay
            element={croppingElement}
            maskRect={maskRect}
            onUpdateMaskRect={onUpdateMaskRect}
            onUpdateElement={onUpdateElement}
            onApply={onApplyCrop}
            onCancel={onCancelCrop}
            onReset={onResetCrop}
            currentProduct={currentProduct}
          />
        )}
      </div>
    </div>
  );
};

export default DesignElementsLayer;
