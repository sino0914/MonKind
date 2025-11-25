/**
 * 單位轉換工具
 * 用於 mm 和 px 之間的轉換，支援 300dpi 列印
 */

// DPI 常數
export const DPI_PRINT = 300;      // 列印品質
export const DPI_SCREEN = 72;      // 螢幕顯示
export const DPI_WEB = 96;         // 網頁標準

// 1 英吋 = 25.4mm
const MM_PER_INCH = 25.4;

/**
 * mm 轉換為 px
 * @param {number} mm - 毫米數值
 * @param {number} dpi - DPI 值，預設為 300
 * @returns {number} 像素數值
 */
export const mmToPx = (mm, dpi = DPI_PRINT) => {
  if (mm === null || mm === undefined) return 0;
  return (mm * dpi) / MM_PER_INCH;
};

/**
 * px 轉換為 mm
 * @param {number} px - 像素數值
 * @param {number} dpi - DPI 值，預設為 300
 * @returns {number} 毫米數值
 */
export const pxToMm = (px, dpi = DPI_PRINT) => {
  if (px === null || px === undefined) return 0;
  return (px * MM_PER_INCH) / dpi;
};

/**
 * 根據實際尺寸（mm）和 DPI 計算畫布像素尺寸
 * @param {Object} physicalSize - { widthMm, heightMm }
 * @param {number} dpi - DPI 值
 * @returns {Object} { width, height } 像素尺寸
 */
export const getCanvasPxSize = (physicalSize, dpi = DPI_PRINT) => {
  if (!physicalSize) return { width: 0, height: 0 };
  return {
    width: Math.round(mmToPx(physicalSize.widthMm, dpi)),
    height: Math.round(mmToPx(physicalSize.heightMm, dpi)),
  };
};

/**
 * 計算顯示用的縮放比例
 * 將實際尺寸縮放到指定的顯示尺寸內
 * @param {Object} physicalSize - { widthMm, heightMm }
 * @param {number} displaySize - 顯示區域的尺寸（px），預設 400
 * @param {number} dpi - DPI 值
 * @returns {number} 縮放比例
 */
export const getDisplayScale = (physicalSize, displaySize = 400, dpi = DPI_PRINT) => {
  if (!physicalSize) return 1;
  const canvasSize = getCanvasPxSize(physicalSize, dpi);
  const maxDimension = Math.max(canvasSize.width, canvasSize.height);
  return displaySize / maxDimension;
};

/**
 * 將顯示座標轉換為實際 mm 座標
 * @param {Object} displayCoords - { x, y } 顯示座標
 * @param {Object} physicalSize - { widthMm, heightMm }
 * @param {number} displaySize - 顯示區域尺寸
 * @returns {Object} { x, y } mm 座標
 */
export const displayToMm = (displayCoords, physicalSize, displaySize = 400) => {
  if (!physicalSize || !displayCoords) return { x: 0, y: 0 };

  // 計算顯示比例：displaySize 對應到實際 mm
  const scaleX = physicalSize.widthMm / displaySize;
  const scaleY = physicalSize.heightMm / displaySize;

  return {
    x: displayCoords.x * scaleX,
    y: displayCoords.y * scaleY,
  };
};

/**
 * 將 mm 座標轉換為顯示座標
 * @param {Object} mmCoords - { x, y } mm 座標
 * @param {Object} physicalSize - { widthMm, heightMm }
 * @param {number} displaySize - 顯示區域尺寸
 * @returns {Object} { x, y } 顯示座標
 */
export const mmToDisplay = (mmCoords, physicalSize, displaySize = 400) => {
  if (!physicalSize || !mmCoords) return { x: 0, y: 0 };

  const scaleX = displaySize / physicalSize.widthMm;
  const scaleY = displaySize / physicalSize.heightMm;

  return {
    x: mmCoords.x * scaleX,
    y: mmCoords.y * scaleY,
  };
};

/**
 * 將 printArea（mm）轉換為顯示用的 px 座標
 * @param {Object} printAreaMm - { x, y, width, height } mm 單位
 * @param {Object} physicalSize - { widthMm, heightMm }
 * @param {number} displaySize - 顯示區域尺寸
 * @returns {Object} { x, y, width, height } 顯示用 px
 */
export const printAreaMmToDisplay = (printAreaMm, physicalSize, displaySize = 400) => {
  if (!printAreaMm || !physicalSize) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scaleX = displaySize / physicalSize.widthMm;
  const scaleY = displaySize / physicalSize.heightMm;

  return {
    x: printAreaMm.x * scaleX,
    y: printAreaMm.y * scaleY,
    width: printAreaMm.width * scaleX,
    height: printAreaMm.height * scaleY,
  };
};

/**
 * 將顯示用的 px 座標轉換為 printArea（mm）
 * @param {Object} printAreaDisplay - { x, y, width, height } 顯示用 px
 * @param {Object} physicalSize - { widthMm, heightMm }
 * @param {number} displaySize - 顯示區域尺寸
 * @returns {Object} { x, y, width, height } mm 單位
 */
export const printAreaDisplayToMm = (printAreaDisplay, physicalSize, displaySize = 400) => {
  if (!printAreaDisplay || !physicalSize) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scaleX = physicalSize.widthMm / displaySize;
  const scaleY = physicalSize.heightMm / displaySize;

  return {
    x: printAreaDisplay.x * scaleX,
    y: printAreaDisplay.y * scaleY,
    width: printAreaDisplay.width * scaleX,
    height: printAreaDisplay.height * scaleY,
  };
};

/**
 * 格式化 mm 數值顯示
 * @param {number} mm - 毫米數值
 * @param {number} decimals - 小數位數，預設 1
 * @returns {string} 格式化後的字串
 */
export const formatMm = (mm, decimals = 1) => {
  if (mm === null || mm === undefined) return '0';
  return mm.toFixed(decimals);
};

/**
 * 計算 300dpi 輸出時的實際像素尺寸
 * @param {Object} physicalSize - { widthMm, heightMm }
 * @returns {Object} { width, height } 輸出像素尺寸
 */
export const getPrintOutputSize = (physicalSize) => {
  return getCanvasPxSize(physicalSize, DPI_PRINT);
};

/**
 * 舊資料遷移：將基於 400px 畫布的 px 值轉換為 mm
 * @param {Object} pxValues - { x, y, width, height } px 值
 * @param {Object} physicalSize - { widthMm, heightMm } 實際尺寸
 * @param {number} oldCanvasSize - 舊的畫布尺寸，預設 400
 * @returns {Object} { x, y, width, height } mm 值
 */
export const migratePxToMm = (pxValues, physicalSize, oldCanvasSize = 400) => {
  if (!pxValues || !physicalSize) return null;

  const scaleX = physicalSize.widthMm / oldCanvasSize;
  const scaleY = physicalSize.heightMm / oldCanvasSize;

  return {
    x: pxValues.x * scaleX,
    y: pxValues.y * scaleY,
    width: pxValues.width * scaleX,
    height: pxValues.height * scaleY,
  };
};

export default {
  DPI_PRINT,
  DPI_SCREEN,
  DPI_WEB,
  mmToPx,
  pxToMm,
  getCanvasPxSize,
  getDisplayScale,
  displayToMm,
  mmToDisplay,
  printAreaMmToDisplay,
  printAreaDisplayToMm,
  formatMm,
  getPrintOutputSize,
  migratePxToMm,
};
