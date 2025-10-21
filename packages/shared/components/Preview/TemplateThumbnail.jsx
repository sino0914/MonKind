/**
 * 版型縮略圖組件
 * 基於 ProductThumbnail，確保 Template 和其他設計的一致性展示
 */

import React, { useState, useEffect } from 'react';
import ProductThumbnail from './ProductThumbnail';
import { API } from '../../services/api';

const TemplateThumbnail = ({
  template,
  width = 160,
  height = 160,
  className = '',
  showElementCount = true,
  showName = true,
  onError = null
}) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入商品資料
  useEffect(() => {
    const loadProduct = async () => {
      if (!template?.productId) {
        setError('Template缺少商品ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const productData = await API.products.getById(template.productId);
        if (!productData) {
          setError('商品不存在');
          return;
        }
        setProduct(productData);
      } catch (err) {
        setError('載入失敗');
        onError && onError(err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [template?.productId, onError]);

  // 直接返回原始元素，讓 ProductThumbnail 處理縮放
  const getScaledElements = () => {
    if (!template?.elements) return [];

    // 直接返回原始元素，避免雙重縮放
    return template.elements;
  };

  // 載入狀態
  if (loading) {
    return (
      <div className={className} style={{ width, height }}>
        <div className="bg-gray-100 w-full h-full rounded flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-1"></div>
            <span className="text-xs text-gray-500">載入中</span>
          </div>
        </div>
        {showName && template?.name && (
          <p className="text-xs text-gray-600 mt-1 text-center truncate">
            {template.name}
          </p>
        )}
      </div>
    );
  }

  // 錯誤狀態
  if (error || !product) {
    return (
      <div className={className} style={{ width, height }}>
        <div className="bg-red-50 w-full h-full rounded flex items-center justify-center border border-red-200">
          <div className="text-center">
            <span className="text-red-500 text-lg">❌</span>
            <p className="text-xs text-red-600 mt-1">{error || '載入失敗'}</p>
            {template?.productId && (
              <p className="text-xs text-gray-500 mt-1">商品ID: {template.productId}</p>
            )}
          </div>
        </div>
        {showName && template?.name && (
          <p className="text-xs text-gray-600 mt-1 text-center truncate">
            {template.name}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative">
        {/* 使用 ProductThumbnail 確保一致性 */}
        <ProductThumbnail
          product={product}
          designElements={getScaledElements()}
          backgroundColor={template.backgroundColor || '#ffffff'}
          width={width}
          height={height}
          showElementCount={showElementCount}
          className="border border-gray-200"
          snapshot3D={product.type === '3D' ? template.previewImage : null}
          snapshot2D={product.type === '2D' ? template.previewImage : null}
        />

        {/* 版型狀態標示 */}
        {!template?.isActive && (
          <div className="absolute top-1 left-1 bg-gray-500 text-white text-xs px-1 py-0.5 rounded">
            停用
          </div>
        )}
      </div>

      {/* 版型名稱 */}
      {showName && template?.name && (
        <p className="text-xs text-gray-600 mt-1 text-center truncate" title={template.name}>
          {template.name}
        </p>
      )}
    </div>
  );
};

export default TemplateThumbnail;