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
   * @param {string} targetId - 可選：直接指定要替換的元素 ID（用於拖曳替換）
   */
  const executeReplace = useCallback((newImageUrl, targetId = null) => {
    // 如果有傳入 targetId，使用它；否則使用當前的 replacingImageId
    const elementId = targetId || replacingImageId;

    if (!elementId) {
      console.warn('未處於替換模式');
      return false;
    }

    const element = designElements.find((el) => el.id === elementId);
    if (!element) {
      console.error('找不到要替換的元素');
      return false;
    }

    // 載入新圖片以取得其尺寸
    const img = new Image();
    img.onload = () => {
      // 🔥 檢查是否已有剪裁：將剪裁區作為新的基準點
      if (element.hasMask && element.mask) {
        // 步驟 1：計算剪裁區在畫布上的絕對位置
        // mask.x, mask.y 是相對於元素左上角的距離
        // 需要先計算元素左上角的畫布座標，再加上 mask 偏移
        const elementLeft = element.x - element.width / 2;
        const elementTop = element.y - element.height / 2;

        // 剪裁區中心在畫布上的絕對位置
        const clipCenterX = elementLeft + element.mask.x;
        const clipCenterY = elementTop + element.mask.y;
        const clipWidth = element.mask.width;
        const clipHeight = element.mask.height;

        console.log('📐 已剪裁圖片替換 - 將元素移動到剪裁區位置:', {
          原元素位置: { x: element.x, y: element.y },
          元素左上角: { x: elementLeft, y: elementTop },
          mask相對左上角: { x: element.mask.x, y: element.mask.y },
          剪裁區畫布位置: { x: clipCenterX, y: clipCenterY },
          剪裁區尺寸: { width: clipWidth, height: clipHeight },
        });

        // 步驟 2：應用 object-fit: cover（以剪裁區為容器）
        const imageRatio = img.width / img.height;
        const clipRatio = clipWidth / clipHeight;

        let newWidth, newHeight;

        if (imageRatio === clipRatio) {
          // 比例相同：直接使用剪裁區尺寸
          newWidth = clipWidth;
          newHeight = clipHeight;
          console.log('✅ 比例完全匹配剪裁區域');
        } else if (imageRatio > clipRatio) {
          // 圖片更寬：以高度為基準放大
          newHeight = clipHeight;
          newWidth = clipHeight * imageRatio;
          console.log('📏 圖片較寬，以高度為基準放大');
        } else {
          // 圖片更高：以寬度為基準放大
          newWidth = clipWidth;
          newHeight = clipWidth / imageRatio;
          console.log('📏 圖片較高，以寬度為基準放大');
        }

        // 步驟 3：判斷是否需要剪裁（等同 hasMask=false 邏輯）
        let needsMask = false;
        let newMask = null;

        if (imageRatio !== clipRatio) {
          // 圖片比例與剪裁區不同，需要剪裁
          needsMask = true;
          newMask = {
            x: newWidth / 2,       // mask 中心相對於新元素中心
            y: newHeight / 2,
            width: clipWidth,      // 保持原剪裁區尺寸
            height: clipHeight,
          };
          console.log('✂️ 需要剪裁，創建新 mask:', newMask);
        } else {
          // 比例完全匹配，不需要剪裁
          console.log('✅ 比例匹配，移除 mask');
        }

        // 步驟 4：更新元素
        updateElement(elementId, {
          url: newImageUrl,
          x: clipCenterX,              // 移動到剪裁區位置
          y: clipCenterY,
          width: Math.round(newWidth),
          height: Math.round(newHeight),
          hasMask: needsMask,
          mask: newMask,
          // 重置縮放比例為 1（未變形狀態）
          scaleX: 1,
          scaleY: 1,
          // 記錄原始尺寸（用於日後自由拉伸）
          originalWidth: Math.round(newWidth),
          originalHeight: Math.round(newHeight),
        });

        console.log('✅ 替換已剪裁圖片（移動到剪裁區位置並重新計算）:', {
          elementId: elementId,
          oldUrl: element.url,
          newUrl: newImageUrl,
          新元素位置: { x: clipCenterX, y: clipCenterY },
          新元素尺寸: { width: Math.round(newWidth), height: Math.round(newHeight) },
          需要剪裁: needsMask,
          新剪裁區: needsMask ? newMask : '無',
        });

        // 只有在替換模式下才取消模式
        if (targetId === null) {
          cancelReplaceMode();
        }
        return; // 提前返回，不執行後續計算
      }

      // 情況 2：沒有剪裁，執行 cover 邏輯
      const containerWidth = element.width;
      const containerHeight = element.height;
      const imageRatio = img.width / img.height;
      const containerRatio = containerWidth / containerHeight;

      console.log('📐 圖片尺寸資訊:', {
        原圖尺寸: { width: img.width, height: img.height },
        容器尺寸: { width: containerWidth, height: containerHeight },
        圖片比例: imageRatio.toFixed(2),
        容器比例: containerRatio.toFixed(2),
      });

      let newWidth, newHeight;
      let needsMask = false;

      // 實現 object-fit: cover 效果
      // 根據最小邊等比例放大，使圖片完整覆蓋容器
      if (imageRatio === containerRatio) {
        // 比例相同：直接使用容器尺寸，不需要遮罩
        newWidth = containerWidth;
        newHeight = containerHeight;
        needsMask = false;
        console.log('✅ 比例完全匹配，不需要裁切');
      } else if (imageRatio > containerRatio) {
        // 圖片更寬：以高度為基準放大
        newHeight = containerHeight;
        newWidth = containerHeight * imageRatio;
        needsMask = true;
        console.log('📏 圖片較寬，以高度為基準放大');
      } else {
        // 圖片更高：以寬度為基準放大
        newWidth = containerWidth;
        newHeight = containerWidth / imageRatio;
        needsMask = true;
        console.log('📏 圖片較高，以寬度為基準放大');
      }

      // 準備更新的屬性
      const updates = {
        url: newImageUrl,
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        // 初始化縮放比例為 1（未變形狀態）
        scaleX: 1,
        scaleY: 1,
        // 記錄原始尺寸（用於日後自由拉伸）
        originalWidth: Math.round(newWidth),
        originalHeight: Math.round(newHeight),
      };

      // 如果需要遮罩（圖片比例與容器不同）
      if (needsMask) {
        updates.hasMask = true;
        updates.mask = {
          x: newWidth / 2,       // 遮罩中心 x（相對於圖片元素）
          y: newHeight / 2,      // 遮罩中心 y（相對於圖片元素）
          width: containerWidth,  // 遮罩寬度 = 原容器寬度
          height: containerHeight // 遮罩高度 = 原容器高度
        };
        console.log('✂️ 設定遮罩:', updates.mask);
      } else {
        // 比例相同，清除遮罩
        updates.hasMask = false;
        updates.mask = null;
      }

      // 更新元素
      updateElement(elementId, updates);

      console.log('✅ 圖片替換成功 (object-fit: cover):', {
        elementId: elementId,
        oldUrl: element.url,
        newUrl: newImageUrl,
        新尺寸: { width: newWidth, height: newHeight },
        需要遮罩: needsMask,
      });

      // 替換完成後自動退出替換模式（只有在替換模式下才取消）
      if (targetId === null) {
        cancelReplaceMode();
      }
    };

    img.onerror = () => {
      console.error('❌ 無法載入新圖片:', newImageUrl);
      // 只有在替換模式下才取消模式
      if (targetId === null) {
        cancelReplaceMode();
      }
    };

    img.src = newImageUrl;
    return true;
  }, [isReplacingImage, replacingImageId, designElements, updateElement, cancelReplaceMode]);

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
