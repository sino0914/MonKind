import { removeBackground } from '@imgly/background-removal';

/**
 * 移除圖片背景
 * @param {string} imageUrl - 圖片 URL 或 base64
 * @returns {Promise<string>} - 去背後的 base64 圖片
 */
export const removeImageBackground = async (imageUrl) => {
  try {
    console.log('🎨 開始去背處理...', imageUrl.substring(0, 50));

    // 使用 @imgly/background-removal 進行去背
    const blob = await removeBackground(imageUrl, {
      // 使用較小的模型以提升速度（可選：'isnet', 'isnet_fp16', 'isnet_quint8'）
      model: 'isnet_quint8', // 最快的模型
      progress: (key, current, total) => {
        console.log(`⏳ 去背進度: ${key} - ${Math.round((current / total) * 100)}%`);
      },
    });

    // 將 Blob 轉換為 base64
    const base64 = await blobToBase64(blob);

    console.log('✅ 去背完成！');
    return base64;
  } catch (error) {
    console.error('❌ 去背失敗:', error);
    throw new Error('去背處理失敗：' + error.message);
  }
};

/**
 * 將 Blob 轉換為 base64
 * @param {Blob} blob - Blob 物件
 * @returns {Promise<string>} - base64 字串
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 載入圖片並轉換為 Blob
 * @param {string} imageUrl - 圖片 URL
 * @returns {Promise<Blob>} - 圖片 Blob
 */
export const loadImageAsBlob = async (imageUrl) => {
  try {
    // 如果已經是 base64，直接轉換
    if (imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      return await response.blob();
    }

    // 如果是 URL，使用 fetch 載入
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('無法載入圖片');
    }
    return await response.blob();
  } catch (error) {
    console.error('❌ 載入圖片失敗:', error);
    throw error;
  }
};
