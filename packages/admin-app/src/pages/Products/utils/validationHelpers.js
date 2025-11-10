/**
 * 驗證商品標題
 */
export const validateProductTitle = (title) => {
  if (!title || title.trim() === '') {
    return { valid: false, message: '請輸入商品標題' };
  }
  if (title.length > 100) {
    return { valid: false, message: '商品標題不能超過100個字元' };
  }
  return { valid: true };
};

/**
 * 驗證商品價格
 */
export const validateProductPrice = (price) => {
  const numPrice = Number(price);
  if (isNaN(numPrice)) {
    return { valid: false, message: '價格必須是數字' };
  }
  if (numPrice < 0) {
    return { valid: false, message: '價格不能為負數' };
  }
  if (numPrice > 1000000) {
    return { valid: false, message: '價格不能超過1,000,000' };
  }
  return { valid: true };
};

/**
 * 驗證設計區域
 */
export const validatePrintArea = (printArea) => {
  if (!printArea) {
    return { valid: false, message: '請設定設計區域' };
  }

  const { x, y, width, height } = printArea;

  if (width <= 0 || height <= 0) {
    return { valid: false, message: '設計區域寬度和高度必須大於0' };
  }

  if (x < 0 || y < 0) {
    return { valid: false, message: '設計區域位置不能為負數' };
  }

  if (x + width > 400 || y + height > 400) {
    return { valid: false, message: '設計區域超出畫布範圍(400x400)' };
  }

  return { valid: true };
};

/**
 * 驗證出血區域
 */
export const validateBleedArea = (bleedArea, printArea) => {
  if (!bleedArea) {
    return { valid: true }; // 出血區域是可選的
  }

  const mode = bleedArea.mode || 'uniform';

  if (mode === 'uniform') {
    const value = bleedArea.value || 0;
    if (value < 0) {
      return { valid: false, message: '出血區域數值不能為負數' };
    }
    if (value > 50) {
      return { valid: false, message: '出血區域數值不能超過50px' };
    }
  } else if (mode === 'separate') {
    const sides = ['top', 'right', 'bottom', 'left'];
    for (const side of sides) {
      const value = bleedArea[side] || 0;
      if (value < 0) {
        return { valid: false, message: `出血區域${side}不能為負數` };
      }
      if (value > 50) {
        return { valid: false, message: `出血區域${side}不能超過50px` };
      }
    }
  }

  // 驗證出血區域不會超出畫布
  if (printArea) {
    const getValue = (direction) => {
      return mode === 'uniform' ? (bleedArea.value || 0) : (bleedArea[direction] || 0);
    };

    if (printArea.x - getValue('left') < 0) {
      return { valid: false, message: '出血區域超出畫布左邊界' };
    }
    if (printArea.y - getValue('top') < 0) {
      return { valid: false, message: '出血區域超出畫布上邊界' };
    }
    if (printArea.x + printArea.width + getValue('right') > 400) {
      return { valid: false, message: '出血區域超出畫布右邊界' };
    }
    if (printArea.y + printArea.height + getValue('bottom') > 400) {
      return { valid: false, message: '出血區域超出畫布下邊界' };
    }
  }

  return { valid: true };
};

/**
 * 驗證圖片檔案
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, message: '請選擇圖片檔案' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: '只允許上傳 JPG, PNG, GIF, WEBP 格式的圖片' };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, message: '圖片檔案大小不能超過10MB' };
  }

  return { valid: true };
};

/**
 * 驗證GLB檔案
 */
export const validateGLBFile = (file) => {
  if (!file) {
    return { valid: false, message: '請選擇GLB檔案' };
  }

  if (!file.name.toLowerCase().endsWith('.glb')) {
    return { valid: false, message: '只允許上傳 .glb 格式的3D模型檔案' };
  }

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, message: 'GLB檔案大小不能超過50MB' };
  }

  return { valid: true };
};

/**
 * 格式化價格顯示
 */
export const formatPrice = (price) => {
  return `NT$ ${Number(price).toLocaleString()}`;
};

/**
 * 格式化座標顯示
 */
export const formatCoordinate = (value, decimals = 0) => {
  return Number(value).toFixed(decimals);
};

/**
 * 計算百分比座標 (邏輯座標 → 百分比)
 */
export const toPercentage = (value, canvasSize = 400) => {
  return (value / canvasSize) * 100;
};

/**
 * 計算邏輯座標 (百分比 → 邏輯座標)
 */
export const fromPercentage = (percentage, canvasSize = 400) => {
  return (percentage / 100) * canvasSize;
};
