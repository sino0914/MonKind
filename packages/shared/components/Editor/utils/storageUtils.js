// LocalStorage 操作工具（改用伺服器儲存）

import { generate3DSnapshot } from './snapshot3D';
import { API } from '../../../services/api';
import { HttpAPI } from '../../../services/HttpApiService';

const STORAGE_KEYS = {
  UPLOADED_IMAGES: 'editor_uploaded_images',
  DRAFT_PREFIX: 'draft_',
  IMAGE_LIBRARY: 'editor_image_library_', // 圖片庫前綴
};

// 將圖片 URL 儲存到圖片庫並返回 ID
const saveImageToLibrary = (imageUrl) => {
  try {
    // 使用內容的簡單 hash 作為 ID（避免重複儲存相同圖片）
    const simpleHash = imageUrl.substring(0, 100).replace(/[^a-zA-Z0-9]/g, '').substring(0, 30);
    const imageId = `img_${simpleHash}_${Date.now()}`;
    const imageKey = `${STORAGE_KEYS.IMAGE_LIBRARY}${imageId}`;

    // 檢查是否已存在相同內容的圖片（基於 hash）
    const existingKey = findExistingImageByHash(simpleHash);
    if (existingKey) {
      console.log('使用已存在的圖片引用:', existingKey);
      return existingKey.replace(STORAGE_KEYS.IMAGE_LIBRARY, '');
    }

    // 儲存新圖片
    localStorage.setItem(imageKey, imageUrl);
    return imageId;
  } catch (error) {
    console.error('儲存圖片到圖片庫失敗:', error);

    // 如果是容量錯誤，嘗試清理未使用的圖片
    if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
      console.warn('儲存空間不足，建議清理舊草稿或未使用的圖片');
    }

    return null;
  }
};

// 尋找是否已存在相同的圖片（基於 hash）
const findExistingImageByHash = (hash) => {
  for (let key in localStorage) {
    if (key.startsWith(STORAGE_KEYS.IMAGE_LIBRARY) && key.includes(hash)) {
      return key;
    }
  }
  return null;
};

// 從圖片庫獲取圖片 URL
const getImageFromLibrary = (imageId) => {
  try {
    const imageKey = `${STORAGE_KEYS.IMAGE_LIBRARY}${imageId}`;
    return localStorage.getItem(imageKey);
  } catch (error) {
    console.error('從圖片庫獲取圖片失敗:', error);
    return null;
  }
};

// 優化元素儲存：將圖片 URL 替換為引用 ID
const optimizeElementsForStorage = (elements) => {
  return elements.map(element => {
    if (element.type === 'image' && element.url && element.url.startsWith('data:')) {
      // 如果是 base64 圖片，儲存到圖片庫並替換為 ID
      const imageId = saveImageToLibrary(element.url);
      if (imageId) {
        return {
          ...element,
          url: `ref:${imageId}`, // 使用引用標記
          _originalUrl: undefined, // 移除原始 URL
        };
      } else {
        // 如果儲存失敗，保留原始 URL
        console.warn('圖片儲存到圖片庫失敗，保留原始 URL');
        return element;
      }
    }
    return element;
  });
};

// 還原元素：將引用 ID 替換回圖片 URL
const restoreElementsFromStorage = (elements) => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
  const baseUrl = API_BASE_URL.replace('/api', '');

  return elements.map(element => {
    if (element.type === 'image' && element.url) {
      // 如果是引用 ID，從圖片庫獲取實際 URL
      if (element.url.startsWith('ref:')) {
        const imageId = element.url.replace('ref:', '');
        const imageUrl = getImageFromLibrary(imageId);
        if (imageUrl) {
          return {
            ...element,
            url: imageUrl,
          };
        }
      }

      // 🔧 修正舊的 localhost:3001 URL
      if (element.url.includes('localhost:3001')) {
        const fixedUrl = element.url.replace('http://localhost:3001', baseUrl);
        console.log('🔧 修正舊 URL:', element.url, '→', fixedUrl);
        return {
          ...element,
          url: fixedUrl,
        };
      }
    }
    return element;
  });
};

// 儲存草稿（改用伺服器儲存）
export const saveDraft = async (productId, designData, draftId = null, product = null, previewElement = null) => {
  const { elements, backgroundColor, workName } = designData;

  // 獲取當前用戶（暫時使用 guest）
  const currentUser = HttpAPI.users.getCurrentUser();
  const userId = currentUser?.id || 'guest';

  const draft = {
    id: draftId || `${STORAGE_KEYS.DRAFT_PREFIX}${productId}_${Date.now()}`,
    productId,
    timestamp: new Date().toISOString(),
    elements, // 不再需要優化，直接儲存
    backgroundColor,
    name: workName,
  };

  // 如果沒有傳入 product，從伺服器載入
  if (!product) {
    try {
      product = await HttpAPI.products.getById(productId);
      console.log('📦 已從伺服器載入商品資料:', product?.title);
    } catch (error) {
      console.error('❌ 載入商品資料失敗:', error);
      product = null;
    }
  }

  // 根據商品類型生成快照並上傳到伺服器
  const glbUrl = product?.glbUrl || product?.model3D?.glbUrl;
  console.log('🔍 檢查商品類型:', product?.type, '是否有 GLB:', !!glbUrl);

  if (product && product.type === '3D' && glbUrl) {
    // 3D 商品：生成 3D 快照
    console.log('🎨 正在生成 3D 預覽快照...', {
      productId: product.id,
      productTitle: product.title,
      elementsCount: elements.length
    });
    try {
      const snapshot = await generate3DSnapshot(
        product,
        elements,
        backgroundColor,
        400,
        400,
        previewElement // 傳遞 ProductPreview 的 DOM 元素
      );
      if (snapshot) {
        console.log('✅ 3D 快照已生成，大小:', (snapshot.length / 1024).toFixed(2), 'KB');

        // 上傳快照到伺服器
        try {
          const uploadResult = await API.upload.snapshot(snapshot, productId);
          if (uploadResult && uploadResult.url) {
            // 組合完整 URL（加上伺服器 base URL）
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
            const baseUrl = API_BASE_URL.replace('/api', '');
            const fullUrl = `${baseUrl}${uploadResult.url}`;
            draft.snapshot3D = fullUrl; // 儲存完整 URL
            console.log('✅ 3D 快照已上傳到伺服器:', fullUrl, '檔案大小:', uploadResult.sizeKB, 'KB');
          } else {
            console.error('❌ 上傳 3D 快照失敗：回應無效');
            // 不儲存 snapshot3D，保持為 undefined
          }
        } catch (uploadError) {
          console.error('❌ 上傳 3D 快照失敗:', uploadError);
          // 不儲存 snapshot3D，保持為 undefined
        }
      } else {
        console.warn('⚠️ 生成的 3D 快照為 null');
      }
    } catch (error) {
      console.error('❌ 生成 3D 快照失敗，但草稿仍會儲存:', error);
    }
  } else if (product && product.type !== '3D') {
    // 2D 商品：生成 2D 快照
    console.log('🎨 正在生成 2D 預覽快照...', {
      productId: product.id,
      productTitle: product.title,
      elementsCount: elements.length
    });
    try {
      const { generate2DSnapshot } = await import('./snapshot2D');
      const snapshot = await generate2DSnapshot(
        product,
        elements,
        backgroundColor,
        400,
        400
      );
      if (snapshot) {
        console.log('✅ 2D 快照已生成，大小:', (snapshot.length / 1024).toFixed(2), 'KB');

        // 上傳快照到伺服器
        try {
          const uploadResult = await API.upload.snapshot(snapshot, productId);
          if (uploadResult && uploadResult.url) {
            // 組合完整 URL（加上伺服器 base URL）
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
            const baseUrl = API_BASE_URL.replace('/api', '');
            const fullUrl = `${baseUrl}${uploadResult.url}`;
            draft.snapshot2D = fullUrl; // 儲存完整 URL
            console.log('✅ 2D 快照已上傳到伺服器:', fullUrl, '檔案大小:', uploadResult.sizeKB, 'KB');
          } else {
            console.error('❌ 上傳 2D 快照失敗：回應無效');
            // 不儲存 snapshot2D，保持為 undefined
          }
        } catch (uploadError) {
          console.error('❌ 上傳 2D 快照失敗:', uploadError);
          // 不儲存 snapshot2D，保持為 undefined
        }
      } else {
        console.warn('⚠️ 生成的 2D 快照為 null');
      }
    } catch (error) {
      console.error('❌ 生成 2D 快照失敗，但草稿仍會儲存:', error);
    }
  } else {
    console.log('⏭️ 跳過快照生成（缺少商品資料或 GLB）');
  }

  try {
    // 儲存到伺服器
    await HttpAPI.drafts.save(userId, draft);
    console.log('✅ 草稿已儲存到伺服器:', draft.id);

    return {
      success: true,
      message: draftId ? '草稿已更新！' : '草稿已儲存！',
      draftId: draft.id
    };
  } catch (error) {
    console.error('儲存草稿失敗:', error);
    return {
      success: false,
      message: `儲存失敗: ${error.message}`,
      draftId: null
    };
  }
};

// 載入草稿（已廢棄，改用 MyWorks 頁面直接從 API 載入）
export const loadDraft = (draftId) => {
  console.warn('loadDraft 已廢棄，草稿已改為伺服器儲存');
  return null;
};

// 刪除草稿（已廢棄，改用 API）
export const deleteDraft = (draftId) => {
  console.warn('deleteDraft 已廢棄，請使用 HttpAPI.drafts.delete()');
  return false;
};

// 獲取所有草稿（已廢棄，改用 API）
export const getAllDrafts = () => {
  console.warn('getAllDrafts 已廢棄，請使用 HttpAPI.drafts.getAll()');
  return [];
};

// 儲存已上傳的圖片
export const saveUploadedImages = (images) => {
  try {
    localStorage.setItem(STORAGE_KEYS.UPLOADED_IMAGES, JSON.stringify(images));
    return true;
  } catch (error) {
    console.error('儲存圖片失敗:', error);
    return false;
  }
};

// 載入已上傳的圖片
export const loadUploadedImages = () => {
  try {
    const savedImages = localStorage.getItem(STORAGE_KEYS.UPLOADED_IMAGES);
    if (savedImages) {
      return JSON.parse(savedImages);
    }
    return [];
  } catch (error) {
    console.error('載入圖片失敗:', error);
    return [];
  }
};

// 清除所有草稿（已廢棄）
export const clearAllDrafts = () => {
  console.warn('clearAllDrafts 已廢棄，草稿已改為伺服器儲存');
  return false;
};

// 清除所有圖片
export const clearAllImages = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.UPLOADED_IMAGES);
    return true;
  } catch (error) {
    console.error('清除圖片失敗:', error);
    return false;
  }
};

// 檢查 localStorage 使用情況
export const getStorageInfo = () => {
  try {
    let totalSize = 0;
    let draftSize = 0;
    let imageSize = 0;
    let imageLibrarySize = 0;

    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const itemSize = (localStorage[key].length + key.length) * 2; // UTF-16 編碼，每字符2字節
        totalSize += itemSize;

        if (key.startsWith(STORAGE_KEYS.DRAFT_PREFIX)) {
          draftSize += itemSize;
        } else if (key === STORAGE_KEYS.UPLOADED_IMAGES) {
          imageSize += itemSize;
        } else if (key.startsWith(STORAGE_KEYS.IMAGE_LIBRARY)) {
          imageLibrarySize += itemSize;
        }
      }
    }

    return {
      total: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
      drafts: (draftSize / 1024 / 1024).toFixed(2) + ' MB',
      images: (imageSize / 1024 / 1024).toFixed(2) + ' MB',
      imageLibrary: (imageLibrarySize / 1024 / 1024).toFixed(2) + ' MB',
      totalBytes: totalSize,
      draftBytes: draftSize,
      imageBytes: imageSize,
      imageLibraryBytes: imageLibrarySize,
    };
  } catch (error) {
    console.error('獲取儲存信息失敗:', error);
    return null;
  }
};
