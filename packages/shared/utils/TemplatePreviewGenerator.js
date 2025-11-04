/**
 * 版型預覽圖生成器
 * 用於生成版型的預覽圖片，可在多處使用
 */

class TemplatePreviewGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * 初始化 Canvas
   * @param {number} width - Canvas 寬度
   * @param {number} height - Canvas 高度
   */
  initCanvas(width = 400, height = 400) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    return this.canvas;
  }

  /**
   * 生成版型預覽圖
   * @param {Object} template - 版型資料
   * @param {Object} product - 商品資料
   * @param {number} width - 預覽圖寬度
   * @param {number} height - 預覽圖高度
   * @returns {Promise<string>} - 返回 base64 圖片資料
   */
  async generatePreview(template, product, width = 300, height = 300) {
    try {
      this.initCanvas(width, height);

      // 清空畫布設置為白色
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(0, 0, width, height);

      // 總是先繪製商品底圖（如果有的話）
      if (product?.mockupImage) {
        await this.drawProductMockup(product.mockupImage, width, height);
      }

      // 然後在設計區域繪製背景色（與編輯器設計區域保持一致）
      if (template.backgroundColor && product?.printArea) {
        await this.drawDesignAreaBackground(template.backgroundColor, product.printArea, width, height);
      }

      // 編輯器使用 400x400 邏輯座標系統，實際顯示 320x320
      // 計算縮放比例：從邏輯座標轉換到實際顯示座標
      const logicalSize = 400; // 編輯器邏輯尺寸
      const displaySize = 320;  // 編輯器實際顯示尺寸
      const editorScale = displaySize / logicalSize; // 0.8

      // 預覽圖的縮放比例
      const previewScaleX = width / displaySize;   // 預覽圖寬度 / 編輯器顯示寬度
      const previewScaleY = height / displaySize;  // 預覽圖高度 / 編輯器顯示高度

      // 繪製設計元素
      if (template.elements && template.elements.length > 0) {
        for (const element of template.elements) {
          await this.drawElement(element, previewScaleX, previewScaleY, product?.printArea, width, height, editorScale);
        }
      }

      // 返回 base64 圖片資料
      return this.canvas.toDataURL('image/png');
    } catch (error) {
      console.error('生成預覽圖失敗:', error);
      return null;
    }
  }

  /**
   * 繪製商品底圖
   * @param {string} mockupImageUrl - 底圖 URL
   * @param {number} width - Canvas 寬度
   * @param {number} height - Canvas 高度
   */
  async drawProductMockup(mockupImageUrl, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // 計算圖片的適當尺寸，模擬 CSS object-contain 效果
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = width / height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgAspectRatio > canvasAspectRatio) {
          // 圖片較寬，以寬度為基準
          drawWidth = width;
          drawHeight = width / imgAspectRatio;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        } else {
          // 圖片較高，以高度為基準
          drawWidth = height * imgAspectRatio;
          drawHeight = height;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
        }

        // 繪製圖片，保持比例並居中
        this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        resolve();
      };
      img.onerror = () => {
        console.warn('無法載入商品底圖:', mockupImageUrl);
        resolve(); // 即使失敗也繼續執行
      };
      img.src = mockupImageUrl;
    });
  }

  /**
   * 繪製設計區域背景色
   * @param {string} backgroundColor - 背景顏色
   * @param {Object} printArea - 設計區域
   * @param {number} canvasWidth - Canvas 寬度
   * @param {number} canvasHeight - Canvas 高度
   */
  async drawDesignAreaBackground(backgroundColor, printArea, canvasWidth, canvasHeight) {
    // 編輯器使用 320x320 顯示尺寸
    const displaySize = 320;
    const scaleX = canvasWidth / displaySize;
    const scaleY = canvasHeight / displaySize;

    // 計算設計區域在預覽圖中的位置和大小
    const x = printArea.x * scaleX;
    const y = printArea.y * scaleY;
    const width = printArea.width * scaleX;
    const height = printArea.height * scaleY;

    // 繪製設計區域背景色
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(x, y, width, height);
  }

  /**
   * 繪製設計元素
   * @param {Object} element - 設計元素
   * @param {number} scaleX - X軸縮放比例
   * @param {number} scaleY - Y軸縮放比例
   * @param {Object} printArea - 設計區域
   * @param {number} canvasWidth - Canvas 寬度
   * @param {number} canvasHeight - Canvas 高度
   * @param {number} editorScale - 編輯器內部縮放比例
   */
  async drawElement(element, scaleX, scaleY, printArea, canvasWidth, canvasHeight, editorScale = 0.8) {
    if (element.type === 'text') {
      await this.drawTextElement(element, scaleX, scaleY, printArea, canvasWidth, canvasHeight, editorScale);
    } else if (element.type === 'image') {
      await this.drawImageElement(element, scaleX, scaleY, printArea, canvasWidth, canvasHeight, editorScale);
    }
  }

  /**
   * 繪製文字元素
   */
  async drawTextElement(element, scaleX, scaleY, printArea, canvasWidth, canvasHeight, editorScale = 0.8) {
    // 文字元素的座標系統：直接使用編輯器的實際顯示座標 (320x320)
    // 從編輯器顯示座標直接轉換到預覽圖座標
    const displayX = element.x || 0;
    const displayY = element.y || 0;

    // 轉換到預覽圖座標
    const x = displayX * scaleX;
    const y = displayY * scaleY;

    // 計算字體大小：直接使用編輯器的字體大小，再縮放到預覽圖
    const editorFontSize = element.fontSize || 16;
    const previewFontSize = editorFontSize * Math.min(scaleX, scaleY);

    // 設置文字樣式
    this.ctx.font = `${element.fontWeight || 'normal'} ${element.fontStyle || 'normal'} ${previewFontSize}px ${element.fontFamily || 'Arial'}`;
    this.ctx.fillStyle = element.color || '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // 繪製文字
    this.ctx.fillText(element.content || '', x, y);
  }

  /**
   * 繪製圖片元素
   */
  async drawImageElement(element, scaleX, scaleY, printArea, canvasWidth, canvasHeight, editorScale = 0.8) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // 圖片元素的座標系統：直接使用編輯器的實際顯示座標 (320x320)
        // 從編輯器顯示座標直接轉換到預覽圖座標
        const displayX = element.x || 0;
        const displayY = element.y || 0;
        const displayWidth = element.width || 50;
        const displayHeight = element.height || 50;

        // 考慮元素的自由變形 (scaleX/scaleY)
        const elementScaleX = element.scaleX || 1;
        const elementScaleY = element.scaleY || 1;

        // 轉換到預覽圖座標（同時應用預覽縮放和元素自由變形）
        const previewX = displayX * scaleX;
        const previewY = displayY * scaleY;
        const previewWidth = displayWidth * scaleX * elementScaleX;
        const previewHeight = displayHeight * scaleY * elementScaleY;

        // 計算最終位置（中心對齊）
        const x = previewX - previewWidth / 2;
        const y = previewY - previewHeight / 2;

        // 儲存當前狀態
        this.ctx.save();

        // 設置透明度
        if (element.opacity && element.opacity !== 1) {
          this.ctx.globalAlpha = element.opacity;
        }

        // 應用旋轉
        if (element.rotation) {
          this.ctx.translate(previewX, previewY);
          this.ctx.rotate((element.rotation * Math.PI) / 180);
          this.ctx.translate(-previewWidth / 2, -previewHeight / 2);
          this.ctx.drawImage(img, 0, 0, previewWidth, previewHeight);
        } else {
          this.ctx.drawImage(img, x, y, previewWidth, previewHeight);
        }

        // 恢復狀態
        this.ctx.restore();
        resolve();
      };
      img.onerror = () => {
        console.warn('無法載入圖片元素:', element.url);
        resolve(); // 即使失敗也繼續執行
      };
      img.src = element.url;
    });
  }

  /**
   * 生成縮略圖（較小尺寸的預覽圖）
   * @param {Object} template - 版型資料
   * @param {Object} product - 商品資料
   * @returns {Promise<string>} - 返回 base64 圖片資料
   */
  async generateThumbnail(template, product) {
    return this.generatePreview(template, product, 200, 150);
  }

  /**
   * 清理資源
   */
  dispose() {
    this.canvas = null;
    this.ctx = null;
  }
}

// 創建單例實例
const templatePreviewGenerator = new TemplatePreviewGenerator();

export default templatePreviewGenerator;

// 便捷方法導出
export const generateTemplatePreview = (template, product, width, height) => {
  return templatePreviewGenerator.generatePreview(template, product, width, height);
};

export const generateTemplateThumbnail = (template, product) => {
  return templatePreviewGenerator.generateThumbnail(template, product);
};