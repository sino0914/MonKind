// LocalStorage 操作工具

import { generate3DSnapshot } from './snapshot3D';
import { API } from '../../../services/api';

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
  return elements.map(element => {
    if (element.type === 'image' && element.url && element.url.startsWith('ref:')) {
      // 如果是引用 ID，從圖片庫獲取實際 URL
      const imageId = element.url.replace('ref:', '');
      const imageUrl = getImageFromLibrary(imageId);
      if (imageUrl) {
        return {
          ...element,
          url: imageUrl,
        };
      }
    }
    return element;
  });
};

// 儲存草稿
export const saveDraft = async (productId, designData, draftId = null, product = null) => {
  const { elements, backgroundColor, workName } = designData;

  // 優化元素儲存
  const optimizedElements = optimizeElementsForStorage(elements);

  const draft = {
    productId,
    timestamp: new Date().toISOString(),
    elements: optimizedElements,
    backgroundColor,
    name: workName,
  };

  // 如果是 3D 商品，生成快照並上傳到伺服器
  const glbUrl = product?.glbUrl || product?.model3D?.glbUrl;
  console.log('🔍 檢查商品類型:', product?.type, '是否有 GLB:', !!glbUrl);
  if (product && product.type === '3D' && glbUrl) {
    console.log('🎨 正在生成 3D 預覽快照...', {
      productId: product.id,
      productTitle: product.title,
      elementsCount: elements.length
    });
    try {
      const snapshot = await generate3DSnapshot(
        product,
        elements, // 使用原始元素，不是優化後的
        backgroundColor,
        400,
        400
      );
      if (snapshot) {
        console.log('✅ 3D 快照已生成，大小:', (snapshot.length / 1024).toFixed(2), 'KB');

        // 上傳快照到伺服器
        try {
          const uploadResult = await API.upload.snapshot(snapshot, productId);
          draft.snapshot3D = uploadResult.url; // 儲存 URL 而非 base64
          console.log('✅ 快照已上傳到伺服器:', uploadResult.url, '檔案大小:', uploadResult.sizeKB, 'KB');
        } catch (uploadError) {
          console.error('❌ 上傳快照失敗，使用 base64 儲存:', uploadError);
          draft.snapshot3D = snapshot; // 失敗時回退到 base64
        }
      } else {
        console.warn('⚠️ 生成的快照為 null');
      }
    } catch (error) {
      console.error('❌ 生成 3D 快照失敗，但草稿仍會儲存:', error);
    }
  } else {
    console.log('⏭️ 跳過 3D 快照生成（非 3D 商品或缺少 GLB）');
  }

  try {
    const draftString = JSON.stringify(draft);

    // 檢查草稿大小（以 KB 為單位）
    const draftSizeKB = new Blob([draftString]).size / 1024;
    console.log(`優化後草稿大小: ${draftSizeKB.toFixed(2)} KB`);

    // 如果草稿超過 4MB，警告用戶
    if (draftSizeKB > 4096) {
      console.warn('草稿大小超過 4MB，可能會導致儲存失敗');
      return {
        success: false,
        message: '草稿過大（超過4MB），請減少圖片元素或降低圖片品質',
        draftId: null
      };
    }

    if (draftId) {
      // 更新現有草稿
      localStorage.setItem(draftId, draftString);
      return { success: true, message: '草稿已更新！', draftId };
    } else {
      // 創建新草稿
      const newDraftId = `${STORAGE_KEYS.DRAFT_PREFIX}${productId}_${Date.now()}`;
      localStorage.setItem(newDraftId, draftString);
      return { success: true, message: '草稿已儲存！', draftId: newDraftId };
    }
  } catch (error) {
    console.error('儲存草稿失敗:', error);

    // 檢查是否是容量限制錯誤
    if (error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.code === 1014) {
      return {
        success: false,
        message: '儲存空間不足！請刪除舊草稿或減少圖片數量',
        draftId: null
      };
    }

    return { success: false, message: `儲存失敗: ${error.message}`, draftId: null };
  }
};

// 載入草稿
export const loadDraft = (draftId) => {
  try {
    const draftData = localStorage.getItem(draftId);
    if (draftData) {
      const draft = JSON.parse(draftData);

      // 還原圖片引用
      if (draft.elements) {
        draft.elements = restoreElementsFromStorage(draft.elements);
      }

      return draft;
    }
    return null;
  } catch (error) {
    console.error('載入草稿失敗:', error);
    return null;
  }
};

// 刪除草稿
export const deleteDraft = (draftId) => {
  try {
    localStorage.removeItem(draftId);
    return true;
  } catch (error) {
    console.error('刪除草稿失敗:', error);
    return false;
  }
};

// 獲取所有草稿
export const getAllDrafts = () => {
  const drafts = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.DRAFT_PREFIX)) {
        const draftData = localStorage.getItem(key);
        if (draftData) {
          drafts.push({
            id: key,
            ...JSON.parse(draftData),
          });
        }
      }
    }
    // 按時間戳排序，最新的在前
    return drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('獲取草稿列表失敗:', error);
    return [];
  }
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

// 清除所有草稿
export const clearAllDrafts = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEYS.DRAFT_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('清除草稿失敗:', error);
    return false;
  }
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
