/**
 * 版型預覽圖組件
 * 用於顯示版型的預覽圖，支援懶載入和錯誤處理
 */

import React, { useState, useEffect } from 'react';
import { generateTemplateThumbnail } from '../../utils/TemplatePreviewGenerator';

const TemplatePreview = ({
  template,
  product,
  className = '',
  size = 'medium',
  showFallback = true,
  onPreviewGenerated = null,
  ...props
}) => {
  const [previewUrl, setPreviewUrl] = useState(template?.thumbnail || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // 尺寸配置
  const sizeConfig = {
    small: { width: 100, height: 75 },
    medium: { width: 200, height: 150 },
    large: { width: 300, height: 225 }
  };

  const { width, height } = sizeConfig[size] || sizeConfig.medium;

  // 生成預覽圖
  const generatePreview = async () => {
    if (!template || loading) return;

    try {
      setLoading(true);
      setError(false);

      const thumbnailData = await generateTemplateThumbnail(template, product);

      if (thumbnailData) {
        setPreviewUrl(thumbnailData);
        if (onPreviewGenerated) {
          onPreviewGenerated(thumbnailData);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('生成預覽圖失敗:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 當版型或商品資料變化時重新生成預覽圖
  useEffect(() => {
    if (template && !previewUrl) {
      generatePreview();
    }
  }, [template, product]);

  // 載入中狀態
  if (loading) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
        {...props}
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
          <span className="text-xs text-gray-500">生成中...</span>
        </div>
      </div>
    );
  }

  // 錯誤或無預覽圖狀態
  if (error || !previewUrl) {
    if (!showFallback) {
      return null;
    }

    return (
      <div
        className={`bg-gray-100 flex items-center justify-center border border-gray-200 rounded ${className}`}
        style={{ width, height }}
        {...props}
      >
        <div className="flex flex-col items-center text-gray-400">
          <span className="text-2xl mb-1">📐</span>
          <span className="text-xs">
            {error ? '生成失敗' : '無預覽圖'}
          </span>
          {error && (
            <button
              onClick={generatePreview}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
            >
              重試
            </button>
          )}
        </div>
      </div>
    );
  }

  // 正常顯示預覽圖
  return (
    <img
      src={previewUrl}
      alt={template?.name || '版型預覽'}
      className={`object-cover border border-gray-200 rounded ${className}`}
      style={{ width, height }}
      onError={() => setError(true)}
      {...props}
    />
  );
};

export default TemplatePreview;