import React, { useEffect, useRef } from "react";

/**
 * 展示圖片預覽組件
 * 提供縮放和平移功能，並顯示可調整的設計區域和出血區域
 */
const DisplayImagePreview = ({
  imageUrl,
  viewport,
  onViewportChange,
  printArea,           // 底圖的設計區域
  bleedArea,           // 底圖的出血區域
  designArea,          // 展示圖片上的設計區域配置 { centerX, centerY, scale }
  onDesignAreaDragStart,
  onDesignAreaDragMove,
  onDesignAreaDragEnd,
  onCornerDragStart,
  onCornerDragMove,
  isDragging,
  isResizing,
}) => {
  const containerRef = useRef(null);

  // 同步 viewport 狀態到父組件
  useEffect(() => {
    if (viewport && onViewportChange) {
      onViewportChange({
        zoom: viewport.zoom,
        panX: viewport.pan.x,
        panY: viewport.pan.y,
      });
    }
  }, [viewport?.zoom, viewport?.pan.x, viewport?.pan.y, onViewportChange]);

  // 使用原生事件監聽器來處理滾輪事件，確保能阻止預設行為
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !viewport?.handleWheel) return;

    const handleWheelEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
      viewport.handleWheel(e);
    };

    // 使用 { passive: false } 確保可以調用 preventDefault()
    container.addEventListener('wheel', handleWheelEvent, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [viewport?.handleWheel]);

  // 處理滑鼠移動事件（優先級：角控制點 > 設計區拖拽 > 畫布平移）
  const handleContainerMouseMove = (e) => {
    if (isResizing && onCornerDragMove) {
      // 拖曳角控制點（縮放）
      const rect = e.currentTarget.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      const currentX = ((e.clientX - rect.left) / canvasWidth) * 400;
      const currentY = ((e.clientY - rect.top) / canvasHeight) * 400;
      onCornerDragMove(currentX, currentY);
    } else if (isDragging && onDesignAreaDragMove) {
      // 拖拽設計區域（移動）
      const rect = e.currentTarget.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      const currentX = ((e.clientX - rect.left) / canvasWidth) * 400;
      const currentY = ((e.clientY - rect.top) / canvasHeight) * 400;
      onDesignAreaDragMove(currentX, currentY);
    } else if (viewport?.isPanning && viewport?.handleMouseMove) {
      // 畫布平移
      viewport.handleMouseMove(e);
    }
  };

  // 處理滑鼠按下 - 設計區域拖拽（移動中心點）
  const handleDesignAreaMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!onDesignAreaDragStart) return;

    const rect = e.currentTarget.closest('.canvas-container').getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    const startX = ((e.clientX - rect.left) / canvasWidth) * 400;
    const startY = ((e.clientY - rect.top) / canvasHeight) * 400;

    onDesignAreaDragStart(e, startX, startY);
  };

  // 處理滑鼠按下 - 角控制點拖曳（等比例縮放）
  const handleCornerMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!onCornerDragStart) return;

    const rect = e.currentTarget.closest('.canvas-container').getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    const startX = ((e.clientX - rect.left) / canvasWidth) * 400;
    const startY = ((e.clientY - rect.top) / canvasHeight) * 400;

    onCornerDragStart(e, startX, startY);
  };

  // 處理滑鼠放開
  const handleMouseUp = (e) => {
    if ((isDragging || isResizing) && onDesignAreaDragEnd) {
      onDesignAreaDragEnd();
    }
    if (viewport?.handleMouseUp) {
      viewport.handleMouseUp(e);
    }
  };

  const zoom = viewport?.zoom ?? 1.0;
  const panX = viewport?.pan?.x ?? 0;
  const panY = viewport?.pan?.y ?? 0;

  // 計算設計區域的實際位置和大小
  const getDesignAreaBounds = () => {
    if (!printArea || !designArea) return null;

    const { centerX, centerY, scale } = designArea;
    const scaledWidth = printArea.width * scale;
    const scaledHeight = printArea.height * scale;

    return {
      x: centerX - scaledWidth / 2,
      y: centerY - scaledHeight / 2,
      width: scaledWidth,
      height: scaledHeight
    };
  };

  // 計算出血區域的實際位置和大小
  const getBleedAreaBounds = () => {
    if (!bleedArea || !designArea) return null;

    const designBounds = getDesignAreaBounds();
    if (!designBounds) return null;

    const { scale } = designArea;

    // 計算出血值
    let bleedTop, bleedRight, bleedBottom, bleedLeft;
    if (bleedArea.mode === 'uniform') {
      bleedTop = bleedRight = bleedBottom = bleedLeft = bleedArea.value * scale;
    } else {
      bleedTop = bleedArea.top * scale;
      bleedRight = bleedArea.right * scale;
      bleedBottom = bleedArea.bottom * scale;
      bleedLeft = bleedArea.left * scale;
    }

    return {
      x: designBounds.x - bleedLeft,
      y: designBounds.y - bleedTop,
      width: designBounds.width + bleedLeft + bleedRight,
      height: designBounds.height + bleedTop + bleedBottom
    };
  };

  const designBounds = getDesignAreaBounds();
  const bleedBounds = getBleedAreaBounds();

  return (
    <div className="relative">
      {/* 畫布容器 */}
      <div
        ref={containerRef}
        className="canvas-container relative bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300"
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          cursor: viewport?.isPanning ? "grabbing" : "grab",
        }}
        onMouseDown={viewport?.handleMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={viewport?.handleMouseLeave}
      >
        {/* 內容容器 - 應用縮放和平移變換 */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: viewport?.isPanning || isDragging || isResizing ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* 展示圖片 */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="展示圖片"
              className="max-w-full max-h-full object-contain"
              draggable={false}
              style={{
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          ) : (
            <div className="text-gray-400 text-center">
              <p>尚未上傳展示圖片</p>
            </div>
          )}

          {/* 出血區域 - 紅色虛線 */}
          {bleedBounds && (
            <div
              className="absolute border-2 border-red-500 border-dashed pointer-events-none"
              style={{
                left: `${(bleedBounds.x / 400) * 100}%`,
                top: `${(bleedBounds.y / 400) * 100}%`,
                width: `${(bleedBounds.width / 400) * 100}%`,
                height: `${(bleedBounds.height / 400) * 100}%`,
              }}
            />
          )}

          {/* 設計區域 - 藍色實線，可拖拽 */}
          {designBounds && (
            <div
              className="absolute border-2 border-blue-500 border-solid bg-blue-50 bg-opacity-20"
              style={{
                left: `${(designBounds.x / 400) * 100}%`,
                top: `${(designBounds.y / 400) * 100}%`,
                width: `${(designBounds.width / 400) * 100}%`,
                height: `${(designBounds.height / 400) * 100}%`,
                cursor: isResizing ? 'nwse-resize' : (isDragging ? 'grabbing' : 'grab'),
              }}
            >
              {/* 可拖拽區域 */}
              <div
                className="w-full h-full"
                onMouseDown={handleDesignAreaMouseDown}
                style={{ cursor: isResizing ? 'nwse-resize' : (isDragging ? 'grabbing' : 'grab') }}
              />

              {/* 中心點標記 */}
              {designArea && (
                <div
                  className="absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white pointer-events-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}

              {/* 縮放比例顯示 */}
              {designArea && (
                <div
                  className="absolute top-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-bl pointer-events-none"
                >
                  {Math.round(designArea.scale * 100)}%
                </div>
              )}

              {/* 四個角控制點 - 用於等比例縮放 */}
              {designArea && (
                <>
                  {/* 左上角 */}
                  <div
                    className="absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform shadow-md"
                    style={{
                      left: '-8px',
                      top: '-8px',
                    }}
                    onMouseDown={handleCornerMouseDown}
                  />
                  {/* 右上角 */}
                  <div
                    className="absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform shadow-md"
                    style={{
                      right: '-8px',
                      top: '-8px',
                    }}
                    onMouseDown={handleCornerMouseDown}
                  />
                  {/* 左下角 */}
                  <div
                    className="absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform shadow-md"
                    style={{
                      left: '-8px',
                      bottom: '-8px',
                    }}
                    onMouseDown={handleCornerMouseDown}
                  />
                  {/* 右下角 */}
                  <div
                    className="absolute w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform shadow-md"
                    style={{
                      right: '-8px',
                      bottom: '-8px',
                    }}
                    onMouseDown={handleCornerMouseDown}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* 縮放百分比顯示（固定位置） */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>

        {/* 平移提示（僅在平移時顯示） */}
        {viewport?.isPanning && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none">
            平移中...
          </div>
        )}
      </div>

      {/* 操作說明 */}
      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <p>🖱️ <strong>滾輪</strong> 縮放圖片</p>
        <p>🖱️ <strong>中鍵拖曳</strong> 平移畫布</p>
        {designBounds && (
          <>
            <p>🎯 <strong>拖曳藍色區域</strong> 移動設計區中心點</p>
            <p>🔵 <strong>拖曳角控制點</strong> 等比例縮放設計區</p>
          </>
        )}
        <p>⌨️ <strong>Ctrl+0</strong> 重置視圖</p>
      </div>
    </div>
  );
};

export default DisplayImagePreview;
