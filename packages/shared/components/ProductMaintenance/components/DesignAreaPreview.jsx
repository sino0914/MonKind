import React, { useRef, useEffect, useState } from 'react';
import { calculateBleedBounds } from '../utils/bleedAreaUtils';

/**
 * DesignAreaPreview 組件
 * 顯示設計區域預覽畫布，支援拖曳和調整大小
 */
const DesignAreaPreview = ({
  mockupImage,
  printArea,
  bleedArea,
  onPrintAreaChange,
  onDragStart,
  onDragEnd,
  isDragging,
  canvasSize = 400,
  showBleedArea = true,
}) => {
  const canvasRef = useRef(null);
  const [localDragState, setLocalDragState] = useState({
    isDragging: false,
    dragType: null, // 'move' | 'resize'
    startPos: { x: 0, y: 0 },
    startArea: null,
  });

  // 繪製畫布內容
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // 繪製背景圖片
    if (mockupImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        drawOverlays(ctx);
      };
      img.src = mockupImage;
    } else {
      // 沒有圖片時繪製灰色背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      drawOverlays(ctx);
    }
  }, [mockupImage, printArea, bleedArea, canvasSize, showBleedArea]);

  // 繪製覆蓋層（出血區域和設計區域）
  const drawOverlays = (ctx) => {
    // 繪製出血區域（如果啟用）
    if (showBleedArea && bleedArea) {
      const bleedBounds = calculateBleedBounds(printArea, bleedArea);
      if (bleedBounds) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bleedBounds.x, bleedBounds.y, bleedBounds.width, bleedBounds.height);
        ctx.setLineDash([]);
      }
    }

    // 繪製設計區域
    ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(printArea.x, printArea.y, printArea.width, printArea.height);

    // 繪製調整大小控制點
    const handleSize = 8;
    ctx.fillStyle = 'rgba(0, 123, 255, 0.8)';
    ctx.fillRect(
      printArea.x + printArea.width - handleSize / 2,
      printArea.y + printArea.height - handleSize / 2,
      handleSize,
      handleSize
    );
  };

  // 處理滑鼠按下
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 檢查是否點擊調整大小控制點
    const handleSize = 8;
    const resizeHandleX = printArea.x + printArea.width;
    const resizeHandleY = printArea.y + printArea.height;

    const isResizeHandle =
      x >= resizeHandleX - handleSize &&
      x <= resizeHandleX + handleSize &&
      y >= resizeHandleY - handleSize &&
      y <= resizeHandleY + handleSize;

    if (isResizeHandle) {
      setLocalDragState({
        isDragging: true,
        dragType: 'resize',
        startPos: { x, y },
        startArea: { ...printArea },
      });
      onDragStart?.('resize', { x, y });
    } else if (
      x >= printArea.x &&
      x <= printArea.x + printArea.width &&
      y >= printArea.y &&
      y <= printArea.y + printArea.height
    ) {
      // 點擊在設計區域內，開始移動
      setLocalDragState({
        isDragging: true,
        dragType: 'move',
        startPos: { x, y },
        startArea: { ...printArea },
      });
      onDragStart?.('move', { x, y });
    }
  };

  // 處理滑鼠移動
  const handleMouseMove = (e) => {
    if (!localDragState.isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - localDragState.startPos.x;
    const dy = y - localDragState.startPos.y;

    if (localDragState.dragType === 'move') {
      const newX = Math.max(0, Math.min(canvasSize - printArea.width, localDragState.startArea.x + dx));
      const newY = Math.max(0, Math.min(canvasSize - printArea.height, localDragState.startArea.y + dy));

      onPrintAreaChange?.({ ...printArea, x: newX, y: newY });
    } else if (localDragState.dragType === 'resize') {
      const newWidth = Math.max(20, Math.min(canvasSize - printArea.x, localDragState.startArea.width + dx));
      const newHeight = Math.max(20, Math.min(canvasSize - printArea.y, localDragState.startArea.height + dy));

      onPrintAreaChange?.({ ...printArea, width: newWidth, height: newHeight });
    }
  };

  // 處理滑鼠放開
  const handleMouseUp = () => {
    if (localDragState.isDragging) {
      setLocalDragState({
        isDragging: false,
        dragType: null,
        startPos: { x: 0, y: 0 },
        startArea: null,
      });
      onDragEnd?.();
    }
  };

  // 處理滑鼠離開畫布
  const handleMouseLeave = () => {
    handleMouseUp();
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="border border-gray-300 cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      <div className="mt-2 text-sm text-gray-600">
        <p>設計區域: X={printArea.x.toFixed(0)}px, Y={printArea.y.toFixed(0)}px, W={printArea.width.toFixed(0)}px, H={printArea.height.toFixed(0)}px</p>
      </div>
    </div>
  );
};

export default DesignAreaPreview;
