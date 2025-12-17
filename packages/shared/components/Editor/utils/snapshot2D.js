/**
 * 2D 快照生成工具
 * 用於生成 2D 商品的設計快照
 * 參考 ProductPreview.jsx 的 2D 渲染方式
 */

/**
 * 判斷是否使用展示圖片
 * @param {Object} product - 商品資料
 * @returns {boolean}
 */
const shouldUseDisplayImage = (product) => {
  if (!product) return false;
  if (product.type === '3D') return false;
  if (!product.displayImage) return false;
  if (!product.displayImageDesignArea) return false;

  const { centerX, centerY, scale } = product.displayImageDesignArea;
  if (typeof centerX !== 'number' || typeof centerY !== 'number' || typeof scale !== 'number') {
    return false;
  }

  return true;
};

/**
 * 計算設計區域邊界（展示圖片模式）
 * @param {Object} printArea - 設計區域資料
 * @param {Object} displayImageDesignArea - 展示圖片設計區域配置
 * @returns {Object|null} - 設計區域邊界 {x, y, width, height}
 */
const getDesignAreaBounds = (printArea, displayImageDesignArea) => {
  if (!printArea || !displayImageDesignArea) return null;

  const { centerX, centerY, scale } = displayImageDesignArea;
  const scaledWidth = printArea.width * scale;
  const scaledHeight = printArea.height * scale;

  return {
    x: centerX - scaledWidth / 2,
    y: centerY - scaledHeight / 2,
    width: scaledWidth,
    height: scaledHeight
  };
};

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
 * 生成 2D 商品快照
 * @param {Object} product - 商品資料
 * @param {Array} designElements - 設計元素
 * @param {string} backgroundColor - 背景顏色
 * @param {number} width - 快照寬度
 * @param {number} height - 快照高度
 * @returns {Promise<string|null>} - 返回 base64 圖片字串
 */
export const generate2DSnapshot = async (
  product,
  designElements,
  backgroundColor,
  width = 400,
  height = 400
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
    const useDisplayImage = shouldUseDisplayImage(product);
    const backgroundImageUrl = useDisplayImage ? product.displayImage : (product.mockupImage || product.image);

    if (backgroundImageUrl) {
      const bgImg = await loadImage(backgroundImageUrl);
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

    // 2. 繪製設計區域背景色
    if (backgroundColor && product.printArea) {
      const scale = width / 400;

      let areaX, areaY, areaWidth, areaHeight;

      if (useDisplayImage) {
        const bounds = getDesignAreaBounds(product.printArea, product.displayImageDesignArea);
        if (bounds) {
          areaX = bounds.x;
          areaY = bounds.y;
          areaWidth = bounds.width;
          areaHeight = bounds.height;
        } else {
          // 回退到 printArea
          const { x, y, width: pWidth, height: pHeight } = product.printArea;
          areaX = x;
          areaY = y;
          areaWidth = pWidth;
          areaHeight = pHeight;
        }
      } else {
        const { x, y, width: pWidth, height: pHeight } = product.printArea;
        areaX = x;
        areaY = y;
        areaWidth = pWidth;
        areaHeight = pHeight;
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        areaX * scale,
        areaY * scale,
        areaWidth * scale,
        areaHeight * scale
      );
    }

    // 3. 設定裁切區域（超出設計區的元素會被隱藏）
    if (product.printArea) {
      const scale = width / 400;

      let clipX, clipY, clipWidth, clipHeight;

      if (useDisplayImage) {
        const bounds = getDesignAreaBounds(product.printArea, product.displayImageDesignArea);
        if (bounds) {
          clipX = bounds.x;
          clipY = bounds.y;
          clipWidth = bounds.width;
          clipHeight = bounds.height;
        } else {
          // 回退到 printArea
          const { x, y, width: pWidth, height: pHeight } = product.printArea;
          clipX = x;
          clipY = y;
          clipWidth = pWidth;
          clipHeight = pHeight;
        }
      } else {
        const { x, y, width: pWidth, height: pHeight } = product.printArea;
        clipX = x;
        clipY = y;
        clipWidth = pWidth;
        clipHeight = pHeight;
      }

      ctx.save();
      // 建立裁切路徑
      ctx.beginPath();
      ctx.rect(
        clipX * scale,
        clipY * scale,
        clipWidth * scale,
        clipHeight * scale
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

      // 計算繪製區域
      let drawAreaX, drawAreaY, drawAreaWidth, drawAreaHeight;
      if (useDisplayImage) {
        const bounds = getDesignAreaBounds(product.printArea, product.displayImageDesignArea);
        if (bounds) {
          drawAreaX = bounds.x;
          drawAreaY = bounds.y;
          drawAreaWidth = bounds.width;
          drawAreaHeight = bounds.height;
        } else {
          // 回退到 printArea
          drawAreaX = printX;
          drawAreaY = printY;
          drawAreaWidth = printWidth;
          drawAreaHeight = printHeight;
        }
      } else {
        drawAreaX = printX;
        drawAreaY = printY;
        drawAreaWidth = printWidth;
        drawAreaHeight = printHeight;
      }

      for (const element of sortedElements) {
        if (!element) continue;

        // 計算元素相對於設計區的位置（百分比）
        const relativeX = element.x - printX;
        const relativeY = element.y - printY;
        const relativePercentX = relativeX / printWidth;
        const relativePercentY = relativeY / printHeight;

        // 轉換為 Canvas 上的實際位置
        const canvasX = (drawAreaX + relativePercentX * drawAreaWidth) * scale;
        const canvasY = (drawAreaY + relativePercentY * drawAreaHeight) * scale;

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

    // 5. 轉換為 base64
    const snapshot = canvas.toDataURL('image/jpeg', 0.85);

    console.log('✅ 2D 快照生成成功');
    return snapshot;
  } catch (error) {
    console.error('生成 2D 快照失敗:', error);
    return null;
  }
};
