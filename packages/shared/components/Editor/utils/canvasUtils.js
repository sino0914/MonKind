import { CANVAS_SIZE, SCALE_FACTOR } from '../constants/editorConfig';
import { loadImage } from './imageUtils';
import { calculateBleedBounds, drawCropMarks } from '../../../utils/bleedAreaUtils';

// 計算設計區域中心點
export const calculateCenter = (printArea) => {
  if (!printArea) {
    return { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
  }
  return {
    x: printArea.x + printArea.width / 2,
    y: printArea.y + printArea.height / 2,
  };
};

// 計算遮罩中心點（考慮元素旋轉）
export const calculateMaskCenter = (element) => {
  // 如果沒有遮罩，返回元素中心
  if (!element.hasMask || !element.mask) {
    return { x: element.x, y: element.y };
  }

  // 將旋轉角度轉換為弧度
  const rotation = (element.rotation || 0) * Math.PI / 180;

  // 計算遮罩中心相對於元素中心的偏移量
  const maskOffsetX = element.mask.x - element.width / 2;
  const maskOffsetY = element.mask.y - element.height / 2;

  // 應用旋轉矩陣計算旋轉後的偏移量
  const rotatedOffsetX = maskOffsetX * Math.cos(rotation) - maskOffsetY * Math.sin(rotation);
  const rotatedOffsetY = maskOffsetX * Math.sin(rotation) + maskOffsetY * Math.cos(rotation);

  // 返回遮罩中心的絕對座標
  return {
    x: element.x + rotatedOffsetX,
    y: element.y + rotatedOffsetY
  };
};

// 測量文字尺寸
export const measureTextWidth = (text, fontSize, fontFamily, fontWeight = "normal", fontStyle = "normal") => {
  if (!text || text.length === 0) {
    return 20;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  const width = context.measureText(text).width;

  return Math.max(20, Math.ceil(width) + 16);
};

// 輸出設計區域為圖片
export const exportDesignToImage = async (productInfo, designElements, backgroundColor, options = {}) => {
  const {
    useBleedArea = false,  // 是否使用出血區域
    showCropMarks = false  // 是否顯示裁切線
  } = options;

  const { printArea, bleedArea, type: productType, title } = productInfo;

  if (!printArea) {
    throw new Error("無法輸出：商品未設定設計區域");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // 決定輸出範圍：出血區域或設計區域
  let outputBounds;
  if (useBleedArea && bleedArea) {
    outputBounds = calculateBleedBounds(printArea, bleedArea);
  } else {
    outputBounds = printArea;
  }

  const { width: printWidth, height: printHeight } = outputBounds;

  // 2D 和 3D 商品都輸出指定區域大小
  const canvasWidth = printWidth;
  const canvasHeight = printHeight;

  // 設定高解析度
  canvas.width = canvasWidth * SCALE_FACTOR;
  canvas.height = canvasHeight * SCALE_FACTOR;
  ctx.scale(SCALE_FACTOR, SCALE_FACTOR);

  // 設定背景
  if (backgroundColor && backgroundColor !== "#ffffff") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  console.log("開始輸出設計區域:", {
    輸出範圍: useBleedArea && bleedArea ? "出血區域" : "設計區域",
    輸出尺寸: `${printWidth}×${printHeight}`,
    顯示裁切線: showCropMarks,
    元素數量: designElements.length,
    背景色: backgroundColor,
  });

  // 確保元素依照順序繪製
  const sortedElements = [...designElements].sort((a, b) => {
    const zA = a.zIndex ?? 0;
    const zB = b.zIndex ?? 0;
    return zA - zB;
  });

  // 順序繪製元素
  for (const element of sortedElements) {
    if (!element) continue;

    // 元素座標相對於輸出邊界（出血區域或設計區域）
    const elementX = element.x - outputBounds.x;
    const elementY = element.y - outputBounds.y;
    const finalX = elementX;
    const finalY = elementY;

    if (element.type === "text") {
      ctx.save();
      ctx.fillStyle = element.color || "#000000";
      ctx.font = `${element.fontWeight || "normal"} ${element.fontStyle || "normal"} ${element.fontSize || 16}px ${element.fontFamily || "Arial"}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      if (element.rotation && element.rotation !== 0) {
        ctx.translate(finalX, finalY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.fillText(element.content || "", 0, 0);
      } else {
        ctx.fillText(element.content || "", finalX, finalY);
      }

      ctx.restore();
      console.log("✅ 輸出文字元素:", element.content, `位置: ${finalX}, ${finalY}`, `旋轉: ${element.rotation || 0}度`);
    }

    if (element.type === "image") {
      let img = element.imageElement;
      if (!img && element.url) {
        img = await loadImage(element.url);
      }
      if (img) {
        // 計算實際渲染尺寸（考慮自由變形 scaleX/scaleY）
        const baseWidth = element.width || 100;
        const baseHeight = element.height || 100;
        const imgWidth = baseWidth * (element.scaleX || 1);
        const imgHeight = baseHeight * (element.scaleY || 1);

        ctx.save();

        if (element.rotation && element.rotation !== 0) {
          ctx.translate(finalX, finalY);
          ctx.rotate((element.rotation * Math.PI) / 180);

          // 檢查是否有蒙版數據
          if (element.hasMask && element.mask) {
            const mask = element.mask;
            const maskLeft = mask.x - mask.width / 2;
            const maskTop = mask.y - mask.height / 2;
            const maskRight = mask.x + mask.width / 2;
            const maskBottom = mask.y + mask.height / 2;

            const topPercent = maskTop / element.height;
            const rightPercent = 1 - maskRight / element.width;
            const bottomPercent = 1 - maskBottom / element.height;
            const leftPercent = maskLeft / element.width;

            const clipTop = topPercent * imgHeight;
            const clipRight = rightPercent * imgWidth;
            const clipBottom = bottomPercent * imgHeight;
            const clipLeft = leftPercent * imgWidth;

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
            ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
          }
        } else {
          // 檢查是否有蒙版數據
          if (element.hasMask && element.mask) {
            const mask = element.mask;
            const maskLeft = mask.x - mask.width / 2;
            const maskTop = mask.y - mask.height / 2;
            const maskRight = mask.x + mask.width / 2;
            const maskBottom = mask.y + mask.height / 2;

            const topPercent = maskTop / element.height;
            const rightPercent = 1 - maskRight / element.width;
            const bottomPercent = 1 - maskBottom / element.height;
            const leftPercent = maskLeft / element.width;

            const clipTop = topPercent * imgHeight;
            const clipRight = rightPercent * imgWidth;
            const clipBottom = bottomPercent * imgHeight;
            const clipLeft = leftPercent * imgWidth;

            const centerX = finalX - imgWidth / 2;
            const centerY = finalY - imgHeight / 2;

            ctx.save();
            ctx.beginPath();
            ctx.rect(
              centerX + clipLeft,
              centerY + clipTop,
              imgWidth - clipLeft - clipRight,
              imgHeight - clipTop - clipBottom
            );
            ctx.clip();
            ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);
            ctx.restore();
          } else {
            const centerX = finalX - imgWidth / 2;
            const centerY = finalY - imgHeight / 2;
            ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);
          }
        }

        ctx.restore();
        console.log("✅ 輸出圖片元素:", element.url, `位置: ${finalX}, ${finalY}`, `旋轉: ${element.rotation || 0}度`);
      } else {
        console.warn("❌ 圖片載入失敗:", element.url);
      }
    }
  }

  console.log("所有元素渲染完成，開始輸出圖片...");

  // 如果需要，繪製裁切線（只在使用出血區域時才有意義）
  if (showCropMarks && useBleedArea && bleedArea) {
    // 注意：ctx 已經被 scale() 過了，所以這裡傳 scale=1
    drawCropMarks(ctx, printArea, outputBounds, 1, {
      lineWidth: 1,
      dashPattern: [5, 5],
      color: 'black'
    });
    console.log("✅ 裁切線已繪製");
  }

  // 轉換為 Blob 並下載
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const areaType = useBleedArea && bleedArea ? "含出血區" : "設計區域";
          a.download = `${title}_${areaType}_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          console.log("✅ 圖片輸出完成");
          resolve();
        } else {
          console.error("❌ Canvas轉換失敗");
          reject(new Error("無法生成圖片"));
        }
      },
      "image/png",
      1.0
    );
  });
};

// 計算輸入框寬度
export const calculateInputWidth = (text, fontSize, fontFamily, fontWeight, fontStyle, maxWidth = 300, minWidth = 60) => {
  const textWidth = measureTextWidth(text, fontSize, fontFamily, fontWeight, fontStyle);
  return Math.max(minWidth, Math.min(textWidth, maxWidth));
};

// 生成高解析度列印檔案（用於廠商列印）
export const generatePrintFile = async (productInfo, designElements, backgroundColor, options = {}) => {
  const {
    scaleFactor = 8,      // 縮放倍數（預設8倍）
    useBleedArea = true,  // 是否使用出血區域（預設true，用於廠商列印）
    showCropMarks = false // 是否顯示裁切線
  } = options;

  const { printArea, bleedArea, type: productType } = productInfo;

  if (!printArea) {
    throw new Error("無法生成列印檔案：商品未設定設計區域");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // 決定輸出範圍：出血區域或設計區域
  let outputBounds;
  if (useBleedArea && bleedArea) {
    outputBounds = calculateBleedBounds(printArea, bleedArea);
  } else {
    outputBounds = printArea;
  }

  const { width: printWidth, height: printHeight } = outputBounds;

  // 2D 和 3D 商品都輸出指定區域大小
  const canvasWidth = printWidth;
  const canvasHeight = printHeight;

  // 設定高解析度（列印用）
  canvas.width = canvasWidth * scaleFactor;
  canvas.height = canvasHeight * scaleFactor;
  ctx.scale(scaleFactor, scaleFactor);

  // 設定背景
  if (backgroundColor && backgroundColor !== "#ffffff") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  console.log("開始生成列印檔案:", {
    輸出範圍: useBleedArea && bleedArea ? "出血區域" : "設計區域",
    輸出尺寸: `${printWidth}×${printHeight}`,
    縮放倍數: scaleFactor,
    實際輸出: `${canvas.width}×${canvas.height}`,
    顯示裁切線: showCropMarks,
    元素數量: designElements.length,
  });

  // 確保元素依照順序繪製
  const sortedElements = [...designElements].sort((a, b) => {
    const zA = a.zIndex ?? 0;
    const zB = b.zIndex ?? 0;
    return zA - zB;
  });

  // 順序繪製元素
  for (const element of sortedElements) {
    if (!element) continue;

    // 元素座標相對於輸出邊界（出血區域或設計區域）
    const elementX = element.x - outputBounds.x;
    const elementY = element.y - outputBounds.y;
    const finalX = elementX;
    const finalY = elementY;

    if (element.type === "text") {
      ctx.save();
      ctx.fillStyle = element.color || "#000000";
      ctx.font = `${element.fontWeight || "normal"} ${element.fontStyle || "normal"} ${element.fontSize || 16}px ${element.fontFamily || "Arial"}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      if (element.rotation && element.rotation !== 0) {
        ctx.translate(finalX, finalY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.fillText(element.content || "", 0, 0);
      } else {
        ctx.fillText(element.content || "", finalX, finalY);
      }

      ctx.restore();
    }

    if (element.type === "image") {
      let img = element.imageElement;
      if (!img && element.url) {
        img = await loadImage(element.url);
      }
      if (img) {
        // 計算實際渲染尺寸（考慮自由變形 scaleX/scaleY）
        const baseWidth = element.width || 100;
        const baseHeight = element.height || 100;
        const imgWidth = baseWidth * (element.scaleX || 1);
        const imgHeight = baseHeight * (element.scaleY || 1);

        ctx.save();

        if (element.rotation && element.rotation !== 0) {
          ctx.translate(finalX, finalY);
          ctx.rotate((element.rotation * Math.PI) / 180);

          // 檢查是否有蒙版數據
          if (element.hasMask && element.mask) {
            const mask = element.mask;
            const maskLeft = mask.x - mask.width / 2;
            const maskTop = mask.y - mask.height / 2;
            const maskRight = mask.x + mask.width / 2;
            const maskBottom = mask.y + mask.height / 2;

            const topPercent = maskTop / element.height;
            const rightPercent = 1 - maskRight / element.width;
            const bottomPercent = 1 - maskBottom / element.height;
            const leftPercent = maskLeft / element.width;

            const clipTop = topPercent * imgHeight;
            const clipRight = rightPercent * imgWidth;
            const clipBottom = bottomPercent * imgHeight;
            const clipLeft = leftPercent * imgWidth;

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
            ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
          }
        } else {
          // 檢查是否有蒙版數據
          if (element.hasMask && element.mask) {
            const mask = element.mask;
            const maskLeft = mask.x - mask.width / 2;
            const maskTop = mask.y - mask.height / 2;
            const maskRight = mask.x + mask.width / 2;
            const maskBottom = mask.y + mask.height / 2;

            const topPercent = maskTop / element.height;
            const rightPercent = 1 - maskRight / element.width;
            const bottomPercent = 1 - maskBottom / element.height;
            const leftPercent = maskLeft / element.width;

            const clipTop = topPercent * imgHeight;
            const clipRight = rightPercent * imgWidth;
            const clipBottom = bottomPercent * imgHeight;
            const clipLeft = leftPercent * imgWidth;

            const centerX = finalX - imgWidth / 2;
            const centerY = finalY - imgHeight / 2;

            ctx.save();
            ctx.beginPath();
            ctx.rect(
              centerX + clipLeft,
              centerY + clipTop,
              imgWidth - clipLeft - clipRight,
              imgHeight - clipTop - clipBottom
            );
            ctx.clip();
            ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);
            ctx.restore();
          } else {
            const centerX = finalX - imgWidth / 2;
            const centerY = finalY - imgHeight / 2;
            ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);
          }
        }

        ctx.restore();
      }
    }
  }

  // 如果需要，繪製裁切線（只在使用出血區域時才有意義）
  if (showCropMarks && useBleedArea && bleedArea) {
    // 注意：ctx 已經被 scale() 過了，所以這裡傳 scale=1
    drawCropMarks(ctx, printArea, outputBounds, 1, {
      lineWidth: 1,
      dashPattern: [5, 5],
      color: 'black'
    });
    console.log("✅ 裁切線已繪製");
  }

  console.log("✅ 列印檔案生成完成");

  // 返回 Blob（供上傳使用）
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("無法生成列印檔案"));
        }
      },
      "image/png",
      1.0
    );
  });
};
