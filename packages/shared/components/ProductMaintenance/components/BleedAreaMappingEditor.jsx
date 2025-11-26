import React, { useRef, useEffect, useState } from 'react';
import useBleedAreaMapping from '../hooks/useBleedAreaMapping.js';
import '../styles/BleedAreaMappingEditor.css';

/**
 * 出血区映射编辑器组件
 * Canvas 可视化编辑器，支持拖曳调整出血区映射位置和缩放
 */
const BleedAreaMappingEditor = ({
  product,
  initialMapping,
  onMappingChange,
  displaySize = 400
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(0);

  // 使用映射编辑 Hook
  const mapping = useBleedAreaMapping(
    product,
    initialMapping,
    onMappingChange,
    displaySize
  );

  /**
   * 初始化 Canvas 尺寸
   */
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setCanvasSize(width);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  /**
   * 绘制背景图和编辑界面
   */
  useEffect(() => {
    if (!canvasRef.current || canvasSize === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // 设置 Canvas 大小
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const scale = canvasSize / displaySize;

    // 清空 Canvas
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 绘制背景图（如果有）
    if (product.productBackgroundImage?.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        drawEditingOverlay(ctx, scale);
      };
      img.onerror = () => {
        // 背景图加载失败，只绘制编辑界面
        drawEditingOverlay(ctx, scale);
      };
      img.src = product.productBackgroundImage.url;
    } else {
      // 没有背景图，显示灰色背景
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      drawEditingOverlay(ctx, scale);
    }
  }, [canvasSize, product, displaySize, mapping.bounds]);

  /**
   * 绘制编辑界面（边界、控制点等）
   */
  const drawEditingOverlay = (ctx, scale) => {
    const bounds = mapping.bounds;

    // 绘制网格（可选）
    drawGrid(ctx, scale);

    // 绘制出血区边界
    drawBleedAreaBounds(ctx, bounds, scale);

    // 绘制中心点
    drawCenterPoint(ctx, bounds, scale);

    // 绘制角控制点
    drawCornerControls(ctx, bounds, scale);

    // 绘制坐标显示
    drawCoordinateInfo(ctx, scale);
  };

  /**
   * 绘制网格
   */
  const drawGrid = (ctx, scale) => {
    const gridSize = 40 * scale;
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= canvasSize; i += gridSize) {
      // 竖线
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize);
      ctx.stroke();

      // 横线
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize, i);
      ctx.stroke();
    }
  };

  /**
   * 绘制出血区边界
   */
  const drawBleedAreaBounds = (ctx, bounds, scale) => {
    const x = bounds.x * scale;
    const y = bounds.y * scale;
    const w = bounds.width * scale;
    const h = bounds.height * scale;

    // 绘制虚线边框（紫色）
    ctx.strokeStyle = '#9c27b0';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // 填充半透明背景（用于更好的可视化）
    ctx.fillStyle = 'rgba(156, 39, 176, 0.05)';
    ctx.fillRect(x, y, w, h);
  };

  /**
   * 绘制中心点
   */
  const drawCenterPoint = (ctx, bounds, scale) => {
    const x = bounds.centerX * scale;
    const y = bounds.centerY * scale;
    const radius = 6;

    // 绘制圆点
    ctx.fillStyle = '#9c27b0';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制外圈
    ctx.strokeStyle = '#7b1fa2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();

    // 绘制十字标记
    ctx.strokeStyle = '#9c27b0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
  };

  /**
   * 绘制角控制点
   */
  const drawCornerControls = (ctx, bounds, scale) => {
    const corners = [
      { x: bounds.x, y: bounds.y, label: 'TL' },
      { x: bounds.x + bounds.width, y: bounds.y, label: 'TR' },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, label: 'BR' },
      { x: bounds.x, y: bounds.y + bounds.height, label: 'BL' }
    ];

    const size = 8;
    ctx.fillStyle = '#ff9800';
    ctx.strokeStyle = '#f57c00';
    ctx.lineWidth = 1.5;

    corners.forEach(corner => {
      const x = corner.x * scale;
      const y = corner.y * scale;

      // 绘制方形控制点
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);

      // 绘制悬停提示（可选）
      // ctx.fillStyle = '#666';
      // ctx.font = '10px Arial';
      // ctx.fillText(corner.label, x + 8, y - 8);
    });
  };

  /**
   * 绘制坐标信息
   */
  const drawCoordinateInfo = (ctx, scale) => {
    const info = mapping.getMappingSummary();

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 180, 88);

    // 文字
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    const lines = [
      `中心X: ${info.centerX}%`,
      `中心Y: ${info.centerY}%`,
      `缩放: ${info.scale}`,
      `宽: ${info.width}px`,
      `高: ${info.height}px`,
      `状态: ${info.valid ? '✓ 有效' : '✗ 无效'}`
    ];

    lines.forEach((line, index) => {
      ctx.fillText(line, 16, 16 + index * 14);
    });
  };

  /**
   * 处理 Canvas 鼠标事件
   */
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scale = canvasSize / displaySize;
    const displayX = x / scale;
    const displayY = y / scale;

    // 判断是否点中中心点
    if (mapping.isMouseNearCenter(displayX, displayY, 15)) {
      mapping.handleCenterDragStart(e);
    }
    // 判断是否点中角点
    else if (mapping.bounds) {
      const corners = [
        { name: 'tl', x: mapping.bounds.x, y: mapping.bounds.y },
        { name: 'tr', x: mapping.bounds.x + mapping.bounds.width, y: mapping.bounds.y },
        { name: 'br', x: mapping.bounds.x + mapping.bounds.width, y: mapping.bounds.y + mapping.bounds.height },
        { name: 'bl', x: mapping.bounds.x, y: mapping.bounds.y + mapping.bounds.height }
      ];

      for (const corner of corners) {
        const dx = displayX - corner.x;
        const dy = displayY - corner.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 15) {
          mapping.handleCornerDragStart(corner.name, e);
          return;
        }
      }
    }
  };

  const handleMouseMove = (e) => {
    mapping.handleDragMove(e);
    if (canvasRef.current && mapping.isDragging) {
      canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    mapping.handleDragEnd();
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (mapping.isDragging) {
      mapping.handleDragEnd();
    }
  };

  return (
    <div className="bleed-area-mapping-editor">
      <div className="editor-header">
        <h3 className="editor-title">出血区映射编辑器</h3>
        <p className="editor-description">
          在下方拖曳调整出血区的位置和大小
        </p>
      </div>

      {/* Canvas 编辑器 */}
      <div
        ref={containerRef}
        className="canvas-container"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          className="editor-canvas"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* 参数控制面板 */}
      <div className="control-panel">
        <div className="control-group">
          <label htmlFor="centerX">中心X位置 (%)</label>
          <input
            id="centerX"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={mapping.mapping.centerX.toFixed(1)}
            onChange={(e) => mapping.setCenterX(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="control-group">
          <label htmlFor="centerY">中心Y位置 (%)</label>
          <input
            id="centerY"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={mapping.mapping.centerY.toFixed(1)}
            onChange={(e) => mapping.setCenterY(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="control-group">
          <label htmlFor="scale">缩放比例</label>
          <input
            id="scale"
            type="number"
            min="0.1"
            max="5"
            step="0.1"
            value={mapping.mapping.scale.toFixed(2)}
            onChange={(e) => mapping.setScale(e.target.value)}
            className="input-field"
          />
        </div>

        {/* 错误提示 */}
        {!mapping.validationResult.valid && (
          <div className="validation-errors">
            {mapping.validationResult.errors.map((error, idx) => (
              <div key={idx} className="error-item">
                <span className="error-icon">⚠</span>
                <span className="error-text">{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="button-group">
          <button
            className="btn-reset"
            onClick={mapping.resetMapping}
            title="重置为默认值"
          >
            ↻ 重置
          </button>

          <button
            className="btn-apply"
            onClick={mapping.applyMapping}
            disabled={!mapping.validationResult.valid}
            title={mapping.validationResult.valid ? '应用映射配置' : '配置无效，无法应用'}
          >
            ✓ 应用
          </button>
        </div>
      </div>
    </div>
  );
};

export default BleedAreaMappingEditor;
