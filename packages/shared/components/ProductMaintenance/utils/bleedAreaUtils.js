/**
 * 出血區域工具函數
 */

/**
 * 計算出血區域邊界
 */
export const calculateBleedBounds = (printArea, bleedArea) => {
  if (!bleedArea) return null;

  const mode = bleedArea.mode || 'uniform';
  let top, right, bottom, left;

  if (mode === 'uniform') {
    const value = bleedArea.value || 0;
    top = right = bottom = left = value;
  } else {
    top = bleedArea.top || 0;
    right = bleedArea.right || 0;
    bottom = bleedArea.bottom || 0;
    left = bleedArea.left || 0;
  }

  return {
    x: printArea.x - left,
    y: printArea.y - top,
    width: printArea.width + left + right,
    height: printArea.height + top + bottom,
    bleed: { top, right, bottom, left }
  };
};

/**
 * 獲取出血區域數值
 */
export const getBleedValues = (bleedArea) => {
  if (!bleedArea) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  const mode = bleedArea.mode || 'uniform';

  if (mode === 'uniform') {
    const value = bleedArea.value || 0;
    return { top: value, right: value, bottom: value, left: value };
  }

  return {
    top: bleedArea.top || 0,
    right: bleedArea.right || 0,
    bottom: bleedArea.bottom || 0,
    left: bleedArea.left || 0,
  };
};

/**
 * 檢查出血區域是否在畫布範圍內
 * 注意: 完整的驗證請使用 validationHelpers.js 中的 validateBleedArea
 * 這個函數主要用於內部計算和即時檢查
 */
export const checkBleedAreaBounds = (printArea, bleedArea, canvasSize = 400) => {
  if (!bleedArea) return { valid: true };

  const values = getBleedValues(bleedArea);

  // 檢查左邊界
  if (printArea.x - values.left < 0) {
    return {
      valid: false,
      message: '出血區域超出畫布左邊界',
      side: 'left'
    };
  }

  // 檢查上邊界
  if (printArea.y - values.top < 0) {
    return {
      valid: false,
      message: '出血區域超出畫布上邊界',
      side: 'top'
    };
  }

  // 檢查右邊界
  if (printArea.x + printArea.width + values.right > canvasSize) {
    return {
      valid: false,
      message: '出血區域超出畫布右邊界',
      side: 'right'
    };
  }

  // 檢查下邊界
  if (printArea.y + printArea.height + values.bottom > canvasSize) {
    return {
      valid: false,
      message: '出血區域超出畫布下邊界',
      side: 'bottom'
    };
  }

  return { valid: true };
};

/**
 * 計算出血區域的最大允許值
 */
export const calculateMaxBleedValue = (printArea, side, canvasSize = 400) => {
  switch (side) {
    case 'top':
      return printArea.y;
    case 'right':
      return canvasSize - (printArea.x + printArea.width);
    case 'bottom':
      return canvasSize - (printArea.y + printArea.height);
    case 'left':
      return printArea.x;
    default:
      return 0;
  }
};

/**
 * 調整出血區域數值以符合畫布限制
 */
export const constrainBleedArea = (printArea, bleedArea, canvasSize = 400) => {
  if (!bleedArea) return null;

  const mode = bleedArea.mode || 'uniform';

  if (mode === 'uniform') {
    const maxTop = calculateMaxBleedValue(printArea, 'top', canvasSize);
    const maxRight = calculateMaxBleedValue(printArea, 'right', canvasSize);
    const maxBottom = calculateMaxBleedValue(printArea, 'bottom', canvasSize);
    const maxLeft = calculateMaxBleedValue(printArea, 'left', canvasSize);

    const maxValue = Math.min(maxTop, maxRight, maxBottom, maxLeft);
    const value = Math.min(bleedArea.value || 0, maxValue);

    return { mode: 'uniform', value };
  } else {
    return {
      mode: 'separate',
      top: Math.min(bleedArea.top || 0, calculateMaxBleedValue(printArea, 'top', canvasSize)),
      right: Math.min(bleedArea.right || 0, calculateMaxBleedValue(printArea, 'right', canvasSize)),
      bottom: Math.min(bleedArea.bottom || 0, calculateMaxBleedValue(printArea, 'bottom', canvasSize)),
      left: Math.min(bleedArea.left || 0, calculateMaxBleedValue(printArea, 'left', canvasSize)),
    };
  }
};

/**
 * 繪製裁切標記
 */
export const drawCropMarks = (ctx, bounds, markLength = 10, markOffset = 5) => {
  if (!bounds) return;

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);

  const { x, y, width, height } = bounds;

  // 左上角標記
  ctx.beginPath();
  ctx.moveTo(x - markOffset - markLength, y);
  ctx.lineTo(x - markOffset, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - markOffset - markLength);
  ctx.lineTo(x, y - markOffset);
  ctx.stroke();

  // 右上角標記
  ctx.beginPath();
  ctx.moveTo(x + width + markOffset, y);
  ctx.lineTo(x + width + markOffset + markLength, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width, y - markOffset - markLength);
  ctx.lineTo(x + width, y - markOffset);
  ctx.stroke();

  // 左下角標記
  ctx.beginPath();
  ctx.moveTo(x - markOffset - markLength, y + height);
  ctx.lineTo(x - markOffset, y + height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + height + markOffset);
  ctx.lineTo(x, y + height + markOffset + markLength);
  ctx.stroke();

  // 右下角標記
  ctx.beginPath();
  ctx.moveTo(x + width + markOffset, y + height);
  ctx.lineTo(x + width + markOffset + markLength, y + height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width, y + height + markOffset);
  ctx.lineTo(x + width, y + height + markOffset + markLength);
  ctx.stroke();
};

/**
 * 將出血區域轉換為百分比格式（用於儲存）
 */
export const bleedAreaToPercentage = (bleedArea, canvasSize = 400) => {
  if (!bleedArea) return null;

  const mode = bleedArea.mode || 'uniform';

  if (mode === 'uniform') {
    return {
      mode: 'uniform',
      value: (bleedArea.value / canvasSize) * 100,
    };
  } else {
    return {
      mode: 'separate',
      top: (bleedArea.top / canvasSize) * 100,
      right: (bleedArea.right / canvasSize) * 100,
      bottom: (bleedArea.bottom / canvasSize) * 100,
      left: (bleedArea.left / canvasSize) * 100,
    };
  }
};

/**
 * 將出血區域從百分比格式轉換為像素（用於顯示）
 */
export const bleedAreaFromPercentage = (bleedArea, canvasSize = 400) => {
  if (!bleedArea) return null;

  const mode = bleedArea.mode || 'uniform';

  if (mode === 'uniform') {
    return {
      mode: 'uniform',
      value: (bleedArea.value / 100) * canvasSize,
    };
  } else {
    return {
      mode: 'separate',
      top: (bleedArea.top / 100) * canvasSize,
      right: (bleedArea.right / 100) * canvasSize,
      bottom: (bleedArea.bottom / 100) * canvasSize,
      left: (bleedArea.left / 100) * canvasSize,
    };
  }
};
