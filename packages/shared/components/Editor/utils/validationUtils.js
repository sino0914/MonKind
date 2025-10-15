// 驗證工具函數

// 驗證商品數據
export const validateProduct = (product) => {
  if (!product) {
    return { valid: false, error: '商品不存在' };
  }

  if (product.isActive === false) {
    return { valid: false, error: '此商品目前無法使用' };
  }

  if (!product.printArea) {
    // 自動補充預設設計區域
    product.printArea = { x: 50, y: 50, width: 200, height: 150 };
    console.warn('商品未設定設計區域，使用預設值');
  }

  return { valid: true, error: null };
};

// 驗證設計區域
export const validatePrintArea = (printArea) => {
  if (!printArea) {
    return { x: 0, y: 0, width: 400, height: 400 };
  }

  const { x = 0, y = 0, width = 400, height = 400 } = printArea;
  return { x, y, width, height };
};

// 清理元素數據
export const sanitizeElement = (element) => {
  const sanitized = { ...element };

  // 確保必要屬性存在
  if (element.type === 'text') {
    sanitized.content = sanitized.content || '新增文字';
    sanitized.fontSize = sanitized.fontSize || 24;
    sanitized.color = sanitized.color || '#000000';
    sanitized.fontFamily = sanitized.fontFamily || 'Arial';
    sanitized.fontWeight = sanitized.fontWeight || 'normal';
    sanitized.fontStyle = sanitized.fontStyle || 'normal';
  }

  if (element.type === 'image') {
    sanitized.width = sanitized.width || 100;
    sanitized.height = sanitized.height || 100;
    sanitized.opacity = sanitized.opacity ?? 1;
  }

  // 確保位置和旋轉屬性
  sanitized.x = sanitized.x || 0;
  sanitized.y = sanitized.y || 0;
  sanitized.rotation = sanitized.rotation || 0;

  return sanitized;
};

// 驗證圖片文件
export const validateImageFile = (file) => {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '請選擇圖片文件' };
  }

  // 檢查文件大小（最大 10MB）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: '圖片文件過大，請選擇小於 10MB 的圖片' };
  }

  return { valid: true, error: null };
};

// 驗證版型數據
export const validateTemplate = (template) => {
  if (!template) {
    return { valid: false, error: '版型不存在' };
  }

  if (!Array.isArray(template.elements)) {
    return { valid: false, error: '版型數據格式錯誤' };
  }

  return { valid: true, error: null };
};

// 檢查元素是否在設計區域內
export const isElementInPrintArea = (element, printArea) => {
  if (!printArea) return true;

  const { x, y } = element;
  const { x: areaX, y: areaY, width, height } = printArea;

  return (
    x >= areaX &&
    x <= areaX + width &&
    y >= areaY &&
    y <= areaY + height
  );
};

// 計算元素邊界
export const getElementBounds = (element) => {
  const bounds = {
    left: element.x,
    top: element.y,
    right: element.x,
    bottom: element.y,
  };

  if (element.type === 'image') {
    bounds.left -= element.width / 2;
    bounds.right += element.width / 2;
    bounds.top -= element.height / 2;
    bounds.bottom += element.height / 2;
  }

  if (element.type === 'text' && element.fontSize) {
    bounds.top -= element.fontSize / 2;
    bounds.bottom += element.fontSize / 2;
  }

  return bounds;
};
