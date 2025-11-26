import React, { useRef, useEffect, useState } from 'react';
import { calculateBleedBounds } from '../utils/bleedAreaUtils';
import { getBleedBoundsInBackground } from '../utils/bleedAreaMappingUtils';
import { printAreaDisplayToMm, formatMm } from '../../../utils/unitConversion';

/**
 * DesignAreaPreview 組件（改进版）
 * 顯示設計區域預覽畫布，支援拖曳和調整大小
 * 支持背景图映射显示
 * 顯示單位為 mm
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
  physicalSize, // { widthMm, heightMm }
  // 新增参数：背景图映射支持
  productBackgroundImage,
  bleedAreaMapping,
  useProductBackground = false, // 是否使用背景图映射预览
}) => {
  const canvasRef = useRef(null);
  const [localDragState, setLocalDragState] = useState({
    isDragging: false,
    dragType: null, // 'move' | 'resize'
    startPos: { x: 0, y: 0 },
    startArea: null,
  });

  // 繪製畫布內容（支持背景图映射）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // 选择要使用的背景图
    const backgroundImageUrl = (useProductBackground && productBackgroundImage?.url)
      ? productBackgroundImage.url
      : mockupImage;

    // 繪製背景圖片
    if (backgroundImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        drawOverlays(ctx);
      };
      img.onerror = () => {
        // 圖片加載失敗，繪製灰色背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        drawOverlays(ctx);
      };
      img.src = backgroundImageUrl;
    } else {
      // 沒有圖片時繪製灰色背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      drawOverlays(ctx);
    }
  }, [mockupImage, productBackgroundImage, printArea, bleedArea, canvasSize, showBleedArea, useProductBackground]);

  // 繪製覆蓋層（出血區域和設計區域，支持背景图映射）
  const drawOverlays = (ctx) => {
    // 確定是否使用映射后的出血区
    const usesMappedBleedArea = useProductBackground && bleedAreaMapping && productBackgroundImage;

    // 繪製出血區域（如果啟用）
    if (showBleedArea && bleedArea) {
      let bleedBounds;

      if (usesMappedBleedArea) {
        // 使用映射後的出血區邊界
        bleedBounds = getBleedBoundsInBackground({
          printArea,
          bleedArea
        }, bleedAreaMapping, canvasSize);
      } else {
        // 使用原始出血區邊界
        bleedBounds = calculateBleedBounds(printArea, bleedArea);
      }

      if (bleedBounds) {
        ctx.strokeStyle = usesMappedBleedArea ? 'rgba(156, 39, 176, 0.6)' : 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bleedBounds.x, bleedBounds.y, bleedBounds.width, bleedBounds.height);
        ctx.setLineDash([]);

        // 如果使用映射，添加视觉反馈
        if (usesMappedBleedArea) {
          ctx.fillStyle = 'rgba(156, 39, 176, 0.03)';
          ctx.fillRect(bleedBounds.x, bleedBounds.y, bleedBounds.width, bleedBounds.height);
        }
      }
    }

    // 繪製設計區域（仅在非映射模式下显示，映射模式下已经在出血区中显示）
    if (!usesMappedBleedArea) {
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
    }
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

  // 將顯示座標轉換為 mm 顯示
  const printAreaMm = physicalSize
    ? printAreaDisplayToMm(printArea, physicalSize, canvasSize)
    : null;

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
        {printAreaMm ? (
          <p>
            設計區域: X={formatMm(printAreaMm.x)}mm, Y={formatMm(printAreaMm.y)}mm,
            W={formatMm(printAreaMm.width)}mm, H={formatMm(printAreaMm.height)}mm
          </p>
        ) : (
          <p>設計區域: X={printArea.x.toFixed(0)}px, Y={printArea.y.toFixed(0)}px, W={printArea.width.toFixed(0)}px, H={printArea.height.toFixed(0)}px</p>
        )}
      </div>
    </div>
  );
};

export default DesignAreaPreview;
