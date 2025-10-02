import { IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, IMAGE_QUALITY, IMAGE_SIZE_LIMIT } from '../constants/editorConfig';

// 圖片壓縮函數
export const compressImage = (file, maxWidth = IMAGE_MAX_WIDTH, maxHeight = IMAGE_MAX_HEIGHT, quality = IMAGE_QUALITY) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };

    img.src = URL.createObjectURL(file);
  });
};

// 圖片顏色處理函數
export const processImageColor = (imageUrl, color) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        // 繪製原始圖片
        ctx.drawImage(img, 0, 0);

        // 如果不是白色，則套用顏色濾鏡
        if (color && color !== "#ffffff") {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // 將hex顏色轉換為RGB
          const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
              ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
                }
              : null;
          };

          const targetColor = hexToRgb(color);

          // 確保顏色解析成功
          if (targetColor) {
            // 處理每個像素
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              // 如果是白色或接近白色的像素，替換為目標顏色
              if (r > 200 && g > 200 && b > 200 && a > 0) {
                // 計算灰度值來保持明暗變化
                const brightness = (r + g + b) / 3 / 255;

                data[i] = targetColor.r * brightness; // Red
                data[i + 1] = targetColor.g * brightness; // Green
                data[i + 2] = targetColor.b * brightness; // Blue
              }
            }

            // 將處理後的數據繪製回canvas
            ctx.putImageData(imageData, 0, 0);
          }
        }

        // 轉換為DataURL
        resolve(canvas.toDataURL());
      } catch (error) {
        resolve(imageUrl); // 如果處理失敗，返回原圖
      }
    };

    img.onerror = () => {
      resolve(imageUrl); // 如果載入失敗，返回原圖URL
    };

    img.src = imageUrl;
  });
};

// 載入圖片 Promise
export const loadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

// 判斷是否需要壓縮
export const shouldCompressImage = (file) => {
  return file.size > IMAGE_SIZE_LIMIT;
};

// 讀取圖片為 DataURL
export const readImageAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
