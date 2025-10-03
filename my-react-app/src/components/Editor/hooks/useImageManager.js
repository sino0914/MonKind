import { useState, useCallback, useEffect } from 'react';
import { HttpAPI } from '../../../services/HttpApiService';
import { API } from '../../../services/api';

/**
 * 圖片管理 Hook
 * 處理圖片上傳、管理已上傳圖片、從元素庫添加圖片
 */
const useImageManager = (editorState) => {
  const { addElement } = editorState;

  // 已上傳圖片列表
  const [uploadedImages, setUploadedImages] = useState([]);
  // 上傳中狀態
  const [isUploading, setIsUploading] = useState(false);
  // 管理的元素列表（從元素庫載入）
  const [managedElements, setManagedElements] = useState([]);
  // 載入元素中狀態
  const [loadingElements, setLoadingElements] = useState(false);

  // 初始化：從伺服器載入已上傳的圖片列表
  useEffect(() => {
    const loadServerImages = async () => {
      try {
        const files = await HttpAPI.upload.getFiles('editor-image');
        console.log('✅ 從伺服器載入圖片:', files);

        // 轉換為統一格式
        const images = files.map((file, index) => ({
          id: file.filename || Date.now() + index,
          url: file.url,
          name: file.filename,
          uploadedAt: file.uploadedAt || new Date().toISOString(),
        }));
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
   * 處理圖片上傳
   * @param {Event} e - 文件輸入事件
   */
  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }

    // 檢查文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('圖片檔案過大，請選擇小於 10MB 的圖片');
      return;
    }

    setIsUploading(true);

    try {
      // 上傳到伺服器
      const uploadResult = await HttpAPI.upload.editorImage(file);

      // 添加到已上傳圖片列表
      const newImage = {
        id: uploadResult.filename || Date.now(),
        url: uploadResult.url, // 伺服器返回的圖片 URL
        name: file.name,
        uploadedAt: new Date().toISOString(),
      };

      const updatedImages = [...uploadedImages, newImage];
      setUploadedImages(updatedImages);

      console.log('✅ 圖片已上傳到伺服器:', uploadResult);

      // 重置輸入框
      e.target.value = '';
    } catch (error) {
      console.error('圖片上傳失敗:', error);
      alert(`圖片上傳失敗：${error.message || '請稍後重試'}`);
    } finally {
      setIsUploading(false);
    }
  }, [uploadedImages]);

  /**
   * 將已上傳的圖片添加到畫布
   * @param {Object} image - 圖片對象
   */
  const handleAddImageToCanvas = useCallback((image) => {
    if (!image || !image.url) return;

    addElement({
      id: `image-${Date.now()}`,
      type: 'image',
      url: image.url,
      width: 100,
      height: 100,
      x: 150,
      y: 150,
      rotation: 0,
      opacity: 1,
    });
  }, [addElement]);

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
        await HttpAPI.upload.deleteFile('editor-image', filename);
        console.log('✅ 已從伺服器刪除圖片:', filename);
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
  const addManagedElementToDesign = useCallback((element) => {
    if (!element || !element.url) return;

    addElement({
      id: `image-${Date.now()}`,
      type: 'image',
      url: element.url,
      width: 100,
      height: 100,
      x: 150,
      y: 150,
      rotation: 0,
      opacity: 1,
    });
  }, [addElement]);

  /**
   * 載入管理的元素（從元素庫）
   */
  const loadManagedElements = useCallback(async () => {
    setLoadingElements(true);
    try {
      const elements = await API.elements.getAll();
      setManagedElements(elements);
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

  return {
    uploadedImages,
    isUploading,
    managedElements,
    loadingElements,
    handleImageUpload,
    handleAddImageToCanvas,
    handleDeleteUploadedImage,
    addManagedElementToDesign,
    loadManagedElements,
  };
};

export default useImageManager;
