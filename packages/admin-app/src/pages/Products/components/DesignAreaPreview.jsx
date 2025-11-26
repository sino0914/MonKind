import React, { useEffect, useRef, useCallback } from 'react';
import { calculateBleedBounds } from '../../../utils/bleedAreaUtils';

/**
 * DesignAreaPreview Component
 * 顯示設計區域和出血區域的預覽，支援縮放和平移
 *
 * @param {Object} product - 商品物件
 * @param {Object} tempPrintArea - 臨時設計區域設定
 * @param {Object} tempBleedArea - 臨時出血區域設定
 * @param {Function} onMouseDown - 滑鼠按下事件（設計區拖曳）
 * @param {Function} onMouseMove - 滑鼠移動事件（設計區拖曳）
 * @param {Function} onMouseUp - 滑鼠放開事件（設計區拖曳）
 * @param {Object} viewport - 視圖控制物件 { zoom, pan, isPanning, ... }
 * @param {Function} onViewportChange - 視圖變更回調（用於同步狀態）
 */
const DesignAreaPreview = ({
  product,
  tempPrintArea,
  tempBleedArea,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  viewport,
  onViewportChange,
  productBackgroundImage, // 新增：背景圖
  bleedAreaMapping, // 新增：映射設定
}) => {
  const containerRef = useRef(null);

  // 當 viewport 變更時通知父組件
  useEffect(() => {
    if (viewport && onViewportChange) {
      onViewportChange({
        zoom: viewport.zoom,
        panX: viewport.pan.x,
        panY: viewport.pan.y,
      });
    }
  }, [viewport?.zoom, viewport?.pan.x, viewport?.pan.y, onViewportChange]);

  // 處理滾輪縮放（添加到容器上）
  const handleContainerWheel = useCallback((e) => {
    if (viewport?.handleWheel) {
      viewport.handleWheel(e);
    }
  }, [viewport]);

  // 綁定 wheel 事件（使用 passive: false 以支援 preventDefault）
  useEffect(() => {
    const container = containerRef.current;
    if (container && viewport) {
      container.addEventListener('wheel', handleContainerWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleContainerWheel);
      };
    }
  }, [handleContainerWheel, viewport]);

  if (!product) return null;

  // 計算出血區域邊界
  const bleedBounds = tempBleedArea
    ? calculateBleedBounds(tempPrintArea, tempBleedArea)
    : null;

  // 計算縮放和平移的樣式
  const zoom = viewport?.zoom ?? 1.0;
  const panX = viewport?.pan?.x ?? 0;
  const panY = viewport?.pan?.y ?? 0;

  // 處理中鍵平移相關的事件
  const handleContainerMouseDown = (e) => {
    // 中鍵平移
    if (e.button === 1 && viewport?.handleMouseDown) {
      viewport.handleMouseDown(e);
    }
  };

  const handleContainerMouseMove = (e) => {
    // 優先處理平移
    if (viewport?.isPanning && viewport?.handleMouseMove) {
      viewport.handleMouseMove(e);
    } else {
      // 處理設計區拖曳
      onMouseMove?.(e);
    }
  };

  const handleContainerMouseUp = (e) => {
    // 處理平移結束
    if (viewport?.handleMouseUp) {
      viewport.handleMouseUp(e);
    }
    // 處理設計區拖曳結束
    onMouseUp?.(e);
  };

  const handleContainerMouseLeave = () => {
    if (viewport?.handleMouseLeave) {
      viewport.handleMouseLeave();
    }
    onMouseUp?.();
  };

  return (
    <div
      ref={containerRef}
      className="canvas-container w-full aspect-square border-2 border-gray-300 rounded-lg relative overflow-hidden bg-white"
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseLeave}
      style={{ cursor: viewport?.isPanning ? 'grabbing' : 'crosshair' }}
    >
      {/* 可縮放/平移的內容容器 */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: viewport?.isPanning ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {/* 底圖（優先使用背景圖，否則使用 mockupImage） */}
        {(productBackgroundImage?.url || product.mockupImage) ? (
          <img
            key={`background-${product.id}-${(productBackgroundImage?.url || product.mockupImage)?.substring(0, 50)}`}
            src={productBackgroundImage?.url || product.mockupImage}
            alt={`${product.title} 底圖`}
            className="w-full h-full object-contain pointer-events-none"
            onError={(e) => {
              console.error('Background/Mockup image failed to load:', productBackgroundImage?.url || product.mockupImage);
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'flex';
              }
            }}
            onLoad={() => {
              console.log('Background/Mockup image loaded successfully');
            }}
          />
        ) : null}

        {/* Fallback */}
        <div
          key={`fallback-${product.id}`}
          className="absolute inset-0 bg-gray-50 border-2 border-dashed border-gray-300 rounded flex items-center justify-center"
          style={{
            display: product.mockupImage ? 'none' : 'flex',
          }}
        >
          <div className="text-center">
            <div className="mb-3">
              <svg
                className="w-12 h-12 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-1">尚未設定底圖</p>
            <p className="text-gray-400 text-xs">使用下方控制項上傳底圖</p>
          </div>
        </div>

        {/* 出血區域預覽 (簡化版 - 紅色虛線邊框 + 標籤) */}
        {bleedBounds && (
          <>
            {/* 紅色虛線邊框 */}
            <div
              className="absolute border-2 border-red-500 border-dashed pointer-events-none"
              style={{
                left: `${(bleedBounds.x / 400) * 100}%`,
                top: `${(bleedBounds.y / 400) * 100}%`,
                width: `${(bleedBounds.width / 400) * 100}%`,
                height: `${(bleedBounds.height / 400) * 100}%`,
                zIndex: 4,
              }}
            />

            {/* 出血區域標籤 */}
            <div
              className="absolute text-xs text-red-500 bg-white px-1.5 py-0.5 rounded pointer-events-none shadow-sm font-medium"
              style={{
                left: `${(bleedBounds.x / 400) * 100}%`,
                top: `${((bleedBounds.y - 22) / 400) * 100}%`,
                zIndex: 5,
              }}
            >
              出血區域 {Math.round(bleedBounds.width)}×{Math.round(bleedBounds.height)}px
            </div>
          </>
        )}

        {/* 設計區 Overlay */}
        {tempPrintArea && (
          <div
            className="absolute border-2 border-blue-500 border-solid bg-blue-50 bg-opacity-30"
            style={{
              left: `${(tempPrintArea.x / 400) * 100}%`,
              top: `${(tempPrintArea.y / 400) * 100}%`,
              width: `${(tempPrintArea.width / 400) * 100}%`,
              height: `${(tempPrintArea.height / 400) * 100}%`,
              zIndex: 10,
            }}
          >
            {/* 設計區標籤 */}
            <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
              設計區 {tempPrintArea.width.toFixed(1)}×{tempPrintArea.height.toFixed(1)}px
            </div>

            {/* 拖曳區域 */}
            <div
              className="absolute inset-0 cursor-move bg-blue-200 bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center"
              onMouseDown={(e) => onMouseDown(e, 'move')}
            >
              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-75">
                拖曳移動
              </div>
            </div>

            {/* 調整大小手柄 */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize hover:bg-blue-600"
              onMouseDown={(e) => onMouseDown(e, 'resize')}
              style={{
                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              }}
            />

            {/* 角落標記 */}
            <div className="absolute top-0 left-0 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full transform translate-x-1 -translate-y-1" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 translate-y-1" />
          </div>
        )}

        {/* Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* 縮放倍率顯示（固定位置，不隨縮放變化） */}
      {viewport && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded pointer-events-none z-50">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
};

export default DesignAreaPreview;
