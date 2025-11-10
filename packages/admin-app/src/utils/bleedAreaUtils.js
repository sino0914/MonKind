/**
 * 出血區域工具函數
 * 提供出血區域計算、驗證和輔助功能
 */

/**
 * 計算出血區域的邊界
 * @param {Object} printArea - 設計區域 {x, y, width, height}
 * @param {Object} bleedArea - 出血區域設定
 * @returns {Object} 出血區域邊界 {x, y, width, height}
 */
export function calculateBleedBounds(printArea, bleedArea) {
  if (!printArea) {
    console.warn('printArea 未定義，返回預設值');
    return { x: 0, y: 0, width: 400, height: 400 };
  }

  if (!bleedArea) {
    // 沒有出血區域設定，返回設計區域
    return { ...printArea };
  }

  const mode = bleedArea.mode || 'uniform';

  // 獲取各方向的出血值
  const getValue = (direction) => {
    if (mode === 'uniform') {
      return bleedArea.value || 0;
    } else {
      return bleedArea[direction] || 0;
    }
  };

  const top = getValue('top');
  const right = getValue('right');
  const bottom = getValue('bottom');
  const left = getValue('left');

  return {
    x: printArea.x - left,
    y: printArea.y - top,
    width: printArea.width + left + right,
    height: printArea.height + top + bottom
  };
}

/**
 * 獲取各方向的出血值
 * @param {Object} bleedArea - 出血區域設定
 * @returns {Object} {top, right, bottom, left}
 */
export function getBleedValues(bleedArea) {
  if (!bleedArea) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const mode = bleedArea.mode || 'uniform';

  if (mode === 'uniform') {
    const value = bleedArea.value || 0;
    return {
      top: value,
      right: value,
      bottom: value,
      left: value
    };
  } else {
    return {
      top: bleedArea.top || 0,
      right: bleedArea.right || 0,
      bottom: bleedArea.bottom || 0,
      left: bleedArea.left || 0
    };
  }
}

/**
 * 驗證出血區域設定是否有效
 * @param {Object} bleedArea - 出血區域設定
 * @param {Object} printArea - 設計區域
 * @param {number} canvasSize - 畫布尺寸（預設 400）
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateBleedArea(bleedArea, printArea, canvasSize = 400) {
  const errors = [];

  if (!bleedArea) {
    return { valid: true, errors: [] };
  }

  const values = getBleedValues(bleedArea);

  // 檢查所有值是否 >= 0
  Object.entries(values).forEach(([direction, value]) => {
    if (value < 0) {
      errors.push(`${direction} 方向的出血值不能為負數`);
    }
  });

  // 檢查出血區域是否超出畫布邊界
  if (printArea) {
    const bounds = calculateBleedBounds(printArea, bleedArea);

    if (bounds.x < 0) {
      errors.push(`左側出血區域超出畫布邊界（超出 ${Math.abs(bounds.x)}px）`);
    }
    if (bounds.y < 0) {
      errors.push(`上側出血區域超出畫布邊界（超出 ${Math.abs(bounds.y)}px）`);
    }
    if (bounds.x + bounds.width > canvasSize) {
      errors.push(`右側出血區域超出畫布邊界（超出 ${bounds.x + bounds.width - canvasSize}px）`);
    }
    if (bounds.y + bounds.height > canvasSize) {
      errors.push(`下側出血區域超出畫布邊界（超出 ${bounds.y + bounds.height - canvasSize}px）`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 建立預設的出血區域設定
 * @param {string} mode - 'uniform' 或 'separate'
 * @param {number} defaultValue - 預設值（預設 3）
 * @returns {Object} 出血區域設定
 */
export function createDefaultBleedArea(mode = 'uniform', defaultValue = 3) {
  if (mode === 'uniform') {
    return {
      mode: 'uniform',
      value: defaultValue
    };
  } else {
    return {
      mode: 'separate',
      top: defaultValue,
      right: defaultValue,
      bottom: defaultValue,
      left: defaultValue
    };
  }
}

/**
 * 轉換元素座標：從畫布座標轉換為出血區域相對座標
 * @param {Object} element - 元素 {x, y, ...}
 * @param {Object} bleedBounds - 出血區域邊界
 * @returns {Object} 轉換後的座標 {x, y}
 */
export function canvasToBleedCoords(element, bleedBounds) {
  return {
    x: element.x - bleedBounds.x,
    y: element.y - bleedBounds.y
  };
}

/**
 * 繪製裁切線標記
 * @param {CanvasRenderingContext2D} ctx - Canvas 繪圖上下文
 * @param {Object} printArea - 設計區域
 * @param {Object} bleedBounds - 出血區域邊界
 * @param {number} scale - 縮放比例
 * @param {Object} options - 選項 {lineWidth, dashPattern, color}
 */
export function drawCropMarks(ctx, printArea, bleedBounds, scale = 1, options = {}) {
  const {
    lineWidth = 1,
    dashPattern = [5, 5],
    color = 'black'
  } = options;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * scale;
  ctx.setLineDash(dashPattern.map(v => v * scale));

  // 計算設計區域在出血區域中的位置
  const x = (printArea.x - bleedBounds.x) * scale;
  const y = (printArea.y - bleedBounds.y) * scale;
  const w = printArea.width * scale;
  const h = printArea.height * scale;

  // 繪製設計區域邊界（裁切線）
  ctx.strokeRect(x, y, w, h);

  ctx.restore();
}

/**
 * 檢查點是否在出血區域內
 * @param {number} x - X 座標
 * @param {number} y - Y 座標
 * @param {Object} bleedBounds - 出血區域邊界
 * @returns {boolean}
 */
export function isPointInBleedArea(x, y, bleedBounds) {
  return (
    x >= bleedBounds.x &&
    x <= bleedBounds.x + bleedBounds.width &&
    y >= bleedBounds.y &&
    y <= bleedBounds.y + bleedBounds.height
  );
}

/**
 * 檢查矩形是否完全在出血區域內
 * @param {Object} rect - 矩形 {x, y, width, height}
 * @param {Object} bleedBounds - 出血區域邊界
 * @returns {boolean}
 */
export function isRectInBleedArea(rect, bleedBounds) {
  return (
    rect.x >= bleedBounds.x &&
    rect.y >= bleedBounds.y &&
    rect.x + rect.width <= bleedBounds.x + bleedBounds.width &&
    rect.y + rect.height <= bleedBounds.y + bleedBounds.height
  );
}
