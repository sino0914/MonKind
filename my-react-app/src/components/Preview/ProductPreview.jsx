/**
 * 商品預覽組件
 * 可重用的商品設計預覽器，支援 2D 和 3D 預覽
 */

import React, { useState, useEffect, useCallback } from 'react';
import { API } from '../../services/api';
import Mug3D from '../3D/Mug3D';

const ProductPreview = ({
  productId,
  designElements = [],
  backgroundColor = '#ffffff',
  className = '',
  showControls = true,
  showInfo = true,
  width = 320,
  height = 320,
  scaleFactor = null, // 新增縮放因子參數
  ...props
}) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedMockupImage, setProcessedMockupImage] = useState(null);

  // 載入商品資料
  const loadProduct = useCallback(async () => {
    if (!productId) {
      setError('缺少商品ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const productData = await API.products.getById(parseInt(productId));
      if (!productData) {
        setError('找不到此商品');
        return;
      }

      // 檢查是否有設計區設定
      if (!productData.printArea) {
        console.warn('此商品尚未設定設計區範圍，使用預設值');
        productData.printArea = { x: 50, y: 50, width: 200, height: 150 };
      }

      setProduct(productData);
    } catch (error) {
      console.error('載入商品失敗:', error);
      setError('載入商品失敗，請重新嘗試');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // 背景色現在直接設定在設計區域，不再處理商品圖片顏色
  // 保持原始商品底圖，背景色通過設計區域背景色層顯示
  useEffect(() => {
    if (product?.mockupImage) {
      // 直接使用原始圖片，不進行顏色處理
      setProcessedMockupImage(product.mockupImage);
    } else {
      setProcessedMockupImage(null);
    }
  }, [product?.mockupImage]);

  // 載入商品資料
  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // 載入中狀態
  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`} {...props}>
        <div
          className="bg-white rounded border-2 border-gray-200 relative overflow-hidden flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">載入預覽中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error || !product) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`} {...props}>
        <div
          className="bg-white rounded border-2 border-gray-200 relative overflow-hidden flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-red-600 text-sm">{error || '載入失敗'}</p>
            <button
              onClick={loadProduct}
              className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              重試
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`} {...props}>
      {product.category === "mug" ? (
        /* 3D 馬克杯預覽 */
        <div
          className="bg-white rounded border-2 border-gray-200 relative overflow-hidden"
          style={{ width, height }}
        >
          <Mug3D
            designElements={designElements}
            product={product}
          />
          {showControls && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              🖱️ 拖曳旋轉 • 滾輪縮放
            </div>
          )}
        </div>
      ) : (
        /* 2D 預覽 (T恤等其他產品) */
        <div
          className="bg-white rounded border-2 border-gray-200 relative overflow-hidden"
          style={{ width, height }}
        >
          {/* Product Mockup as Background */}
          {product.mockupImage ? (
            <img
              src={processedMockupImage || product.mockupImage}
              alt={`${product.title} 預覽`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
          ) : (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          )}

          {/* 設計區域背景色 - 與編輯器設計區域保持一致 */}
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

          {/* Design Elements with Clipping */}
          <div
            className="absolute overflow-hidden"
            style={{
              left: `${
                product.printArea
                  ? (product.printArea.x / 400) * 100
                  : 0
              }%`,
              top: `${
                product.printArea
                  ? (product.printArea.y / 400) * 100
                  : 0
              }%`,
              width: `${
                product.printArea
                  ? (product.printArea.width / 400) * 100
                  : 100
              }%`,
              height: `${
                product.printArea
                  ? (product.printArea.height / 400) * 100
                  : 100
              }%`,
              zIndex: 2
            }}
          >
            {/* Design Elements in Preview */}
            {designElements.map((element) => {
              if (element.type === "text") {
                // 計算文字在設計區域內的相對位置
                const relativeX = product.printArea
                  ? element.x - product.printArea.x
                  : element.x;
                const relativeY = product.printArea
                  ? element.y - product.printArea.y
                  : element.y;
                const areaWidth = product.printArea
                  ? product.printArea.width
                  : 400;
                const areaHeight = product.printArea
                  ? product.printArea.height
                  : 400;

                return (
                  <div
                    key={`preview-${element.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${(relativeX / areaWidth) * 100}%`,
                      top: `${(relativeY / areaHeight) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${
                        element.fontSize * (scaleFactor || (width / 400))
                      }px`, // 動態縮放因子
                      color: element.color,
                      fontFamily: element.fontFamily,
                      fontWeight:
                        element.fontWeight || "normal",
                      fontStyle: element.fontStyle || "normal",
                      whiteSpace: "nowrap", // 防止換行
                      overflow: "visible", // 讓文字能顯示但被父容器裁切
                    }}
                  >
                    {element.content}
                  </div>
                );
              } else if (element.type === "image") {
                // 計算圖片在設計區域內的相對位置
                const relativeX = product.printArea
                  ? element.x - product.printArea.x
                  : element.x;
                const relativeY = product.printArea
                  ? element.y - product.printArea.y
                  : element.y;
                const areaWidth = product.printArea
                  ? product.printArea.width
                  : 400;
                const areaHeight = product.printArea
                  ? product.printArea.height
                  : 400;

                return (
                  <div
                    key={`preview-${element.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${(relativeX / areaWidth) * 100}%`,
                      top: `${(relativeY / areaHeight) * 100}%`,
                      width: `${
                        (element.width / areaWidth) * 100
                      }%`,
                      height: `${
                        (element.height / areaHeight) * 100
                      }%`,
                      transform: "translate(-50%, -50%)",
                      opacity: element.opacity || 1,
                    }}
                  >
                    <img
                      src={element.url}
                      alt="預覽圖片"
                      className="w-full h-full object-contain"
                      style={{
                        transform: `rotate(${
                          element.rotation || 0
                        }deg)`,
                      }}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* No Print Area Fallback */}
          {!product.printArea && designElements.length > 0 && (
            <div className="absolute inset-0" style={{ zIndex: 2 }}>
              {designElements.map((element) => {
                if (element.type === "text") {
                  return (
                    <div
                      key={`preview-fallback-${element.id}`}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${(element.x / 400) * 100}%`,
                        top: `${(element.y / 400) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        fontSize: `${
                          element.fontSize * (scaleFactor || (width / 400))
                        }px`,
                        color: element.color,
                        fontFamily: element.fontFamily,
                        fontWeight:
                          element.fontWeight || "normal",
                        fontStyle:
                          element.fontStyle || "normal",
                      }}
                    >
                      {element.content}
                    </div>
                  );
                } else if (element.type === "image") {
                  return (
                    <div
                      key={`preview-fallback-${element.id}`}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${(element.x / 400) * 100}%`,
                        top: `${(element.y / 400) * 100}%`,
                        width: `${
                          (element.width / 400) * 100
                        }%`,
                        height: `${
                          (element.height / 400) * 100
                        }%`,
                        transform: "translate(-50%, -50%)",
                        opacity: element.opacity || 1,
                      }}
                    >
                      <img
                        src={element.url}
                        alt="預覽圖片"
                        className="w-full h-full object-contain"
                        style={{
                          transform: `rotate(${
                            element.rotation || 0
                          }deg)`,
                        }}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      )}

      {showInfo && (
        <div className="mt-3 text-center">
          {product.category === "mug" ? (
            <div>
              <p className="text-xs text-gray-600">
                3D 即時預覽 - 可旋轉查看效果
              </p>
              <p className="text-xs text-gray-500 mt-1">
                設計會環繞在馬克杯表面
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-600">
                設計會自動裁切至印刷區域
              </p>
              {product.printArea && (
                <p className="text-xs text-gray-500 mt-1">
                  印刷區域: {product.printArea.width} ×{" "}
                  {product.printArea.height} px
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPreview;