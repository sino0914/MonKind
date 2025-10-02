import React from 'react';
import TextEditingInput from './TextEditingInput';

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

  // 選擇和編輯狀態
  selectedElement,
  editingText,
  editingContent,
  setEditingContent,
  draggedElement,

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
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <div className="w-full h-full relative">
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
                              fontSize: `${element.fontSize * (320 / 400)}px`,
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
                        src={element.url}
                        alt="設計圖片"
                        className="w-full h-full object-contain pointer-events-none"
                        style={{
                          transform: `rotate(${element.rotation || 0}deg)`,
                        }}
                        draggable={false}
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
              elementWidth = textWidth * (320 / 400);
              elementHeight = element.fontSize * (320 / 400) * 1.5;
            }

            return (
              <div
                key={`interaction-${element.id}`}
                className={`absolute pointer-events-auto ${
                  draggedElement === element.id
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
                onClick={() => handleSelectElement(element)}
              >
                {/* 選取框 */}
                {isSelected && (
                  <>
                    <div className="absolute inset-0 border-2 border-blue-500 bg-blue-50 bg-opacity-10 pointer-events-none" />

                    {/* 縮放控制點 - 只有圖片才顯示 */}
                    {element.type === "image" && (
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

                    {/* 旋轉控制點 - 圖片和文字都顯示 */}
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

                    {/* 刪除按鈕 */}
                    <button
                      className="absolute w-6 h-6 bg-red-500 hover:bg-red-600 text-white border border-white rounded-full pointer-events-auto flex items-center justify-center text-xs font-bold transition-colors"
                      style={{
                        top: "-12px",
                        right: "-12px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `確定要刪除這個${
                              element.type === "text" ? "文字" : "圖片"
                            }嗎？`
                          )
                        ) {
                          handleDeleteElement(element.id);
                        }
                      }}
                      title="刪除元素"
                    >
                      ✕
                    </button>
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
