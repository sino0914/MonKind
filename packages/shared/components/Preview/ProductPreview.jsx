/**
 * 商品預覽組件
 * 可重用的商品設計預覽器，支援 2D 和 3D 預覽
 */

import React, { useState, useEffect, useCallback } from "react";
import { API } from "../../services/api";
import GLBViewer from "../GLBViewer";

const ProductPreview = ({
  productId,
  designElements = [],
  backgroundColor = "#ffffff",
  className = "",
  showControls = true,
  showInfo = true,
  width = null, // 改為可選，預設 null 表示響應式
  height = null, // 改為可選，預設 null 表示響應式
  scaleFactor = null, // 新增縮放因子參數
  ...props
}) => {
  // 計算實際尺寸：如果未指定則使用響應式
  const containerWidth = width || '100%';
  const containerHeight = height || '100%';
  const isResponsive = !width || !height;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedMockupImage, setProcessedMockupImage] = useState(null);
  const [uvTestTexture, setUvTestTexture] = useState(null);

  const uvMapping = {
    defaultUV: {
      u: 0.5,
      v: 0.5,
      width: 1,
      height: 1,
    },
  };

  // 載入商品資料
  const loadProduct = useCallback(async () => {
    if (!productId) {
      setError("缺少商品ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const productData = await API.products.getById(parseInt(productId));
      if (!productData) {
        setError("找不到此商品");
        return;
      }

      // 檢查是否有設計區設定
      if (!productData.printArea) {
        console.warn("此商品尚未設定設計區範圍，使用預設值");
        productData.printArea = { x: 50, y: 50, width: 200, height: 150 };
      }

      setProduct(productData);
    } catch (error) {
      console.error("載入商品失敗:", error);
      setError("載入商品失敗，請重新嘗試");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // 判斷是否使用展示圖片
  const shouldUseDisplayImage = useCallback(() => {
    if (!product) return false;
    if (product.type === '3D') return false;
    if (!product.displayImage) return false;
    if (!product.displayImageDesignArea) return false;

    const { centerX, centerY, scale } = product.displayImageDesignArea;
    if (typeof centerX !== 'number' || typeof centerY !== 'number' || typeof scale !== 'number') {
      return false;
    }

    return true;
  }, [product]);

  // 計算設計區域邊界（展示圖片模式）
  const getDesignAreaBounds = useCallback(() => {
    if (!product?.printArea || !product?.displayImageDesignArea) return null;

    const { centerX, centerY, scale } = product.displayImageDesignArea;
    const scaledWidth = product.printArea.width * scale;
    const scaledHeight = product.printArea.height * scale;

    return {
      x: centerX - scaledWidth / 2,
      y: centerY - scaledHeight / 2,
      width: scaledWidth,
      height: scaledHeight
    };
  }, [product]);

  // 背景色現在直接設定在設計區域，不再處理商品圖片顏色
  useEffect(() => {
    if (product?.mockupImage) {
      setProcessedMockupImage(product.mockupImage);
    } else {
      setProcessedMockupImage(null);
    }
  }, [product?.mockupImage]);

  // 載入商品資料
  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  /**
   * 產生 UV 用的 Canvas（支援 3D 正方形、白底、背景色、zIndex、圖片/文字順序繪製）
   * 回傳：Promise<HTMLCanvasElement | null>
   */
  const generateUVTexture = useCallback(async () => {
    if (!product || !product.printArea) return null;

    const { width: printWidth, height: printHeight } = product.printArea;
    const is3D = product.type === "3D";

    // === 畫布尺寸（3D 要正方形）===
    const maxSize = Math.max(printWidth, printHeight);
    const canvasWidth = is3D ? maxSize : printWidth;
    const canvasHeight = is3D ? maxSize : printHeight;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // 解析度倍率
    const scale = 3;
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    ctx.scale(scale, scale);

    // === 背景處理（❗先白底，避免透明導致 three.js 看起來發黑）===
    if (is3D) {
      // 3D：整張先白底，再把設計區域塗上 backgroundColor（若非白）
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      if (backgroundColor && backgroundColor !== "#ffffff") {
        ctx.fillStyle = backgroundColor;
        // 目前你的 3D UV 是從左上(0,0)鋪設計區域
        ctx.fillRect(0, 0, printWidth, printHeight);
      }
    } else {
      // 2D：整面鋪滿背景色；沒背景色則透明
      if (backgroundColor && backgroundColor !== "#ffffff") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      }
    }

    // 載圖工具
    const loadImage = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });

    // 依 zIndex 排序，保證圖層順序
    const sorted = [...designElements].sort(
      (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
    );

    // === 逐一繪製（保證順序）===
    for (const el of sorted) {
      if (!el) continue;

      // 設計區相對位置
      const relX = el.x - product.printArea.x;
      const relY = el.y - product.printArea.y;

      // 目前 3D 正方形沒有置中偏移（如需置中可加 offsetX/offsetY）
      const finalX = relX;
      const finalY = relY;

      // 超出設計區就略過（可依需求移除）
      if (relX < 0 || relY < 0 || relX >= printWidth || relY >= printHeight)
        continue;

      if (el.type === "text") {
        // 保存當前狀態
        ctx.save();

        // 設定文字樣式
        ctx.fillStyle = el.color || "#000000";
        ctx.font = `${el.fontWeight || "normal"} ${el.fontStyle || "normal"} ${el.fontSize || 16}px ${
          el.fontFamily || "Arial"
        }`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // 如果有旋轉，應用旋轉變換
        if (el.rotation && el.rotation !== 0) {
          ctx.translate(finalX, finalY);
          ctx.rotate((el.rotation * Math.PI) / 180);
          ctx.fillText(el.content || "", 0, 0);
        } else {
          ctx.fillText(el.content || "", finalX, finalY);
        }

        // 恢復狀態
        ctx.restore();
      }

      if (el.type === "image") {
        let img = el.imageElement;
        if (!img && el.url) img = await loadImage(el.url);
        if (img) {
          // 計算實際渲染尺寸（考慮自由變形 scaleX/scaleY）
          const baseW = el.width || 100;
          const baseH = el.height || 100;
          const w = baseW * (el.scaleX || 1);
          const h = baseH * (el.scaleY || 1);

          // 圓角處理（與形狀裁切互斥）
          const hasShapeClip = el.shapeClip && el.shapeClip.clipPath;
          const borderRadius = !hasShapeClip && el.borderRadius ? el.borderRadius : 0;
          // 計算圓角半徑（百分比轉為像素，基於較小邊）
          const radiusPx = borderRadius > 0 ? (Math.min(w, h) * borderRadius) / 100 : 0;

          // 繪製帶圓角的矩形路徑
          const drawRoundedRect = (x, y, width, height, radius) => {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
          };

          // 保存當前狀態
          ctx.save();

          // 如果有旋轉，應用旋轉變換
          if (el.rotation && el.rotation !== 0) {
            ctx.translate(finalX, finalY);
            ctx.rotate((el.rotation * Math.PI) / 180);

            // 檢查是否有蒙版數據
            if (el.hasMask && el.mask) {
              const mask = el.mask;
              const maskLeft = mask.x - mask.width / 2;
              const maskTop = mask.y - mask.height / 2;
              const maskRight = mask.x + mask.width / 2;
              const maskBottom = mask.y + mask.height / 2;

              const topPercent = maskTop / el.height;
              const rightPercent = 1 - maskRight / el.width;
              const bottomPercent = 1 - maskBottom / el.height;
              const leftPercent = maskLeft / el.width;

              const clipTop = topPercent * h;
              const clipRight = rightPercent * w;
              const clipBottom = bottomPercent * h;
              const clipLeft = leftPercent * w;

              ctx.save();
              ctx.beginPath();
              ctx.rect(
                -w / 2 + clipLeft,
                -h / 2 + clipTop,
                w - clipLeft - clipRight,
                h - clipTop - clipBottom
              );
              ctx.clip();
              ctx.drawImage(img, -w / 2, -h / 2, w, h);
              ctx.restore();
            } else if (radiusPx > 0) {
              // 有圓角，應用圓角剪裁
              ctx.save();
              drawRoundedRect(-w / 2, -h / 2, w, h, radiusPx);
              ctx.clip();
              ctx.drawImage(img, -w / 2, -h / 2, w, h);
              ctx.restore();
            } else {
              ctx.drawImage(img, -w / 2, -h / 2, w, h);
            }
          } else {
            // 檢查是否有蒙版數據
            if (el.hasMask && el.mask) {
              const mask = el.mask;
              const maskLeft = mask.x - mask.width / 2;
              const maskTop = mask.y - mask.height / 2;
              const maskRight = mask.x + mask.width / 2;
              const maskBottom = mask.y + mask.height / 2;

              const topPercent = maskTop / el.height;
              const rightPercent = 1 - maskRight / el.width;
              const bottomPercent = 1 - maskBottom / el.height;
              const leftPercent = maskLeft / el.width;

              const clipTop = topPercent * h;
              const clipRight = rightPercent * w;
              const clipBottom = bottomPercent * h;
              const clipLeft = leftPercent * w;

              ctx.save();
              ctx.beginPath();
              ctx.rect(
                finalX - w / 2 + clipLeft,
                finalY - h / 2 + clipTop,
                w - clipLeft - clipRight,
                h - clipTop - clipBottom
              );
              ctx.clip();
              ctx.drawImage(img, finalX - w / 2, finalY - h / 2, w, h);
              ctx.restore();
            } else if (radiusPx > 0) {
              // 有圓角，應用圓角剪裁
              ctx.save();
              drawRoundedRect(finalX - w / 2, finalY - h / 2, w, h, radiusPx);
              ctx.clip();
              ctx.drawImage(img, finalX - w / 2, finalY - h / 2, w, h);
              ctx.restore();
            } else {
              ctx.drawImage(img, finalX - w / 2, finalY - h / 2, w, h);
            }
          }

          // 恢復狀態
          ctx.restore();
        }
      }
    }

    return canvas;
  }, [product, designElements, backgroundColor]);

  // 當設計內容改變時更新UV貼圖（❗正確等待 async 回傳，不要把 Promise 塞進 state）
  useEffect(() => {
    if (product && product.type === "3D") {
      let cancelled = false;
      (async () => {
        const textureCanvas = await generateUVTexture();
        if (!cancelled && textureCanvas) {
          setUvTestTexture(textureCanvas); // 存的是 HTMLCanvasElement
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [product, designElements, backgroundColor, generateUVTexture]);

  // 載入中狀態
  if (loading) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`} {...props}>
        <div
          className="bg-white rounded border-2 border-gray-200 relative overflow-hidden flex items-center justify-center"
          style={{
            width: containerWidth,
            height: containerHeight,
            minWidth: isResponsive ? '440px' : undefined,
            minHeight: isResponsive ? '440px' : undefined,
            maxWidth: isResponsive ? 'min(90vh, calc(100vw - 600px))' : undefined,
            maxHeight: isResponsive ? 'min(90vh, calc(100vh - 200px))' : undefined,
            aspectRatio: isResponsive ? '1 / 1' : undefined,
          }}
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
          style={{
            width: containerWidth,
            height: containerHeight,
            minWidth: isResponsive ? '440px' : undefined,
            minHeight: isResponsive ? '440px' : undefined,
            maxWidth: isResponsive ? 'min(90vh, calc(100vw - 600px))' : undefined,
            maxHeight: isResponsive ? 'min(90vh, calc(100vh - 200px))' : undefined,
            aspectRatio: isResponsive ? '1 / 1' : undefined,
          }}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">❌</div>
            <p className="text-red-600 text-sm">{error || "載入失敗"}</p>
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
      {product.type === "3D" && product.model3D?.glbUrl ? (
        /* 3D GLB 模型預覽 */
        <div
          className="bg-white rounded border-2 border-gray-200 relative overflow-hidden"
          style={{
            width: containerWidth,
            height: containerHeight,
            minWidth: isResponsive ? '440px' : undefined,
            minHeight: isResponsive ? '440px' : undefined,
            maxWidth: isResponsive ? 'min(90vh, calc(100vw - 600px))' : undefined,
            maxHeight: isResponsive ? 'min(90vh, calc(100vh - 200px))' : undefined,
            aspectRatio: isResponsive ? '1 / 1' : undefined,
          }}
        >
          <GLBViewer
            glbUrl={product.model3D.glbUrl}
            className="w-full h-full"
            autoRotate={false}
            uvMapping={uvMapping}
            testTexture={uvTestTexture} 
          />
        </div>
      ) : (
        /* 2D 預覽 (T恤等其他產品) */
        <div
          className="bg-white rounded border-2 border-gray-200 relative overflow-hidden"
          style={{
            width: containerWidth,
            height: containerHeight,
            minWidth: isResponsive ? '440px' : undefined,
            minHeight: isResponsive ? '440px' : undefined,
            maxWidth: isResponsive ? 'min(90vh, calc(100vw - 600px))' : undefined,
            maxHeight: isResponsive ? 'min(90vh, calc(100vh - 200px))' : undefined,
            aspectRatio: isResponsive ? '1 / 1' : undefined,
          }}
        >
          {/* Product Mockup as Background */}
          <img
            src={shouldUseDisplayImage() ? product.displayImage : (processedMockupImage || product.mockupImage)}
            alt={`${product.title} 預覽`}
            className="w-full h-full object-contain"
            onError={(e) => {
              const imgSrc = shouldUseDisplayImage() ? product.displayImage : product.mockupImage;
              console.error('2D產品底圖載入失敗:', imgSrc);
              e.target.style.display = "none";
            }}
          />

          {/* 設計區域背景色 - 與編輯器設計區域保持一致 */}
          {backgroundColor && product.printArea && (
            <div
              className="absolute"
              style={(() => {
                if (shouldUseDisplayImage()) {
                  const bounds = getDesignAreaBounds();
                  if (!bounds) return {};

                  return {
                    left: `${(bounds.x / 400) * 100}%`,
                    top: `${(bounds.y / 400) * 100}%`,
                    width: `${(bounds.width / 400) * 100}%`,
                    height: `${(bounds.height / 400) * 100}%`,
                    backgroundColor: backgroundColor,
                    zIndex: 1,
                  };
                } else {
                  return {
                    left: `${(product.printArea.x / 400) * 100}%`,
                    top: `${(product.printArea.y / 400) * 100}%`,
                    width: `${(product.printArea.width / 400) * 100}%`,
                    height: `${(product.printArea.height / 400) * 100}%`,
                    backgroundColor: backgroundColor,
                    zIndex: 1,
                  };
                }
              })()}
            />
          )}

          {/* Design Elements with Clipping */}
          <div
            className="absolute overflow-hidden"
            style={(() => {
              if (shouldUseDisplayImage()) {
                const bounds = getDesignAreaBounds();
                if (!bounds) return {};

                return {
                  left: `${(bounds.x / 400) * 100}%`,
                  top: `${(bounds.y / 400) * 100}%`,
                  width: `${(bounds.width / 400) * 100}%`,
                  height: `${(bounds.height / 400) * 100}%`,
                  zIndex: 2,
                };
              } else {
                return {
                  left: `${product.printArea ? (product.printArea.x / 400) * 100 : 0}%`,
                  top: `${product.printArea ? (product.printArea.y / 400) * 100 : 0}%`,
                  width: `${product.printArea ? (product.printArea.width / 400) * 100 : 100}%`,
                  height: `${product.printArea ? (product.printArea.height / 400) * 100 : 100}%`,
                  zIndex: 2,
                };
              }
            })()}
          >
            {/* Design Elements in Preview */}
            {designElements.map((element) => {
              if (element.type === "text") {
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
                      transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
                      fontSize: `${
                        element.fontSize * (scaleFactor || (width ? width / 400 : 1.1))
                      }px`,
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

                // 判斷是否有剪裁和形狀裁切
                const hasShapeClip = element.shapeClip && element.shapeClip.clipPath;
                const hasMask = !hasShapeClip && element.hasMask && element.mask;
                // 計算縮放比例（預覽區域相對於原始 400px 的縮放）
                const previewScale = width ? width / 400 : 1.1;
                // 圓角值需要按比例縮放
                const scaledBorderRadius = element.borderRadius ? element.borderRadius * previewScale : 0;

                return (
                  <div
                    key={`preview-${element.id}`}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${(relativeX / areaWidth) * 100}%`,
                      top: `${(relativeY / areaHeight) * 100}%`,
                      width: `${(element.width / areaWidth) * 100}%`,
                      height: `${(element.height / areaHeight) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      opacity: element.opacity || 1,
                      overflow: hasMask ? 'hidden' : 'visible',
                      // 圓角設定（與形狀裁切互斥，無剪裁時套用在容器）
                      borderRadius: !hasShapeClip && !hasMask && scaledBorderRadius ? `${scaledBorderRadius}px` : '0',
                    }}
                  >
                    <img
                      src={element.url}
                      alt="預覽圖片"
                      className="w-full h-full"
                      style={{
                        transform: `rotate(${element.rotation || 0}deg)`,
                        objectFit: (element.scaleX && element.scaleY && element.scaleX !== element.scaleY) ? 'fill' : 'cover',
                        // 形狀裁切（優先）或遮罩裁切（有剪裁時圓角套用在 inset round）
                        clipPath: hasShapeClip
                          ? element.shapeClip.clipPath
                          : (hasMask ? `inset(
                          ${((element.mask.y - element.mask.height / 2) / element.height) * 100}%
                          ${(1 - (element.mask.x + element.mask.width / 2) / element.width) * 100}%
                          ${(1 - (element.mask.y + element.mask.height / 2) / element.height) * 100}%
                          ${((element.mask.x - element.mask.width / 2) / element.width) * 100}%
                          ${scaledBorderRadius ? `round ${scaledBorderRadius}px` : ''}
                        )` : undefined),
                        // 圓角需要配合 borderRadius 在容器上
                        borderRadius: 'inherit',
                      }}
                      onLoad={(e) => {
                        // 圖片載入成功時，恢復顯示
                        e.target.parentElement.style.display = '';
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
                        transform: `translate(-50%, -50%) rotate(${element.rotation || 0}deg)`,
                        fontSize: `${
                          element.fontSize * (scaleFactor || (width ? width / 400 : 1.1))
                        }px`,
                        color: element.color,
                        fontFamily: element.fontFamily,
                        fontWeight: element.fontWeight || "normal",
                        fontStyle: element.fontStyle || "normal",
                      }}
                    >
                      {element.content}
                    </div>
                  );
                } else if (element.type === "image") {
                  // 判斷是否有剪裁和形狀裁切
                  const hasShapeClip = element.shapeClip && element.shapeClip.clipPath;
                  const hasMask = !hasShapeClip && element.hasMask && element.mask;
                  // 計算縮放比例
                  const previewScale = width ? width / 400 : 1.1;
                  const scaledBorderRadius = element.borderRadius ? element.borderRadius * previewScale : 0;

                  return (
                    <div
                      key={`preview-fallback-${element.id}`}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${(element.x / 400) * 100}%`,
                        top: `${(element.y / 400) * 100}%`,
                        width: `${(element.width / 400) * 100}%`,
                        height: `${(element.height / 400) * 100}%`,
                        transform: "translate(-50%, -50%)",
                        opacity: element.opacity || 1,
                        overflow: hasMask ? 'hidden' : 'visible',
                        // 圓角設定（與形狀裁切互斥，無剪裁時套用在容器）
                        borderRadius: !hasShapeClip && !hasMask && scaledBorderRadius ? `${scaledBorderRadius}px` : '0',
                      }}
                    >
                      <img
                        src={element.url}
                        alt="預覽圖片"
                        className="w-full h-full"
                        style={{
                          transform: `rotate(${element.rotation || 0}deg)`,
                          objectFit: (element.scaleX && element.scaleY && element.scaleX !== element.scaleY) ? 'fill' : 'cover',
                          // 形狀裁切（優先）或遮罩裁切（有剪裁時圓角套用在 inset round）
                          clipPath: hasShapeClip
                            ? element.shapeClip.clipPath
                            : (hasMask ? `inset(
                            ${((element.mask.y - element.mask.height / 2) / element.height) * 100}%
                            ${(1 - (element.mask.x + element.mask.width / 2) / element.width) * 100}%
                            ${(1 - (element.mask.y + element.mask.height / 2) / element.height) * 100}%
                            ${((element.mask.x - element.mask.width / 2) / element.width) * 100}%
                            ${scaledBorderRadius ? `round ${scaledBorderRadius}px` : ''}
                          )` : undefined),
                          // 圓角需要配合 borderRadius 在容器上
                          borderRadius: 'inherit',
                        }}
                        onLoad={(e) => {
                          // 圖片載入成功時，恢復顯示
                          e.target.parentElement.style.display = '';
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
          )}
        </div>
      )}

      {showInfo && (
        <div className="mt-3 text-center">
          {product.type === "3D" ? (
            <div>
              <p className="text-xs text-gray-600">
                🖱️ 拖拽旋轉 | 🔄 滾輪縮放 | ⌨️ 右鍵平移
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-600">設計會自動裁切至印刷區域</p>
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
