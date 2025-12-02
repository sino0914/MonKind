/**
 * 2D 快照生成工具
 * 用於生成 2D 商品的設計快照
 * 參考 ProductPreview.jsx 的 2D 渲染方式
 */

import { getBleedMappingTransform } from '../../ProductMaintenance/utils/bleedAreaMappingUtils';

/**
 * 載入圖片工具
 * @param {string} url - 圖片 URL
 * @returns {Promise<HTMLImageElement|null>}
 */
const loadImage = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error('載入圖片失敗:', url);
      resolve(null);
    };
    img.src = url;
  });

/**
 * 生成 2D 商品快照（增強版，支持背景圖映射）
 * @param {Object} product - 商品資料
 * @param {Array} designElements - 設計元素
 * @param {string} backgroundColor - 背景顏色
 * @param {number} width - 快照寬度
 * @param {number} height - 快照高度
 * @param {Object} options - 【新增】選項
 *   - useProductBackground: boolean (默認 false，使用背景圖映射)
 *   - bleedAreaMapping: Object (映射配置)
 * @returns {Promise<string|null>} - 返回 base64 圖片字串
 */
export const generate2DSnapshot = async (
  product,
  designElements,
  backgroundColor,
  width = 400,
  height = 400,
  options = {}
) => {
  if (!product || product.type === '3D') {
    console.warn('無法生成 2D 快照：商品不是 2D 類型');
    return null;
  }

  try {
    // 創建 Canvas（保持正方形，與 ProductPreview 一致）
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('無法創建 Canvas 2D context');
      return null;
    }

    // 1. 繪製商品背景圖（保持比例，object-contain）
    // 【修改】支持使用背景圖映射
    const useProductBackground = options.useProductBackground && product.productBackgroundImage;
    const backgroundImage = useProductBackground
      ? product.productBackgroundImage?.url
      : (product.mockupImage || product.image);

    if (backgroundImage) {
      const bgImg = await loadImage(backgroundImage);
      if (bgImg) {
        // 計算保持比例的尺寸（類似 CSS object-contain）
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = width / height;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgRatio > canvasRatio) {
          // 圖片較寬，以寬度為準
          drawWidth = width;
          drawHeight = width / imgRatio;
          drawX = 0;
          drawY = (height - drawHeight) / 2;
        } else {
          // 圖片較高，以高度為準
          drawHeight = height;
          drawWidth = height * imgRatio;
          drawX = (width - drawWidth) / 2;
          drawY = 0;
        }

        // 先填充白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 繪製商品圖片
        ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
      } else {
        console.warn('商品背景圖載入失敗');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // 沒有背景圖，使用白色
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // 檢查是否需要套用映射變換
    const shouldApplyMapping = useProductBackground &&
                              product.bleedAreaMapping?.enabled;

    if (shouldApplyMapping) {
      console.log('🔄 snapshot2D: 套用背景圖映射變換');
      // 套用映射變換到 Canvas
      const transform = getBleedMappingTransform(product, product.bleedAreaMapping, width);

      if (transform) {
        ctx.save();
        // 使用 transform 矩陣進行變換
        // 順序：translate, scale
        ctx.translate(width / 2, height / 2); // 移動到中心
        ctx.scale(transform.scaleX, transform.scaleY); // 縮放
        ctx.translate(transform.translateX - width / 2, transform.translateY - height / 2); // 平移回去並套用偏移
      }
    }

    // 2. 繪製設計區域背景色
    if (backgroundColor && product.printArea) {
      const { x, y, width: pWidth, height: pHeight } = product.printArea;

      // 計算縮放比例（基於 400px 的設計稿）
      const scale = width / 400;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        x * scale,
        y * scale,
        pWidth * scale,
        pHeight * scale
      );
    }

    // 3. 設定裁切區域（超出設計區的元素會被隱藏）
    if (product.printArea) {
      const { x, y, width: pWidth, height: pHeight } = product.printArea;
      const scale = width / 400;

      ctx.save();
      // 建立裁切路徑
      ctx.beginPath();
      ctx.rect(
        x * scale,
        y * scale,
        pWidth * scale,
        pHeight * scale
      );
      ctx.clip();
    }

    // 4. 繪製設計元素（在裁切區域內）
    if (designElements && designElements.length > 0 && product.printArea) {
      // 依 zIndex 排序
      const sortedElements = [...designElements].sort(
        (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
      );

      const scale = width / 400;
      const { x: printX, y: printY, width: printWidth, height: printHeight } = product.printArea;

      for (const element of sortedElements) {
        if (!element) continue;

        // 計算元素相對於設計區的位置
        const relativeX = element.x - printX;
        const relativeY = element.y - printY;

        // 轉換為 Canvas 上的實際位置
        const canvasX = (printX + relativeX) * scale;
        const canvasY = (printY + relativeY) * scale;

        ctx.save();

        if (element.type === 'text') {
          // 繪製文字元素
          ctx.fillStyle = element.color || '#000000';
          ctx.font = `${element.fontWeight || 'normal'} ${element.fontStyle || 'normal'} ${
            (element.fontSize || 16) * scale
          }px ${element.fontFamily || 'Arial'}`;
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';

          // 應用旋轉
          if (element.rotation && element.rotation !== 0) {
            ctx.translate(canvasX, canvasY);
            ctx.rotate((element.rotation * Math.PI) / 180);
            ctx.fillText(element.content || '', 0, 0);
          } else {
            ctx.fillText(element.content || '', canvasX, canvasY);
          }
        } else if (element.type === 'image') {
          // 繪製圖片元素
          let img = element.imageElement;
          if (!img && element.url) {
            img = await loadImage(element.url);
          }

          if (img) {
            // 計算實際渲染尺寸（考慮自由變形 scaleX/scaleY）
            const baseWidth = (element.width || 100) * scale;
            const baseHeight = (element.height || 100) * scale;
            const imgWidth = baseWidth * (element.scaleX || 1);
            const imgHeight = baseHeight * (element.scaleY || 1);

            // 應用透明度
            ctx.globalAlpha = element.opacity !== undefined ? element.opacity : 1;

            // 應用旋轉
            if (element.rotation && element.rotation !== 0) {
              ctx.translate(canvasX, canvasY);
              ctx.rotate((element.rotation * Math.PI) / 180);

              // 檢查是否有蒙版數據
              if (element.hasMask && element.mask) {
                // 繪製蒙版後的圖片
                const mask = element.mask;

                // 計算蒙版在圖片中的位置（相對於圖片左上角）
                const maskLeft = mask.x - mask.width / 2;
                const maskTop = mask.y - mask.height / 2;
                const maskRight = mask.x + mask.width / 2;
                const maskBottom = mask.y + mask.height / 2;

                // 轉換為百分比
                const topPercent = maskTop / element.height;
                const rightPercent = 1 - maskRight / element.width;
                const bottomPercent = 1 - maskBottom / element.height;
                const leftPercent = maskLeft / element.width;

                // 計算實際剪裁區域（像素）
                const clipTop = topPercent * imgHeight;
                const clipRight = rightPercent * imgWidth;
                const clipBottom = bottomPercent * imgHeight;
                const clipLeft = leftPercent * imgWidth;

                // 應用剪裁
                ctx.save();
                ctx.beginPath();
                ctx.rect(
                  -imgWidth / 2 + clipLeft,
                  -imgHeight / 2 + clipTop,
                  imgWidth - clipLeft - clipRight,
                  imgHeight - clipTop - clipBottom
                );
                ctx.clip();
                ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
                ctx.restore();
              } else {
                // 無蒙版，直接繪製
                ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
              }
            } else {
              // 檢查是否有蒙版數據
              if (element.hasMask && element.mask) {
                // 繪製蒙版後的圖片
                const mask = element.mask;

                // 計算蒙版在圖片中的位置（相對於圖片左上角）
                const maskLeft = mask.x - mask.width / 2;
                const maskTop = mask.y - mask.height / 2;
                const maskRight = mask.x + mask.width / 2;
                const maskBottom = mask.y + mask.height / 2;

                // 轉換為百分比
                const topPercent = maskTop / element.height;
                const rightPercent = 1 - maskRight / element.width;
                const bottomPercent = 1 - maskBottom / element.height;
                const leftPercent = maskLeft / element.width;

                // 計算實際剪裁區域（像素）
                const clipTop = topPercent * imgHeight;
                const clipRight = rightPercent * imgWidth;
                const clipBottom = bottomPercent * imgHeight;
                const clipLeft = leftPercent * imgWidth;

                // 應用剪裁
                ctx.save();
                ctx.beginPath();
                ctx.rect(
                  canvasX - imgWidth / 2 + clipLeft,
                  canvasY - imgHeight / 2 + clipTop,
                  imgWidth - clipLeft - clipRight,
                  imgHeight - clipTop - clipBottom
                );
                ctx.clip();
                ctx.drawImage(
                  img,
                  canvasX - imgWidth / 2,
                  canvasY - imgHeight / 2,
                  imgWidth,
                  imgHeight
                );
                ctx.restore();
              } else {
                // 無蒙版，直接繪製
                ctx.drawImage(
                  img,
                  canvasX - imgWidth / 2,
                  canvasY - imgHeight / 2,
                  imgWidth,
                  imgHeight
                );
              }
            }

            ctx.globalAlpha = 1; // 重置透明度
          } else {
            console.warn('圖片元素載入失敗:', element.url);
          }
        }

        ctx.restore();
      }
    }

    // 恢復裁切（如果有設定）
    if (product.printArea) {
      ctx.restore();
    }

    // 恢復映射變換（如果有套用）
    if (shouldApplyMapping) {
      ctx.restore();
      console.log('✅ snapshot2D: 已恢復映射變換');
    }

    // 5. 轉換為 base64
    const snapshot = canvas.toDataURL('image/jpeg', 0.85);

    console.log('✅ 2D 快照生成成功');
    return snapshot;
  } catch (error) {
    console.error('生成 2D 快照失敗:', error);
    return null;
  }
};
