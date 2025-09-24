import React, { useRef, useEffect, useState } from 'react';

const UVMapper = ({
  uvMapping,
  onUVChange,
  className = "",
  showPreview = true
}) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'move' 或 'resize'

  const defaultUV = uvMapping?.defaultUV || {
    u: 0.5,
    v: 0.5,
    width: 0.4,
    height: 0.3
  };

  // 繪製UV貼圖預覽
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // 清除畫布
    ctx.clearRect(0, 0, width, height);

    // 繪製背景格線
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // 垂直線
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 水平線
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 繪製邊框
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // 繪製UV區域
    const uvX = (defaultUV.u - defaultUV.width / 2) * width;
    const uvY = (defaultUV.v - defaultUV.height / 2) * height;
    const uvWidth = defaultUV.width * width;
    const uvHeight = defaultUV.height * height;

    // UV區域填充
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(uvX, uvY, uvWidth, uvHeight);

    // UV區域邊框
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(uvX, uvY, uvWidth, uvHeight);

    // 繪製中心點
    const centerX = defaultUV.u * width;
    const centerY = defaultUV.v * height;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();

    // 繪製座標標籤
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.fillText('(0,0)', 5, 15);
    ctx.fillText('(1,1)', width - 25, height - 5);
    ctx.fillText(`UV中心: (${defaultUV.u.toFixed(2)}, ${defaultUV.v.toFixed(2)})`, 5, height - 5);

  }, [defaultUV]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;

    // 檢查是否點擊在UV區域內
    const uvLeft = defaultUV.u - defaultUV.width / 2;
    const uvRight = defaultUV.u + defaultUV.width / 2;
    const uvTop = defaultUV.v - defaultUV.height / 2;
    const uvBottom = defaultUV.v + defaultUV.height / 2;

    if (x >= uvLeft && x <= uvRight && y >= uvTop && y <= uvBottom) {
      setIsDragging(true);
      setDragType('move');
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || dragType !== 'move') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;

    // 限制在畫布範圍內
    const newU = Math.max(defaultUV.width / 2, Math.min(1 - defaultUV.width / 2, x));
    const newV = Math.max(defaultUV.height / 2, Math.min(1 - defaultUV.height / 2, y));

    onUVChange('defaultUV', 'u', newU);
    onUVChange('defaultUV', 'v', newV);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h5 className="font-medium text-gray-900">UV 貼圖視覺化</h5>
        <div className="text-xs text-gray-500">
          UV 座標系統 (0,0 到 1,1)
        </div>
      </div>

      {showPreview && (
        <div className="mb-4">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="border border-gray-300 rounded cursor-pointer"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <div className="mt-2 text-xs text-gray-500">
            💡 點擊並拖拽藍色區域來調整UV映射位置
          </div>
        </div>
      )}

      {/* UV 參數控制 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            U 座標 (水平)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={defaultUV.u}
            onChange={(e) => onUVChange('defaultUV', 'u', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>{defaultUV.u.toFixed(2)}</span>
            <span>1</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            V 座標 (垂直)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={defaultUV.v}
            onChange={(e) => onUVChange('defaultUV', 'v', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0</span>
            <span>{defaultUV.v.toFixed(2)}</span>
            <span>1</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            寬度
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={defaultUV.width}
            onChange={(e) => onUVChange('defaultUV', 'width', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.1</span>
            <span>{defaultUV.width.toFixed(2)}</span>
            <span>1.0</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            高度
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.01"
            value={defaultUV.height}
            onChange={(e) => onUVChange('defaultUV', 'height', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.1</span>
            <span>{defaultUV.height.toFixed(2)}</span>
            <span>1.0</span>
          </div>
        </div>
      </div>

      {/* UV 資訊顯示 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>中心位置:</strong><br />
              U: {defaultUV.u.toFixed(3)}<br />
              V: {defaultUV.v.toFixed(3)}
            </div>
            <div>
              <strong>區域大小:</strong><br />
              寬: {defaultUV.width.toFixed(3)}<br />
              高: {defaultUV.height.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* 預設按鈕 */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => {
            onUVChange('defaultUV', 'u', 0.5);
            onUVChange('defaultUV', 'v', 0.5);
            onUVChange('defaultUV', 'width', 0.4);
            onUVChange('defaultUV', 'height', 0.3);
          }}
          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          重置為預設
        </button>
        <button
          onClick={() => {
            onUVChange('defaultUV', 'width', 1.0);
            onUVChange('defaultUV', 'height', 1.0);
            onUVChange('defaultUV', 'u', 0.5);
            onUVChange('defaultUV', 'v', 0.5);
          }}
          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          全覆蓋
        </button>
      </div>
    </div>
  );
};

export default UVMapper;