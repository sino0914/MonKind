import { CANVAS_SIZE, SCALE_FACTOR } from '../constants/editorConfig';
import { loadImage } from './imageUtils';

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
export const exportDesignToImage = async (productInfo, designElements, backgroundColor) => {
  const { printArea, type: productType, title } = productInfo;

  if (!printArea) {
    throw new Error("無法輸出：商品未設定設計區域");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const { width: printWidth, height: printHeight } = printArea;

  // 2D 和 3D 商品都輸出設計區域大小（不再輸出正方形）
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
    設計區域: `${printWidth}×${printHeight}`,
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

    const elementX = element.x - printArea.x;
    const elementY = element.y - printArea.y;
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
        const imgWidth = element.width || 100;
        const imgHeight = element.height || 100;

        ctx.save();

        if (element.rotation && element.rotation !== 0) {
          ctx.translate(finalX, finalY);
          ctx.rotate((element.rotation * Math.PI) / 180);
          ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        } else {
          const centerX = finalX - imgWidth / 2;
          const centerY = finalY - imgHeight / 2;
          ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);
        }

        ctx.restore();
        console.log("✅ 輸出圖片元素:", element.url, `位置: ${finalX}, ${finalY}`, `旋轉: ${element.rotation || 0}度`);
      } else {
        console.warn("❌ 圖片載入失敗:", element.url);
      }
    }
  }

  console.log("所有元素渲染完成，開始輸出圖片...");

  // 轉換為 Blob 並下載
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${title}_設計區域_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`;
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
export const generatePrintFile = async (productInfo, designElements, backgroundColor, scaleFactor = 8) => {
  const { printArea, type: productType } = productInfo;

  if (!printArea) {
    throw new Error("無法生成列印檔案：商品未設定設計區域");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const { width: printWidth, height: printHeight } = printArea;

  // 2D 和 3D 商品都輸出設計區域大小（不再輸出正方形）
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
    設計區域: `${printWidth}×${printHeight}`,
    縮放倍數: scaleFactor,
    輸出尺寸: `${canvas.width}×${canvas.height}`,
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

    const elementX = element.x - printArea.x;
    const elementY = element.y - printArea.y;
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
        const imgWidth = element.width || 100;
        const imgHeight = element.height || 100;

        ctx.save();

        if (element.rotation && element.rotation !== 0) {
          ctx.translate(finalX, finalY);
          ctx.rotate((element.rotation * Math.PI) / 180);
          ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        } else {
          const centerX = finalX - imgWidth / 2;
          const centerY = finalY - imgHeight / 2;
          ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);
        }

        ctx.restore();
      }
    }
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
