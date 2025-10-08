/**
 * 輕量級商品縮略圖組件
 * 專門用於列表項目的快速預覽，不包含載入邏輯0
 */

import React from 'react';

const ProductThumbnail = ({
  product, // 已有的商品資料
  designElements = [],
  backgroundColor = '#ffffff',
  width = 80,
  height = 80,
  className = '',
  showElementCount = false,
  snapshot3D = null, // 3D 快照
  snapshot2D = null  // 2D 快照
}) => {
  if (!product) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center rounded ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-xs">無圖</span>
      </div>
    );
  }

  // 根據商品類型選擇快照
  const snapshot = product.type === '3D' ? snapshot3D : snapshot2D;

  // 如果有快照，優先顯示快照
  if (snapshot) {
    // 判斷 snapshot 是相對路徑、完整 URL 還是 base64
    let snapshotSrc = snapshot;
    if (typeof snapshot === 'string') {
      if (snapshot.startsWith('/')) {
        // 相對路徑，需要加上 base URL
        snapshotSrc = `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002'}${snapshot}`;
      } else if (!snapshot.startsWith('http') && !snapshot.startsWith('data:')) {
        // 可能是檔名，加上完整路徑
        snapshotSrc = `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002'}/uploads/snapshots/${snapshot}`;
      }
      // 如果已經是完整 URL (http...) 或 base64 (data:...)，直接使用
    }

    return (
      <div
        className={`relative overflow-hidden rounded ${className}`}
        style={{ width, height }}
      >
        <img
          src={snapshotSrc}
          alt={product.title}
          className="w-full h-full object-contain"
        />
        {/* 元素數量標示 */}
        {showElementCount && designElements.length > 0 && (
          <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded-full text-center leading-none">
            {designElements.length}
          </div>
        )}
      </div>
    );
  }

  // 計算縮放因子
  const scaleFactor = width / 400;

  return (
    <div
      className={`relative overflow-hidden rounded ${className}`}
      style={{ width, height }}
    >
      {/* 商品背景圖 */}
      <div className="absolute inset-0">
        <img
          src={product.mockupImage || product.image}
          alt={product.title}
          className="w-full h-full object-contain"
        />
      </div>

      {/* 設計區域背景色 */}
      {backgroundColor && product.printArea && (
        <div
          className="absolute"
          style={{
            left: `${(product.printArea.x / 400) * 100}%`,
            top: `${(product.printArea.y / 400) * 100}%`,
            width: `${(product.printArea.width / 400) * 100}%`,
            height: `${(product.printArea.height / 400) * 100}%`,
            backgroundColor: backgroundColor,
            zIndex: 1
          }}
        />
      )}

      {/* 設計元素 */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${product.printArea ? (product.printArea.x / 400) * 100 : 0}%`,
          top: `${product.printArea ? (product.printArea.y / 400) * 100 : 0}%`,
          width: `${product.printArea ? (product.printArea.width / 400) * 100 : 100}%`,
          height: `${product.printArea ? (product.printArea.height / 400) * 100 : 100}%`,
          zIndex: 2
        }}
      >
        {designElements.map((element) => {
          if (element.type === "text") {
            const relativeX = product.printArea ? element.x - product.printArea.x : element.x;
            const relativeY = product.printArea ? element.y - product.printArea.y : element.y;
            const areaWidth = product.printArea ? product.printArea.width : 400;
            const areaHeight = product.printArea ? product.printArea.height : 400;

            return (
              <div
                key={`thumb-${element.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${(relativeX / areaWidth) * 100}%`,
                  top: `${(relativeY / areaHeight) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
                  fontSize: `${element.fontSize * scaleFactor}px`,
                  color: element.color,
                  fontFamily: element.fontFamily,
                  fontWeight: element.fontWeight || "normal",
                  fontStyle: element.fontStyle || "normal",
                  whiteSpace: "nowrap",
                  overflow: "visible",
                }}
              >
                {element.content}
              </div>
            );
          } else if (element.type === "image") {
            const relativeX = product.printArea ? element.x - product.printArea.x : element.x;
            const relativeY = product.printArea ? element.y - product.printArea.y : element.y;
            const areaWidth = product.printArea ? product.printArea.width : 400;
            const areaHeight = product.printArea ? product.printArea.height : 400;

            return (
              <div
                key={`thumb-${element.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: `${(relativeX / areaWidth) * 100}%`,
                  top: `${(relativeY / areaHeight) * 100}%`,
                  width: `${(element.width / areaWidth) * 100}%`,
                  height: `${(element.height / areaHeight) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: element.opacity || 1,
                }}
              >
                <img
                  src={element.url}
                  alt="預覽圖片"
                  className="w-full h-full object-contain"
                  style={{
                    transform: `rotate(${element.rotation || 0}deg)`,
                  }}
                  onError={(e) => {
                    // 圖片載入失敗時完全隱藏
                    e.target.parentElement.style.display = 'none';
                  }}
                />
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* 元素數量標示 */}
      {showElementCount && designElements.length > 0 && (
        <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded-full text-center leading-none">
          {designElements.length}
        </div>
      )}
    </div>
  );
};

export default ProductThumbnail;