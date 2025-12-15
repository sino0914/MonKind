import React, { useEffect, useRef } from "react";

/**
 * 展示圖片預覽組件
 * 提供縮放和平移功能，類似底圖編輯器，但不包含設計區域拖拽
 */
const DisplayImagePreview = ({
  imageUrl,
  viewport,
  onViewportChange,
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

  // 處理滑鼠移動事件（優先處理平移）
  const handleContainerMouseMove = (e) => {
    if (viewport?.isPanning && viewport?.handleMouseMove) {
      viewport.handleMouseMove(e);
    }
  };

  const zoom = viewport?.zoom ?? 1.0;
  const panX = viewport?.pan?.x ?? 0;
  const panY = viewport?.pan?.y ?? 0;

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
        onMouseUp={viewport?.handleMouseUp}
        onMouseLeave={viewport?.handleMouseLeave}
      >
        {/* 內容容器 - 應用縮放和平移變換 */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: viewport?.isPanning ? "none" : "transform 0.1s ease-out",
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
        <p>⌨️ <strong>Ctrl+0</strong> 重置視圖</p>
      </div>
    </div>
  );
};

export default DisplayImagePreview;
