import { useState, useCallback, useEffect } from 'react';
import { HttpAPI } from '../../../services/HttpApiService';
import { API } from '../../../services/api';

/**
 * 圖片管理 Hook
 * 處理圖片上傳、管理已上傳圖片、從元素庫添加圖片
 */
const useImageManager = (editorState, imageReplace = null) => {
  const { addElement } = editorState;

  // 已上傳圖片列表
  const [uploadedImages, setUploadedImages] = useState([]);
  // 上傳中狀態
  const [isUploading, setIsUploading] = useState(false);
  // 管理的元素列表（從元素庫載入）
  const [managedElements, setManagedElements] = useState([]);
  // 載入元素中狀態
  const [loadingElements, setLoadingElements] = useState(false);
  // 拖曳中的圖片 URL
  const [draggingImageUrl, setDraggingImageUrl] = useState(null);
  // 上傳錯誤列表
  const [uploadErrors, setUploadErrors] = useState([]);

  // 初始化：從伺服器載入已上傳的圖片列表
  useEffect(() => {
    const loadServerImages = async () => {
      try {
        // TODO: 未來需要從登入狀態取得實際的 userId
        const userId = 'guest'; // 暫時使用 guest，之後改為實際使用者 ID
        const files = await HttpAPI.upload.getFiles('editor-image', userId);
        console.log('✅ 從伺服器載入圖片 (userId:', userId, '):', files);

        // 構建完整 URL
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

        // 轉換為統一格式
        const images = files.map((file, index) => {
          const imageUrl = file.url.startsWith('http')
            ? file.url
            : `${API_BASE_URL.replace('/api', '')}${file.url}`;

          return {
            id: file.filename || Date.now() + index,
            url: imageUrl,
            name: file.filename,
            uploadedAt: file.uploadedAt || new Date().toISOString(),
          };
        });
        setUploadedImages(images);

        // 清除舊的 localStorage 數據
        localStorage.removeItem('editor_uploaded_images');
      } catch (error) {
        console.error('❌ 載入伺服器圖片失敗:', error);
        setUploadedImages([]);
      }
    };

    loadServerImages();
  }, []);

  /**
   * 處理圖片上傳（支援多張）
   * @param {Event} e - 文件輸入事件
   */
  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadErrors([]); // 清空之前的錯誤

    const userId = 'guest'; // TODO: 未來需要從登入狀態取得實際的 userId
    const successfulUploads = [];
    const errors = [];

    // 逐一上傳每張圖片
    for (const file of files) {
      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        errors.push({ name: file.name, reason: '不是圖片格式' });
        continue;
      }

      // 檢查文件大小（最大 10MB）
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push({ name: file.name, reason: '檔案過大（超過 10MB）' });
        continue;
      }

      try {
        // 上傳到伺服器
        const uploadResult = await HttpAPI.upload.editorImage(file, userId);

        // 構建完整的圖片 URL
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
        const imageUrl = uploadResult.url.startsWith('http')
          ? uploadResult.url
          : `${API_BASE_URL.replace('/api', '')}${uploadResult.url}`;

        // 添加到成功列表
        const newImage = {
          id: uploadResult.filename || Date.now() + Math.random(),
          url: imageUrl,
          name: file.name,
          uploadedAt: new Date().toISOString(),
        };

        successfulUploads.push(newImage);
        console.log('✅ 圖片已上傳到伺服器:', uploadResult);
      } catch (error) {
        console.error(`圖片上傳失敗: ${file.name}`, error);
        errors.push({ name: file.name, reason: error.message || '上傳失敗' });
      }
    }

    // 批量更新已上傳圖片列表
    if (successfulUploads.length > 0) {
      const updatedImages = [...uploadedImages, ...successfulUploads];
      setUploadedImages(updatedImages);
    }

    // 設定錯誤訊息
    if (errors.length > 0) {
      setUploadErrors(errors);
    }

    // 重置輸入框
    e.target.value = '';
    setIsUploading(false);
  }, [uploadedImages]);

  /**
   * 將已上傳的圖片添加到畫布
   * @param {Object} image - 圖片對象
   */
  const handleAddImageToCanvas = useCallback(async (image) => {
    if (!image || !image.url) return;

    // 如果處於替換模式，執行替換
    if (imageReplace?.isReplacingImage) {
      imageReplace.executeReplace(image.url);
      return;
    }

    // 載入圖片獲取原始尺寸
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = image.url;

    await new Promise((resolve) => {
      img.onload = () => {
        // 計算保持寬高比的尺寸（最大邊設為 100）
        const maxSize = 100;
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > height) {
          // 寬圖：寬度固定為 maxSize
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          // 高圖或正方形：高度固定為 maxSize
          width = (width / height) * maxSize;
          height = maxSize;
        }

        console.log('📐 圖片尺寸計算:', {
          original: { width: img.naturalWidth, height: img.naturalHeight },
          scaled: { width, height }
        });

        // 否則新增圖片（保持寬高比）
        addElement({
          id: `image-${Date.now()}`,
          type: 'image',
          url: image.url,
          width,
          height,
          x: 150,
          y: 150,
          rotation: 0,
          opacity: 1,
        });
        resolve();
      };
      img.onerror = () => {
        console.error('圖片載入失敗:', image.url);
        alert('圖片載入失敗，請重試');
        resolve();
      };
    });
  }, [addElement, imageReplace]);

  /**
   * 刪除已上傳的圖片
   * @param {number} imageId - 圖片 ID
   */
  const handleDeleteUploadedImage = useCallback(async (imageId) => {
    const imageToDelete = uploadedImages.find(img => img.id === imageId);
    if (!imageToDelete) return;

    // 確認對話框
    const confirmMessage = `確定要刪除圖片「${imageToDelete.name}」嗎？\n\n⚠️ 注意：如果設計區中有使用此圖片，該圖片元素也會失效。`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // 從伺服器刪除
      if (imageToDelete.url.startsWith('http')) {
        // 提取檔名
        const filename = imageToDelete.url.split('/').pop();
        // TODO: 未來需要從登入狀態取得實際的 userId
        const userId = 'guest'; // 暫時使用 guest，之後改為實際使用者 ID
        await HttpAPI.upload.deleteFile('editor-image', filename, userId);
        console.log('✅ 已從伺服器刪除圖片:', filename, '(userId:', userId, ')');
      }

      // 從列表中移除
      const updatedImages = uploadedImages.filter(img => img.id !== imageId);
      setUploadedImages(updatedImages);
    } catch (error) {
      console.error('刪除圖片失敗:', error);
      alert(`刪除圖片失敗：${error.message || '請稍後重試'}`);
    }
  }, [uploadedImages]);

  /**
   * 從元素庫添加圖片到設計
   * @param {Object} element - 元素對象
   */
  const addManagedElementToDesign = useCallback(async (element) => {
    if (!element || !element.url) return;

    // 如果處於替換模式，執行替換
    if (imageReplace?.isReplacingImage) {
      imageReplace.executeReplace(element.url);
      return;
    }

    // 載入圖片獲取原始尺寸
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = element.url;

    await new Promise((resolve) => {
      img.onload = () => {
        // 計算保持寬高比的尺寸（最大邊設為 100）
        const maxSize = 100;
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > height) {
          // 寬圖：寬度固定為 maxSize
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          // 高圖或正方形：高度固定為 maxSize
          width = (width / height) * maxSize;
          height = maxSize;
        }

        console.log('📐 元素庫圖片尺寸計算:', {
          original: { width: img.naturalWidth, height: img.naturalHeight },
          scaled: { width, height }
        });

        // 否則新增圖片（保持寬高比）
        addElement({
          id: `image-${Date.now()}`,
          type: 'image',
          url: element.url,
          width,
          height,
          x: 150,
          y: 150,
          rotation: 0,
          opacity: 1,
        });
        resolve();
      };
      img.onerror = () => {
        console.error('元素圖片載入失敗:', element.url);
        alert('圖片載入失敗，請重試');
        resolve();
      };
    });
  }, [addElement, imageReplace]);

  /**
   * 載入管理的元素（從元素庫）
   */
  const loadManagedElements = useCallback(async () => {
    setLoadingElements(true);
    try {
      const elements = await API.elements.getAll();

      // 🔧 轉換相對路徑為完整 URL
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
      const baseUrl = API_BASE_URL.replace('/api', '');

      const elementsWithFullUrl = elements.map(element => {
        if (element.url && !element.url.startsWith('http') && !element.url.startsWith('data:')) {
          return {
            ...element,
            url: `${baseUrl}${element.url}`
          };
        }
        return element;
      });

      setManagedElements(elementsWithFullUrl);
    } catch (error) {
      console.error('載入元素失敗:', error);
      alert('載入元素失敗，請重試');
    } finally {
      setLoadingElements(false);
    }
  }, []);

  // 初始化時自動載入元素
  useEffect(() => {
    loadManagedElements();
  }, [loadManagedElements]);

  /**
   * 拖曳開始
   * @param {string} imageUrl - 圖片 URL
   */
  const handleDragStart = useCallback((imageUrl) => {
    setDraggingImageUrl(imageUrl);
  }, []);

  /**
   * 拖曳結束
   */
  const handleDragEnd = useCallback(() => {
    setDraggingImageUrl(null);
    if (imageReplace) {
      imageReplace.clearPreview();
    }
  }, [imageReplace]);

  /**
   * 清除上傳錯誤
   */
  const clearUploadErrors = useCallback(() => {
    setUploadErrors([]);
  }, []);

  /**
   * 手動添加已上傳的圖片到列表
   * @param {Object} image - 圖片對象 { id, url, name, uploadedAt }
   */
  const addUploadedImage = useCallback((image) => {
    setUploadedImages(prev => [...prev, image]);
  }, []);

  return {
    uploadedImages,
    isUploading,
    managedElements,
    loadingElements,
    draggingImageUrl,
    uploadErrors,
    handleImageUpload,
    handleAddImageToCanvas,
    handleDeleteUploadedImage,
    addManagedElementToDesign,
    loadManagedElements,
    handleDragStart,
    handleDragEnd,
    clearUploadErrors,
    addUploadedImage,
  };
};

export default useImageManager;
