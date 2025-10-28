import { useState, useCallback } from 'react';

/**
 * 圖片編輯模式 Hook
 * 處理圖片的內部移動和縮放（類似 Canva）
 */
const useImageEdit = (editorState) => {
  const { designElements, updateElement } = editorState;

  // 編輯模式狀態
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editingImageId, setEditingImageId] = useState(null);

  // 拖曳狀態
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  /**
   * 啟動圖片編輯模式
   * @param {string} elementId - 要編輯的圖片元素 ID
   */
  const startEditMode = useCallback((elementId) => {
    const element = designElements.find((el) => el.id === elementId);
    if (!element || element.type !== 'image') {
      console.warn('只能編輯圖片元素');
      return;
    }

    setIsEditingImage(true);
    setEditingImageId(elementId);
    console.log('✅ 啟動圖片編輯模式:', elementId);
  }, [designElements]);

  /**
   * 退出圖片編輯模式
   */
  const exitEditMode = useCallback(() => {
    setIsEditingImage(false);
    setEditingImageId(null);
    setIsDragging(false);
    setDragStart(null);
    console.log('❌ 退出圖片編輯模式');
  }, []);

  /**
   * 處理鼠標按下（開始拖曳）
   * @param {Event} e - 鼠標事件
   */
  const handleMouseDown = useCallback((e) => {
    if (!isEditingImage || !editingImageId) return;

    const element = designElements.find((el) => el.id === editingImageId);
    if (!element) return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: element.imageContent?.offsetX || 0,
      offsetY: element.imageContent?.offsetY || 0,
    });
  }, [isEditingImage, editingImageId, designElements]);

  /**
   * 處理鼠標移動（拖曳圖片）
   * @param {Event} e - 鼠標事件
   */
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart || !editingImageId) return;

    const element = designElements.find((el) => el.id === editingImageId);
    if (!element) return;

    // 計算鼠標移動距離
    const dx = e.clientX - dragStart.mouseX;
    const dy = e.clientY - dragStart.mouseY;

    // 更新圖片偏移
    const newOffsetX = dragStart.offsetX + dx;
    const newOffsetY = dragStart.offsetY + dy;

    updateElement(editingImageId, {
      imageContent: {
        ...element.imageContent,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      }
    });
  }, [isDragging, dragStart, editingImageId, designElements, updateElement]);

  /**
   * 處理鼠標釋放（結束拖曳）
   */
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
    }
  }, [isDragging]);

  /**
   * 處理滾輪縮放
   * @param {Event} e - 滾輪事件
   */
  const handleWheel = useCallback((e) => {
    if (!isEditingImage || !editingImageId) return;

    const element = designElements.find((el) => el.id === editingImageId);
    if (!element) return;

    e.preventDefault();
    e.stopPropagation();

    // 計算縮放增量（每次滾動 0.1）
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const currentScale = element.imageContent?.scale || 1;
    const newScale = Math.max(0.1, Math.min(5, currentScale + delta)); // 限制在 0.1 - 5 之間

    updateElement(editingImageId, {
      imageContent: {
        ...element.imageContent,
        scale: newScale,
      }
    });

    console.log('🔍 圖片縮放:', { from: currentScale, to: newScale });
  }, [isEditingImage, editingImageId, designElements, updateElement]);

  /**
   * 重置圖片位置和縮放
   */
  const resetImage = useCallback(() => {
    if (!editingImageId) return;

    const element = designElements.find((el) => el.id === editingImageId);
    if (!element) return;

    updateElement(editingImageId, {
      imageContent: {
        ...element.imageContent,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      }
    });

    console.log('🔄 重置圖片位置和縮放');
  }, [editingImageId, designElements, updateElement]);

  /**
   * 自動填滿容器（cover 模式）
   */
  const fitToContainer = useCallback(async () => {
    if (!editingImageId) return;

    const element = designElements.find((el) => el.id === editingImageId);
    if (!element || !element.imageContent) return;

    // 載入圖片獲取原始尺寸
    const img = new Image();
    img.src = element.imageContent.url;

    await new Promise((resolve) => {
      img.onload = () => {
        const imageRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = element.width / element.height;

        // 計算 cover 模式的縮放比例
        let scale;
        if (imageRatio > containerRatio) {
          // 圖片更寬，以高度為基準
          scale = element.height / img.naturalHeight;
        } else {
          // 圖片更高或相等，以寬度為基準
          scale = element.width / img.naturalWidth;
        }

        updateElement(editingImageId, {
          imageContent: {
            ...element.imageContent,
            scale: scale,
            offsetX: 0,
            offsetY: 0,
          }
        });

        console.log('📐 自動填滿容器:', { scale });
        resolve();
      };

      img.onerror = () => {
        console.error('載入圖片失敗');
        resolve();
      };
    });
  }, [editingImageId, designElements, updateElement]);

  return {
    // 狀態
    isEditingImage,
    editingImageId,
    isDragging,

    // 方法
    startEditMode,
    exitEditMode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    resetImage,
    fitToContainer,
  };
};

export default useImageEdit;
