import React, { useRef, useEffect, useState } from 'react';

const UVMapper = ({
  uvMapping,
  onUVChange,
  className = "",
  showPreview = true,
  onTestImageChange
}) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uvTestImage, setUvTestImage] = useState(null);

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

    // 如果有測試圖片，先繪製圖片作為背景
    if (uvTestImage) {
      ctx.drawImage(uvTestImage, 0, 0, width, height);
    } else {
      // 沒有圖片時繪製背景格線
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
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
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
    ctx.font = '10px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeText('(0,0)', 5, 15);
    ctx.fillText('(0,0)', 5, 15);
    ctx.strokeText('(1,1)', width - 25, height - 5);
    ctx.fillText('(1,1)', width - 25, height - 5);

  }, [defaultUV, uvTestImage]);

  // 處理圖片上傳
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 檢查是否為圖片文件
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUvTestImage(img);
        // 通知父組件測試圖片已更新
        if (onTestImageChange) {
          onTestImageChange(img);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 點擊canvas觸發文件上傳
  const handleCanvasClick = () => {
    fileInputRef.current?.click();
  };

  // 清除測試圖片
  const clearTestImage = () => {
    setUvTestImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // 通知父組件測試圖片已清除
    if (onTestImageChange) {
      onTestImageChange(null);
    }
  };

  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-medium text-gray-900">UV 貼圖控制</h5>
        <div className="text-xs text-gray-500">
          (0,0 到 1,1)
        </div>
      </div>

      {showPreview && (
        <div className="mb-4">
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            className="border border-gray-300 rounded cursor-pointer mx-auto block"
            onClick={handleCanvasClick}
          />
          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 點擊畫布上傳測試圖片
            {uvTestImage && (
              <button
                onClick={clearTestImage}
                className="ml-2 text-red-500 hover:text-red-700"
                title="清除測試圖片"
              >
                ❌
              </button>
            )}
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
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="font-medium">中心: ({defaultUV.u.toFixed(2)}, {defaultUV.v.toFixed(2)})</div>
          </div>
          <div>
            <div className="font-medium">大小: {defaultUV.width.toFixed(2)} × {defaultUV.height.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* 預設按鈕 */}
      <div className="mt-3 flex space-x-2">
        <button
          onClick={() => {
            onUVChange('defaultUV', 'u', 0.5);
            onUVChange('defaultUV', 'v', 0.5);
            onUVChange('defaultUV', 'width', 0.4);
            onUVChange('defaultUV', 'height', 0.3);
          }}
          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          重置
        </button>
        <button
          onClick={() => {
            onUVChange('defaultUV', 'width', 1.0);
            onUVChange('defaultUV', 'height', 1.0);
            onUVChange('defaultUV', 'u', 0.5);
            onUVChange('defaultUV', 'v', 0.5);
          }}
          className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          全覆蓋
        </button>
      </div>

      {/* 隱藏的文件輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

export default UVMapper;