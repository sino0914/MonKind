import React from 'react';
import TextEditingInput from './TextEditingInput';
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

  // 事件處理函數
  handleMouseDown,
  handleSelectElement,
  handleFinishTextEdit,
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
      <div className="w-full h-full relative" style={{ pointerEvents: 'auto' }}>
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
                        transform: "translate(-50%, -50%)",
                        transformOrigin: "center",
                        opacity: element.opacity || 1,
                      }}
                    >
                      {/* 圖片內容 */}
                      <img
                        src={displayUrl}
                        alt="設計圖片"
                        className="w-full h-full object-contain pointer-events-none"
                        style={{
                          transform: `rotate(${element.rotation || 0}deg)`,
                        }}
                        draggable={false}
                        onLoad={(e) => {
                          // 圖片載入成功時，移除錯誤提示（如果有）
                          e.target.style.display = '';
                          const parent = e.target.parentElement;
                          const placeholder = parent?.querySelector('.image-error-placeholder');
                          if (placeholder) {
                            placeholder.remove();
                          }
                        }}
                        onError={(e) => {
                          // 圖片載入失敗時顯示錯誤提示
                          e.target.style.display = 'none';
                          const parent = e.target.parentElement;
                          if (!parent.querySelector('.image-error-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'image-error-placeholder w-full h-full flex items-center justify-center bg-red-100 border-2 border-red-300 border-dashed rounded';
                            placeholder.innerHTML = `
                              <div class="text-center p-2">
                                <div class="text-3xl mb-1">⚠️</div>
                                <div class="text-xs text-red-600 font-medium whitespace-nowrap">圖片失效</div>
                                <div class="text-xs text-red-500 mt-1 whitespace-nowrap">請重新上傳</div>
                              </div>
                            `;
                            placeholder.style.transform = `rotate(${element.rotation || 0}deg)`;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />

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
              <div
                key={`interaction-${element.id}`}
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
              >
                {/* 選取框 */}
                {isSelected && (
                  <>
                    <div className={`absolute inset-0 border-2 ${
                      isLocked
                        ? "border-orange-500"
                        : "border-blue-500"
                    } pointer-events-none`} style={{ backgroundColor: 'transparent' }} />

                    {/* 鎖定圖層顯示鎖定圖示 */}
                    {isLocked && (
                      <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-bl pointer-events-none">
                        🔒
                      </div>
                    )}

                    {/* 縮放控制點 - 只有圖片才顯示，且未鎖定 */}
                    {element.type === "image" && !isLocked && (
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

                    {/* 旋轉控制點 - 圖片和文字都顯示，且未鎖定 */}
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

                    {/* 刪除按鈕 - 未鎖定才顯示 */}
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
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default DesignElementsLayer;
