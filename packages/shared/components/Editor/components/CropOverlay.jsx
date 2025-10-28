import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * 圖片剪裁覆蓋層組件（蒙版模式）
 * 顯示蒙版框、控制點、半透明遮罩和操作按鈕
 *
 * 重要概念：
 * - maskRect 數據是相對於圖片元素的座標 (x, y 是中心點，width/height 是蒙版尺寸)
 * - 圖片元素的 width/height 保持不變
 * - 蒙版操作只改變蒙版的位置和尺寸，不改變圖片本身
 */
const CropOverlay = ({
  element,
  maskRect,
  onUpdateMaskRect,
  onApply,
  onCancel,
  onReset,
  currentProduct
}) => {
  const [dragging, setDragging] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!element || !maskRect) return null;

  /**
   * 開始拖曳
   */
  const handleMouseDown = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();

    setDragging(handle);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      maskRect: { ...maskRect }
    });
  }, [maskRect]);

  /**
   * 拖曳中
   */
  const handleMouseMove = useCallback((e) => {
    if (!dragging || !dragStart.maskRect) return;

    // 計算滑鼠移動距離（螢幕像素）
    const screenDx = e.clientX - dragStart.x;
    const screenDy = e.clientY - dragStart.y;

    // 轉換為元素座標（考慮縮放）
    // 簡化版本：假設 1 螢幕像素 = 1 元素像素
    const dx = screenDx;
    const dy = screenDy;

    let newRect = { ...dragStart.maskRect };

    // 邊界限制：蒙版不能超出圖片範圍
    const maxWidth = element.width;
    const maxHeight = element.height;

    // 根據拖曳類型更新蒙版
    switch (dragging) {
      case 'move':
        // 移動整個蒙版（移動中心點）
        newRect.x = Math.max(newRect.width / 2, Math.min(maxWidth - newRect.width / 2, dragStart.maskRect.x + dx));
        newRect.y = Math.max(newRect.height / 2, Math.min(maxHeight - newRect.height / 2, dragStart.maskRect.y + dy));
        break;

      case 'nw': // 西北角
        {
          const newWidth = Math.max(20, dragStart.maskRect.width - dx);
          const newHeight = Math.max(20, dragStart.maskRect.height - dy);
          newRect.width = newWidth;
          newRect.height = newHeight;
          newRect.x = dragStart.maskRect.x + dx / 2;
          newRect.y = dragStart.maskRect.y + dy / 2;
        }
        break;

      case 'ne': // 東北角
        {
          const newWidth = Math.max(20, dragStart.maskRect.width + dx);
          const newHeight = Math.max(20, dragStart.maskRect.height - dy);
          newRect.width = newWidth;
          newRect.height = newHeight;
          newRect.x = dragStart.maskRect.x + dx / 2;
          newRect.y = dragStart.maskRect.y + dy / 2;
        }
        break;

      case 'sw': // 西南角
        {
          const newWidth = Math.max(20, dragStart.maskRect.width - dx);
          const newHeight = Math.max(20, dragStart.maskRect.height + dy);
          newRect.width = newWidth;
          newRect.height = newHeight;
          newRect.x = dragStart.maskRect.x + dx / 2;
          newRect.y = dragStart.maskRect.y + dy / 2;
        }
        break;

      case 'se': // 東南角
        {
          const newWidth = Math.max(20, dragStart.maskRect.width + dx);
          const newHeight = Math.max(20, dragStart.maskRect.height + dy);
          newRect.width = newWidth;
          newRect.height = newHeight;
          newRect.x = dragStart.maskRect.x + dx / 2;
          newRect.y = dragStart.maskRect.y + dy / 2;
        }
        break;

      case 'n': // 北邊
        {
          const newHeight = Math.max(20, dragStart.maskRect.height - dy);
          newRect.height = newHeight;
          newRect.y = dragStart.maskRect.y + dy / 2;
        }
        break;

      case 's': // 南邊
        {
          const newHeight = Math.max(20, dragStart.maskRect.height + dy);
          newRect.height = newHeight;
          newRect.y = dragStart.maskRect.y + dy / 2;
        }
        break;

      case 'w': // 西邊
        {
          const newWidth = Math.max(20, dragStart.maskRect.width - dx);
          newRect.width = newWidth;
          newRect.x = dragStart.maskRect.x + dx / 2;
        }
        break;

      case 'e': // 東邊
        {
          const newWidth = Math.max(20, dragStart.maskRect.width + dx);
          newRect.width = newWidth;
          newRect.x = dragStart.maskRect.x + dx / 2;
        }
        break;

      default:
        break;
    }

    // 確保蒙版不超出圖片邊界
    newRect.x = Math.max(newRect.width / 2, Math.min(maxWidth - newRect.width / 2, newRect.x));
    newRect.y = Math.max(newRect.height / 2, Math.min(maxHeight - newRect.height / 2, newRect.y));
    newRect.width = Math.min(maxWidth, Math.max(20, newRect.width));
    newRect.height = Math.min(maxHeight, Math.max(20, newRect.height));

    onUpdateMaskRect(newRect);
  }, [dragging, dragStart, element, onUpdateMaskRect]);

  /**
   * 結束拖曳
   */
  const handleMouseUp = useCallback(() => {
    if (dragging) {
      setDragging(null);
      setDragStart({ x: 0, y: 0 });
    }
  }, [dragging]);

  // 監聽全局滑鼠事件
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // 計算蒙版框在畫布上的絕對位置
  // element.x, element.y 是圖片元素中心點
  // maskRect.x, maskRect.y 是蒙版中心點（相對於圖片元素）
  const elementLeft = element.x - element.width / 2;
  const elementTop = element.y - element.height / 2;

  // 蒙版中心點在畫布上的絕對位置
  const maskCenterAbsX = elementLeft + maskRect.x;
  const maskCenterAbsY = elementTop + maskRect.y;

  // 蒙版左上角在畫布上的絕對位置
  const maskAbsLeft = maskCenterAbsX - maskRect.width / 2;
  const maskAbsTop = maskCenterAbsY - maskRect.height / 2;

  // 轉換為百分比（相對於 400px 畫布）
  const maskLeftPercent = (maskAbsLeft / 400) * 100;
  const maskTopPercent = (maskAbsTop / 400) * 100;
  const maskWidthPercent = (maskRect.width / 400) * 100;
  const maskHeightPercent = (maskRect.height / 400) * 100;

  return (
    <>
      {/* 半透明遮罩 - 使用 clip-path 創建蒙版區域外的遮罩 */}
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
            ${maskLeftPercent}% ${maskTopPercent}%,
            ${maskLeftPercent}% ${maskTopPercent + maskHeightPercent}%,
            ${maskLeftPercent + maskWidthPercent}% ${maskTopPercent + maskHeightPercent}%,
            ${maskLeftPercent + maskWidthPercent}% ${maskTopPercent}%,
            ${maskLeftPercent}% ${maskTopPercent}%
          )`
        }}
      />

      {/* 蒙版框 */}
      <div
        className="absolute border-2 border-white pointer-events-auto cursor-move"
        style={{
          left: `${maskLeftPercent}%`,
          top: `${maskTopPercent}%`,
          width: `${maskWidthPercent}%`,
          height: `${maskHeightPercent}%`,
          zIndex: 9999,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
        }}
        onMouseDown={(e) => handleMouseDown(e, 'move')}
      >
        {/* 角控制點 */}
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize"
          style={{ top: '-6px', left: '-6px' }}
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize"
          style={{ top: '-6px', right: '-6px' }}
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize"
          style={{ bottom: '-6px', left: '-6px' }}
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-se-resize"
          style={{ bottom: '-6px', right: '-6px' }}
          onMouseDown={(e) => handleMouseDown(e, 'se')}
        />

        {/* 邊控制點 */}
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-n-resize"
          style={{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }}
          onMouseDown={(e) => handleMouseDown(e, 'n')}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-s-resize"
          style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }}
          onMouseDown={(e) => handleMouseDown(e, 's')}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-w-resize"
          style={{ top: '50%', left: '-6px', transform: 'translateY(-50%)' }}
          onMouseDown={(e) => handleMouseDown(e, 'w')}
        />
        <div
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full cursor-e-resize"
          style={{ top: '50%', right: '-6px', transform: 'translateY(-50%)' }}
          onMouseDown={(e) => handleMouseDown(e, 'e')}
        />

        {/* 操作按鈕 */}
        <div
          className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 flex gap-2 pointer-events-auto"
          style={{ whiteSpace: 'nowrap' }}
        >
          {onReset && (
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors shadow-lg"
            >
              🔄 重置
            </button>
          )}
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

        {/* 顯示蒙版尺寸資訊 */}
        <div
          className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none"
          style={{ whiteSpace: 'nowrap' }}
        >
          {Math.round(maskRect.width)} × {Math.round(maskRect.height)} px
        </div>
      </div>
    </>
  );
};

CropOverlay.propTypes = {
  element: PropTypes.object,
  maskRect: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number
  }),
  onUpdateMaskRect: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  currentProduct: PropTypes.object
};

export default CropOverlay;
