import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TOOLBAR_MARGIN } from '../constants/editorConfig';

/**
 * 形狀圖片調整覆蓋層組件
 * 允許用戶拖曳調整圖片在形狀內的位置
 * 只支援平移，不支援縮放
 *
 * 樣式參考 CropOverlay
 */
const ShapeAdjustOverlay = ({
  element,
  currentOffset,
  onUpdateOffset,
  onApply,
  onCancel,
  onReset,
}) => {
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, offset: { x: 0, y: 0 } });

  if (!element) return null;

  /**
   * 開始拖曳
   */
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      offset: { ...currentOffset },
    });
  }, [currentOffset]);

  /**
   * 拖曳中
   */
  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;

    // 計算滑鼠移動距離
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // 更新偏移（與拖曳方向相同，讓圖片跟隨滑鼠移動）
    const newOffset = {
      x: dragStart.offset.x + dx,
      y: dragStart.offset.y + dy,
    };

    onUpdateOffset(newOffset);
  }, [dragging, dragStart, onUpdateOffset]);

  /**
   * 結束拖曳
   */
  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // 監聽全局滑鼠事件
  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // 計算元素位置（百分比）
  const elementCenterXPercent = (element.x / 400) * 100;
  const elementCenterYPercent = (element.y / 400) * 100;
  const elementWidthPercent = (element.width / 400) * 100;
  const elementHeightPercent = (element.height / 400) * 100;

  // 計算工具列位置（元素頂部上方）
  const elementTopY = element.y - element.height / 2;
  const toolbarTopY = elementTopY - TOOLBAR_MARGIN;
  const toolbarTopPercent = (toolbarTopY / 400) * 100;

  // 計算四個角座標（用於半透明遮罩的 clip-path）
  const halfWidth = element.width / 2;
  const halfHeight = element.height / 2;
  const rotation = element.rotation || 0;
  const rotationRad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rotationRad);
  const sin = Math.sin(rotationRad);

  // 旋轉後的四個角相對於中心的位置
  const rotatePoint = (x, y) => ({
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  });

  const corners = [
    rotatePoint(-halfWidth, -halfHeight), // 左上
    rotatePoint(-halfWidth, halfHeight),  // 左下
    rotatePoint(halfWidth, halfHeight),   // 右下
    rotatePoint(halfWidth, -halfHeight),  // 右上
  ].map(corner => ({
    x: ((element.x + corner.x) / 400) * 100,
    y: ((element.y + corner.y) / 400) * 100,
  }));

  return (
    <>
      {/* 全屏遮罩層 - 擋住調整區域外的所有點擊事件 */}
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{
          zIndex: 9997,
          cursor: 'default'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* 半透明遮罩 - 使用 clip-path 創建形狀區域外的遮罩 */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none"
        style={{
          zIndex: 9998,
          clipPath: `polygon(
            0% 0%,
            0% 100%,
            100% 100%,
            100% 0%,
            0% 0%,
            ${corners[0].x}% ${corners[0].y}%,
            ${corners[1].x}% ${corners[1].y}%,
            ${corners[2].x}% ${corners[2].y}%,
            ${corners[3].x}% ${corners[3].y}%,
            ${corners[0].x}% ${corners[0].y}%
          )`
        }}
      />

      {/* 調整區域框 */}
      <div
        className="absolute border-2 border-purple-500 pointer-events-auto cursor-move"
        style={{
          left: `${elementCenterXPercent}%`,
          top: `${elementCenterYPercent}%`,
          width: `${elementWidthPercent}%`,
          height: `${elementHeightPercent}%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transformOrigin: 'center',
          zIndex: 9999,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* 四角指示點 */}
        <div className="absolute w-3 h-3 bg-purple-500 rounded-full" style={{ top: '-6px', left: '-6px' }} />
        <div className="absolute w-3 h-3 bg-purple-500 rounded-full" style={{ top: '-6px', right: '-6px' }} />
        <div className="absolute w-3 h-3 bg-purple-500 rounded-full" style={{ bottom: '-6px', left: '-6px' }} />
        <div className="absolute w-3 h-3 bg-purple-500 rounded-full" style={{ bottom: '-6px', right: '-6px' }} />
      </div>

      {/* 操作按鈕 - 固定在元素上方，不受旋轉影響 */}
      <div
        className="absolute flex gap-2 pointer-events-auto"
        style={{
          left: `${elementCenterXPercent}%`,
          top: `${toolbarTopPercent}%`,
          transform: `translate(-50%, -100%)`,
          whiteSpace: 'nowrap',
          zIndex: 10000,
        }}
      >
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors shadow-lg"
        >
          🔄 重置
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors shadow-lg"
        >
          ❌ 取消
        </button>
        <button
          onClick={onApply}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-lg"
        >
          ✓ 確認
        </button>
      </div>

      {/* 顯示偏移資訊 */}
      <div
        className="absolute bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none"
        style={{
          left: `${elementCenterXPercent}%`,
          top: `${elementCenterYPercent}%`,
          transform: `translate(-50%, calc(${(elementHeightPercent / 2)}% + 0.25rem + 150%))`,
          whiteSpace: 'nowrap',
          zIndex: 10000,
        }}
      >
        偏移: {Math.round(currentOffset.x)}, {Math.round(currentOffset.y)} px
      </div>
    </>
  );
};

ShapeAdjustOverlay.propTypes = {
  element: PropTypes.object.isRequired,
  currentOffset: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
  onUpdateOffset: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default ShapeAdjustOverlay;
