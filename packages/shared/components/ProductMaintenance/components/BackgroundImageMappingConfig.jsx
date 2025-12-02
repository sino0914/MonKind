import React, { useState, useRef, useEffect } from 'react';

/**
 * 背景圖映射設定組件（統一Canvas版本）
 * 整合背景圖上傳和出血區映射編輯為一個Canvas組件
 */
const BackgroundImageMappingConfig = ({
  product,
  backgroundImage,
  bleedAreaMapping,
  onBackgroundImageUpload,
  onBackgroundImageDelete,
  onMappingChange,
  onSave,
  loading = false,
  error = null,
  saving = false
}) => {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'center' or 'corner'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempMapping, setTempMapping] = useState(bleedAreaMapping || {
    centerX: 50,
    centerY: 50,
    scale: 1.0,
    enabled: true
  });

  // 計算出血區的實際尺寸和位置
  const getBleedAreaDimensions = () => {
    if (!product) return null;

    const { printArea = {}, bleedArea = {} } = product;
    const printWidth = printArea.width || 60;
    const printHeight = printArea.height || 60;
    const bleedX = bleedArea.x || 15;
    const bleedY = bleedArea.y || 15;
    const bleedWidth = bleedArea.width || 90;
    const bleedHeight = bleedArea.height || 90;

    return {
      x: printWidth / 2 - bleedWidth / 2,
      y: printHeight / 2 - bleedHeight / 2,
      width: bleedWidth,
      height: bleedHeight,
      centerX: printWidth / 2,
      centerY: printHeight / 2
    };
  };

  // Canvas繪製函數
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const canvasSize = 400;

    // 清空Canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 繪製網格
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= canvasSize; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize, i);
      ctx.stroke();
    }

    if (backgroundImage?.url) {
      // 繪製背景圖
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        drawBleedAreaControls(ctx, canvasSize);
      };
      img.onerror = () => {
        console.error('背景圖加載失敗:', backgroundImage.url);
      };
      img.src = backgroundImage.url;
    } else {
      // 繪製上傳提示
      drawUploadPrompt(ctx, canvasSize);
    }
  };

  // 繪製出血區控制點（優化版）
  const drawBleedAreaControls = (ctx, canvasSize) => {
    const bleedDim = getBleedAreaDimensions();
    if (!bleedDim) return;

    // 計算出血區在Canvas上的位置（應用映射）
    const centerX = (tempMapping.centerX / 100) * canvasSize;
    const centerY = (tempMapping.centerY / 100) * canvasSize;
    const scale = tempMapping.scale || 1.0;
    const bleedWidth = (bleedDim.width / bleedDim.centerX) * canvasSize * scale;
    const bleedHeight = (bleedDim.height / bleedDim.centerY) * canvasSize * scale;

    // 計算設計區尺寸（比出血區小）
    const printRatio = (product?.printArea?.width || 60) / (bleedDim.width || 90);
    const printWidth = bleedWidth * printRatio;
    const printHeight = bleedHeight * printRatio;

    // 繪製設計區邊界（綠色實線）
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - printWidth / 2,
      centerY - printHeight / 2,
      printWidth,
      printHeight
    );

    // 設計區標籤
    ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(
      `設計區: ${Math.round(printWidth)}×${Math.round(printHeight)}px`,
      centerX - printWidth / 2 + 5,
      centerY - printHeight / 2 + 15
    );

    // 繪製出血區邊界（紅色虛線，更鮮明）
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.setLineDash([8, 4]);
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - bleedWidth / 2,
      centerY - bleedHeight / 2,
      bleedWidth,
      bleedHeight
    );
    ctx.setLineDash([]);

    // 出血區標籤
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(
      `出血區: ${Math.round(bleedWidth)}×${Math.round(bleedHeight)}px`,
      centerX - bleedWidth / 2 + 5,
      centerY + bleedHeight / 2 - 5
    );

    // 繪製中心點十字線（藍色）
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY);
    ctx.lineTo(centerX + 15, centerY);
    ctx.moveTo(centerX, centerY - 15);
    ctx.lineTo(centerX, centerY + 15);
    ctx.stroke();

    // 繪製中心點（紅色圓形，更大）
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 繪製四個角控制點（藍色正方形）
    const cornerSize = 10;
    const corners = [
      { x: centerX - bleedWidth / 2, y: centerY - bleedHeight / 2 }, // 左上
      { x: centerX + bleedWidth / 2, y: centerY - bleedHeight / 2 }, // 右上
      { x: centerX - bleedWidth / 2, y: centerY + bleedHeight / 2 }, // 左下
      { x: centerX + bleedWidth / 2, y: centerY + bleedHeight / 2 }  // 右下
    ];

    corners.forEach(corner => {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(
        corner.x - cornerSize / 2,
        corner.y - cornerSize / 2,
        cornerSize,
        cornerSize
      );
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        corner.x - cornerSize / 2,
        corner.y - cornerSize / 2,
        cornerSize,
        cornerSize
      );
    });

    // 檢查邊界警告
    const isOutOfBounds =
      centerX - bleedWidth / 2 < 0 ||
      centerY - bleedHeight / 2 < 0 ||
      centerX + bleedWidth / 2 > canvasSize ||
      centerY + bleedHeight / 2 > canvasSize;

    // 繪製座標資訊和警告
    ctx.fillStyle = isOutOfBounds ? '#dc2626' : '#374151';
    ctx.font = '12px sans-serif';
    ctx.fillText(
      `中心: ${tempMapping.centerX.toFixed(1)}%, ${tempMapping.centerY.toFixed(1)}% | 縮放: ${(tempMapping.scale || 1.0).toFixed(2)}x`,
      10,
      390
    );

    if (isOutOfBounds) {
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⚠️ 警告：出血區超出背景圖邊界', 10, 375);
    }
  };

  // 繪製上傳提示
  const drawUploadPrompt = (ctx, canvasSize) => {
    // 半透明背景
    ctx.fillStyle = 'rgba(249, 250, 251, 0.8)';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 虛線邊框
    ctx.strokeStyle = '#d1d5db';
    ctx.setLineDash([10, 5]);
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvasSize - 80, canvasSize - 80);
    ctx.setLineDash([]);

    // 文字提示
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('拖拽或點擊上傳背景圖', canvasSize / 2, canvasSize / 2 - 20);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('支援 JPG, PNG, GIF, WebP', canvasSize / 2, canvasSize / 2 + 20);
  };

  // Canvas滑鼠事件
  const handleCanvasMouseDown = (e) => {
    if (!backgroundImage?.url) {
      // 如果沒有背景圖，點擊Canvas會觸發檔案上傳
      fileInputRef.current?.click();
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = (tempMapping.centerX / 100) * 400;
    const centerY = (tempMapping.centerY / 100) * 400;

    // 判斷是否點擊了中心點
    const distToCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (distToCenter <= 20) {
      setIsDragging(true);
      setDragType('center');
      setDragStart({ x, y });
      return;
    }

    // 判斷是否點擊了角控制點
    const bleedDim = getBleedAreaDimensions();
    if (bleedDim) {
      const scale = tempMapping.scale || 1.0;
      const bleedWidth = (bleedDim.width / bleedDim.centerX) * 400 * scale;
      const bleedHeight = (bleedDim.height / bleedDim.centerY) * 400 * scale;

      const corners = [
        { x: centerX - bleedWidth / 2, y: centerY - bleedHeight / 2 },
        { x: centerX + bleedWidth / 2, y: centerY - bleedHeight / 2 },
        { x: centerX - bleedWidth / 2, y: centerY + bleedHeight / 2 },
        { x: centerX + bleedWidth / 2, y: centerY + bleedHeight / 2 }
      ];

      for (let corner of corners) {
        const distToCorner = Math.sqrt((x - corner.x) ** 2 + (y - corner.y) ** 2);
        if (distToCorner <= 16) {
          setIsDragging(true);
          setDragType('corner');
          setDragStart({ x, y });
          return;
        }
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    if (dragType === 'center') {
      // 計算新的中心位置
      let newCenterX = tempMapping.centerX + (dx / 400) * 100;
      let newCenterY = tempMapping.centerY + (dy / 400) * 100;

      // 智慧邊界約束：確保出血區不超出背景圖
      const bleedDim = getBleedAreaDimensions();
      if (bleedDim) {
        const scale = tempMapping.scale || 1.0;
        const bleedWidthPercent = ((bleedDim.width / bleedDim.centerX) * scale * 50); // 半寬百分比
        const bleedHeightPercent = ((bleedDim.height / bleedDim.centerY) * scale * 50); // 半高百分比

        // 限制中心點移動範圍，確保出血區邊界在 0-100% 內
        newCenterX = Math.max(bleedWidthPercent, Math.min(100 - bleedWidthPercent, newCenterX));
        newCenterY = Math.max(bleedHeightPercent, Math.min(100 - bleedHeightPercent, newCenterY));
      } else {
        // 降級邊界約束
        newCenterX = Math.max(0, Math.min(100, newCenterX));
        newCenterY = Math.max(0, Math.min(100, newCenterY));
      }

      const newMapping = {
        ...tempMapping,
        centerX: newCenterX,
        centerY: newCenterY
      };
      setTempMapping(newMapping);
      onMappingChange?.(newMapping);
      setDragStart({ x, y });
    } else if (dragType === 'corner') {
      // 更新縮放
      const distance = Math.sqrt(dx * dx + dy * dy);
      let newScale = tempMapping.scale + (distance * (dx > 0 || dy > 0 ? 1 : -1)) / 200;

      // 限制縮放範圍
      newScale = Math.max(0.5, Math.min(3.0, newScale));

      // 智慧邊界約束：確保縮放後的出血區不超出背景圖
      const bleedDim = getBleedAreaDimensions();
      if (bleedDim) {
        const bleedWidthPercent = ((bleedDim.width / bleedDim.centerX) * newScale * 50);
        const bleedHeightPercent = ((bleedDim.height / bleedDim.centerY) * newScale * 50);

        // 如果縮放後會超出邊界，調整 scale
        const maxScaleX = (100 - Math.abs(tempMapping.centerX - 50)) / ((bleedDim.width / bleedDim.centerX) * 50);
        const maxScaleY = (100 - Math.abs(tempMapping.centerY - 50)) / ((bleedDim.height / bleedDim.centerY) * 50);
        const maxScale = Math.min(maxScaleX, maxScaleY);

        newScale = Math.min(newScale, maxScale);
      }

      const newMapping = {
        ...tempMapping,
        scale: newScale
      };
      setTempMapping(newMapping);
      onMappingChange?.(newMapping);
      setDragStart({ x, y });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  // 重置映射設定為預設值
  const handleResetMapping = () => {
    const defaultMapping = {
      centerX: 50,
      centerY: 50,
      scale: 1.0,
      enabled: true
    };
    setTempMapping(defaultMapping);
    onMappingChange?.(defaultMapping);
    console.log('✅ 已重置映射設定為預設值');
  };

  // 檔案拖拽上傳
  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!backgroundImage?.url) {
      setIsDragging(true);
    }
  };

  const handleCanvasDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!backgroundImage?.url) {
      setIsDragging(false);
    }
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!backgroundImage?.url) {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    }
  };

  // 檔案選擇處理
  const handleFileSelect = (file) => {
    if (!file) return;

    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      setUploadError('請選擇圖片檔案 (JPG, PNG, GIF, WebP)');
      return;
    }

    // 清除錯誤消息
    setUploadError(null);

    // 將檔案傳給父組件處理上傳
    // 父組件的 handleBackgroundImageUpload 會處理 API 調用
    onBackgroundImageUpload?.(file);
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
    e.target.value = '';
  };

  // 重繪Canvas
  useEffect(() => {
    drawCanvas();
  }, [backgroundImage, tempMapping]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 標題欄 */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">
                背景圖映射設定
              </h4>
              {backgroundImage && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  ✓ 已上傳
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Canvas區 */}
        <div className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            hidden
          />

          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
            onClick={() => !backgroundImage?.url && fileInputRef.current?.click()}
            className="w-full aspect-square border-2 border-gray-300 rounded-lg bg-white cursor-crosshair"
            style={{ maxWidth: '100%' }}
          />

          {/* 上傳狀態 */}
          {loading && (
            <div className="mt-3 text-center text-sm text-gray-600">
              正在上傳...
            </div>
          )}

          {uploadError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {uploadError}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 參數面板 */}
          {backgroundImage && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-900 mb-4">編輯參數</h5>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    中心X (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={tempMapping.centerX?.toFixed(1)}
                    onChange={(e) => {
                      const newMapping = { ...tempMapping, centerX: parseFloat(e.target.value) || 50 };
                      setTempMapping(newMapping);
                      onMappingChange?.(newMapping);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    中心Y (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={tempMapping.centerY?.toFixed(1)}
                    onChange={(e) => {
                      const newMapping = { ...tempMapping, centerY: parseFloat(e.target.value) || 50 };
                      setTempMapping(newMapping);
                      onMappingChange?.(newMapping);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    縮放倍數
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={(tempMapping.scale || 1.0).toFixed(2)}
                    onChange={(e) => {
                      const newMapping = { ...tempMapping, scale: parseFloat(e.target.value) || 1.0 };
                      setTempMapping(newMapping);
                      onMappingChange?.(newMapping);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* 重置和刪除按鈕 */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleResetMapping}
                  className="px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition font-medium"
                >
                  🔄 重置為預設
                </button>
                {backgroundImage && (
                  <button
                    onClick={() => onBackgroundImageDelete?.()}
                    className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition font-medium"
                  >
                    🗑️ 刪除背景圖
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 使用提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <p>💡 <strong>使用說明</strong>：上傳背景圖後，可在Canvas上拖動紅色中心點改變位置，拖動藍色角點改變大小。</p>
      </div>

      {/* 保存按鈕 */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={saving}
          className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            saving
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {saving ? '儲存中...' : '💾 儲存背景圖設定'}
        </button>
      )}
    </div>
  );
};

export default BackgroundImageMappingConfig;
