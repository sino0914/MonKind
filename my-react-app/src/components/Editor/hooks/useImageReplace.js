import { useState, useCallback } from 'react';

/**
 * 圖片替換 Hook
 * 處理圖片替換模式、拖曳預覽等功能
 */
const useImageReplace = (editorState) => {
  const { designElements, updateElement } = editorState;

  // 替換模式狀態
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [replacingImageId, setReplacingImageId] = useState(null);

  // 拖曳預覽狀態
  const [previewReplacingId, setPreviewReplacingId] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  /**
   * 啟動替換模式
   * @param {string} elementId - 要替換的圖片元素 ID
   */
  const startReplaceMode = useCallback((elementId) => {
    const element = designElements.find((el) => el.id === elementId);
    if (!element || element.type !== 'image') {
      console.warn('只能替換圖片元素');
      return;
    }

    setIsReplacingImage(true);
    setReplacingImageId(elementId);
    console.log('✅ 啟動替換模式:', elementId);
  }, [designElements]);

  /**
   * 取消替換模式
   */
  const cancelReplaceMode = useCallback(() => {
    setIsReplacingImage(false);
    setReplacingImageId(null);
    clearPreview();
    console.log('❌ 取消替換模式');
  }, []);

  /**
   * 執行替換
   * @param {string} newImageUrl - 新圖片的 URL
   */
  const executeReplace = useCallback((newImageUrl) => {
    if (!isReplacingImage || !replacingImageId) {
      console.warn('未處於替換模式');
      return false;
    }

    const element = designElements.find((el) => el.id === replacingImageId);
    if (!element) {
      console.error('找不到要替換的元素');
      return false;
    }

    // 只更新 URL，保持其他屬性
    updateElement(replacingImageId, { url: newImageUrl });

    console.log('✅ 圖片替換成功:', {
      elementId: replacingImageId,
      oldUrl: element.url,
      newUrl: newImageUrl,
    });

    // 替換完成後自動退出替換模式
    cancelReplaceMode();
    return true;
  }, [isReplacingImage, replacingImageId, designElements, updateElement]);

  /**
   * 設置拖曳預覽
   * @param {string} elementId - 要預覽替換的元素 ID
   * @param {string} imageUrl - 預覽的圖片 URL
   */
  const setPreview = useCallback((elementId, imageUrl) => {
    const element = designElements.find((el) => el.id === elementId);
    if (!element || element.type !== 'image') {
      return;
    }

    setPreviewReplacingId(elementId);
    setPreviewImageUrl(imageUrl);
  }, [designElements]);

  /**
   * 清除預覽
   */
  const clearPreview = useCallback(() => {
    setPreviewReplacingId(null);
    setPreviewImageUrl(null);
  }, []);

  /**
   * 獲取圖片元素的實際顯示 URL（考慮預覽狀態）
   * @param {object} element - 圖片元素
   * @returns {string} - 實際要顯示的圖片 URL
   */
  const getDisplayUrl = useCallback((element) => {
    if (element.type !== 'image') return null;

    // 如果正在預覽替換此元素，返回預覽 URL
    if (previewReplacingId === element.id && previewImageUrl) {
      return previewImageUrl;
    }

    // 否則返回原本的 URL
    return element.url;
  }, [previewReplacingId, previewImageUrl]);

  return {
    // 狀態
    isReplacingImage,
    replacingImageId,
    previewReplacingId,
    previewImageUrl,

    // 方法
    startReplaceMode,
    cancelReplaceMode,
    executeReplace,
    setPreview,
    clearPreview,
    getDisplayUrl,
  };
};

export default useImageReplace;
