/**
 * PNG DPI 元數據處理工具
 * 為 Canvas.toBlob() 生成的 PNG 添加正確的 pHYs chunk
 *
 * PNG pHYs chunk 格式：
 * - Length: 4 bytes (固定為 9)
 * - Type: 4 bytes ("pHYs")
 * - Data: 9 bytes (X pixels per unit + Y pixels per unit + Unit specifier)
 * - CRC: 4 bytes (CRC32 checksum)
 */

/**
 * 為 PNG Blob 添加 DPI 元數據
 * @param {Blob} blob - Canvas.toBlob() 生成的 PNG
 * @param {number} dpi - 目標 DPI（默認 300）
 * @returns {Promise<Blob>} - 帶 DPI 元數據的新 PNG Blob
 */
export async function addDpiToPng(blob, dpi = 300) {
  try {
    console.log('🔧 addDpiToPng 開始執行，目標 DPI:', dpi);

    // 1. 將 Blob 轉為 ArrayBuffer
    const arrayBuffer = await blob.arrayBuffer();
    const dataView = new DataView(arrayBuffer);
    const uint8Array = new Uint8Array(arrayBuffer);

    // 2. 驗證 PNG 簽名（前 8 bytes）
    const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
      if (uint8Array[i] !== PNG_SIGNATURE[i]) {
        console.warn('❌ Invalid PNG signature, skipping DPI addition');
        return blob;
      }
    }
    console.log('✅ PNG 簽名驗證通過');

    // 3. 檢查是否已有 pHYs chunk
    if (hasPhysChunk(uint8Array)) {
      console.log('PNG already has pHYs chunk, updating it');
      return replacePhysChunk(uint8Array, dpi);
    }

    // 4. 找到 IHDR chunk 結束位置
    // PNG 結構：Signature(8) + IHDR_Length(4) + IHDR_Type(4) + IHDR_Data(13) + IHDR_CRC(4)
    const IHDR_END = 8 + 4 + 4 + 13 + 4; // = 33 bytes

    // 5. 創建 pHYs chunk
    const physChunk = createPhysChunk(dpi);

    // 6. 組裝新的 PNG：[Signature + IHDR] + [pHYs] + [剩餘 chunks]
    const newPng = new Uint8Array(arrayBuffer.byteLength + physChunk.byteLength);
    newPng.set(uint8Array.slice(0, IHDR_END), 0);
    newPng.set(new Uint8Array(physChunk), IHDR_END);
    newPng.set(uint8Array.slice(IHDR_END), IHDR_END + physChunk.byteLength);

    // 7. 創建新的 Blob
    console.log('✅ pHYs chunk 已創建並插入');
    const newBlob = new Blob([newPng], { type: 'image/png' });

    // 8. 驗證結果
    const verifyDpi = await readDpiFromPng(newBlob);
    console.log('✅ 驗證新 PNG 的 DPI:', verifyDpi, verifyDpi === dpi ? '(正確)' : '(錯誤)');

    return newBlob;

  } catch (error) {
    console.error('❌ addDpiToPng 錯誤:', error);
    return blob; // 降級：返回原始 blob
  }
}

/**
 * 創建 pHYs chunk
 * @param {number} dpi - 目標 DPI
 * @returns {ArrayBuffer} - pHYs chunk 的完整數據
 */
function createPhysChunk(dpi) {
  // 轉換 DPI 為 pixels per meter
  const pixelsPerMeter = Math.round(dpi * 39.3701);

  console.log(`Creating pHYs chunk: ${dpi} DPI = ${pixelsPerMeter} pixels/meter`);

  // pHYs chunk 數據長度 = 9 bytes (4 + 4 + 1)
  const DATA_LENGTH = 9;

  // 創建 chunk buffer: [Length(4)] [Type(4)] [Data(9)] [CRC(4)]
  const buffer = new ArrayBuffer(4 + 4 + DATA_LENGTH + 4);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // 1. Length (big-endian, 不包含自身、Type 和 CRC)
  view.setUint32(0, DATA_LENGTH, false);

  // 2. Chunk Type: "pHYs" (0x70 0x48 0x59 0x73)
  uint8[4] = 0x70; // 'p'
  uint8[5] = 0x48; // 'H'
  uint8[6] = 0x59; // 'Y' (注意：大寫！)
  uint8[7] = 0x73; // 's'

  // 3. Data (9 bytes)
  view.setUint32(8, pixelsPerMeter, false);   // X pixels per unit (big-endian)
  view.setUint32(12, pixelsPerMeter, false);  // Y pixels per unit (big-endian)
  uint8[16] = 1; // Unit specifier: 1 = meter

  // 4. CRC32 (計算 Type + Data，不包含 Length)
  const crcData = uint8.slice(4, 4 + 4 + DATA_LENGTH);
  const crc = calculateCRC32(crcData);
  view.setUint32(17, crc, false);

  return buffer;
}

/**
 * 檢查 PNG 是否已有 pHYs chunk
 * @param {Uint8Array} pngData - PNG 數據
 * @returns {boolean}
 */
function hasPhysChunk(pngData) {
  let offset = 8; // 跳過 PNG 簽名

  while (offset < pngData.length - 8) {
    const chunkLength = new DataView(pngData.buffer, offset, 4).getUint32(0, false);
    const chunkType = String.fromCharCode(
      pngData[offset + 4],
      pngData[offset + 5],
      pngData[offset + 6],
      pngData[offset + 7]
    );

    if (chunkType === 'pHYs') {
      return true;
    }

    if (chunkType === 'IDAT') {
      // pHYs 必須在 IDAT 之前，如果已到 IDAT 則沒有 pHYs
      return false;
    }

    // 移動到下一個 chunk：Length(4) + Type(4) + Data(chunkLength) + CRC(4)
    offset += 4 + 4 + chunkLength + 4;
  }

  return false;
}

/**
 * 替換已存在的 pHYs chunk
 * @param {Uint8Array} pngData - PNG 數據
 * @param {number} dpi - 新的 DPI
 * @returns {Blob}
 */
function replacePhysChunk(pngData, dpi) {
  let offset = 8; // 跳過 PNG 簽名
  let physStart = -1;
  let physEnd = -1;

  while (offset < pngData.length - 8) {
    const chunkLength = new DataView(pngData.buffer, offset, 4).getUint32(0, false);
    const chunkType = String.fromCharCode(
      pngData[offset + 4],
      pngData[offset + 5],
      pngData[offset + 6],
      pngData[offset + 7]
    );

    if (chunkType === 'pHYs') {
      physStart = offset;
      physEnd = offset + 4 + 4 + chunkLength + 4;
      break;
    }

    offset += 4 + 4 + chunkLength + 4;
  }

  if (physStart === -1) {
    // 理論上不會到這裡，但以防萬一
    return new Blob([pngData], { type: 'image/png' });
  }

  const newPhysChunk = createPhysChunk(dpi);
  const newPng = new Uint8Array(pngData.length - (physEnd - physStart) + newPhysChunk.byteLength);

  newPng.set(pngData.slice(0, physStart), 0);
  newPng.set(new Uint8Array(newPhysChunk), physStart);
  newPng.set(pngData.slice(physEnd), physStart + newPhysChunk.byteLength);

  return new Blob([newPng], { type: 'image/png' });
}

/**
 * 計算 CRC32 校驗碼（PNG 標準算法）
 * @param {Uint8Array} data - 要計算的數據
 * @returns {number} - CRC32 值
 */
function calculateCRC32(data) {
  const table = getCRC32Table();

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    const tableIndex = (crc ^ byte) & 0xFF;
    crc = (table[tableIndex] ^ (crc >>> 8)) >>> 0;
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * 獲取 CRC32 查找表（使用緩存提升性能）
 */
let cachedCRC32Table = null;

function getCRC32Table() {
  if (cachedCRC32Table) {
    return cachedCRC32Table;
  }

  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }

  cachedCRC32Table = table;
  return table;
}

/**
 * 從 PNG Blob 中讀取當前 DPI（調試用）
 * @param {Blob} blob - PNG Blob
 * @returns {Promise<number|null>} - DPI 值或 null
 */
export async function readDpiFromPng(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pngData = new Uint8Array(arrayBuffer);

    let offset = 8; // 跳過 PNG 簽名

    while (offset < pngData.length - 8) {
      const chunkLength = new DataView(pngData.buffer, offset, 4).getUint32(0, false);
      const chunkType = String.fromCharCode(
        pngData[offset + 4],
        pngData[offset + 5],
        pngData[offset + 6],
        pngData[offset + 7]
      );

      if (chunkType === 'pHYs') {
        const pixelsPerMeter = new DataView(pngData.buffer, offset + 8, 4).getUint32(0, false);
        const dpi = Math.round(pixelsPerMeter / 39.3701);
        console.log(`Found pHYs chunk: ${pixelsPerMeter} ppm = ${dpi} DPI`);
        return dpi;
      }

      if (chunkType === 'IDAT') {
        break;
      }

      offset += 4 + 4 + chunkLength + 4;
    }

    console.log('No pHYs chunk found');
    return null;
  } catch (error) {
    console.error('Error reading DPI from PNG:', error);
    return null;
  }
}

export default {
  addDpiToPng,
  readDpiFromPng,
};
