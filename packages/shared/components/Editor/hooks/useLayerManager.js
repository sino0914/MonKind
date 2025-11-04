import { useCallback } from 'react';

/**
 * 圖層管理 Hook
 * 處理圖層的顯示/隱藏、排序、移動等操作
 */
const useLayerManager = (editorState) => {
  const {
    designElements,
    setDesignElements,
    hiddenLayers,
    setHiddenLayers,
    lockedLayers,
    setLockedLayers,
    updateElement
  } = editorState;

  /**
   * 切換圖層顯示/隱藏
   * @param {string} elementId - 元素 ID
   */
  const toggleLayerVisibility = useCallback((elementId) => {
    setHiddenLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        // 如果已隱藏，則顯示
        newSet.delete(elementId);
      } else {
        // 如果已顯示，則隱藏
        newSet.add(elementId);
      }
      return newSet;
    });
  }, [setHiddenLayers]);

  /**
   * 向上移動圖層（增加 z-index）
   * @param {string} elementId - 元素 ID
   */
  const moveLayerUp = useCallback((elementId) => {
    const currentIndex = designElements.findIndex(el => el.id === elementId);

    // 如果已經是最上層，則不處理
    if (currentIndex === designElements.length - 1) return;

    const newElements = [...designElements];
    // 與上一個元素交換位置
    [newElements[currentIndex], newElements[currentIndex + 1]] =
    [newElements[currentIndex + 1], newElements[currentIndex]];

    setDesignElements(newElements);
  }, [designElements, setDesignElements]);

  /**
   * 向下移動圖層（減少 z-index）
   * @param {string} elementId - 元素 ID
   */
  const moveLayerDown = useCallback((elementId) => {
    const currentIndex = designElements.findIndex(el => el.id === elementId);

    // 如果已經是最下層，則不處理
    if (currentIndex === 0) return;

    const newElements = [...designElements];
    // 與下一個元素交換位置
    [newElements[currentIndex], newElements[currentIndex - 1]] =
    [newElements[currentIndex - 1], newElements[currentIndex]];

    setDesignElements(newElements);
  }, [designElements, setDesignElements]);

  /**
   * 移到最上層
   * @param {string} elementId - 元素 ID
   */
  const moveLayerToTop = useCallback((elementId) => {
    const currentIndex = designElements.findIndex(el => el.id === elementId);

    // 如果已經是最上層，則不處理
    if (currentIndex === designElements.length - 1) return;

    const newElements = [...designElements];
    const [element] = newElements.splice(currentIndex, 1);
    newElements.push(element);

    setDesignElements(newElements);
  }, [designElements, setDesignElements]);

  /**
   * 移到最下層
   * @param {string} elementId - 元素 ID
   */
  const moveLayerToBottom = useCallback((elementId) => {
    const currentIndex = designElements.findIndex(el => el.id === elementId);

    // 如果已經是最下層，則不處理
    if (currentIndex === 0) return;

    const newElements = [...designElements];
    const [element] = newElements.splice(currentIndex, 1);
    newElements.unshift(element);

    setDesignElements(newElements);
  }, [designElements, setDesignElements]);

  /**
   * 重新命名圖層
   * @param {string} elementId - 元素 ID
   * @param {string} newName - 新名稱
   */
  const renameLayer = useCallback((elementId, newName) => {
    updateElement(elementId, { layerName: newName });
  }, [updateElement]);

  /**
   * 切換圖層鎖定狀態
   * @param {string} elementId - 元素 ID
   */
  const toggleLayerLock = useCallback((elementId) => {
    setLockedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        // 如果已鎖定，則解鎖
        newSet.delete(elementId);
      } else {
        // 如果未鎖定，則鎖定
        newSet.add(elementId);
      }
      return newSet;
    });
  }, [setLockedLayers]);

  /**
   * 重新排序圖層（拖曳排序）
   * @param {string} draggedId - 被拖曳的元素 ID
   * @param {string} targetId - 目標位置的元素 ID
   */
  const reorderLayers = useCallback((draggedId, targetId) => {
    if (draggedId === targetId) return;

    const draggedIndex = designElements.findIndex(el => el.id === draggedId);
    const targetIndex = designElements.findIndex(el => el.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newElements = [...designElements];
    // 移除被拖曳的元素
    const [draggedElement] = newElements.splice(draggedIndex, 1);
    // 插入到目標位置
    newElements.splice(targetIndex, 0, draggedElement);

    setDesignElements(newElements);
    console.log('🔄 圖層已重新排序:', { draggedId, targetId });
  }, [designElements, setDesignElements]);

  return {
    toggleLayerVisibility,
    moveLayerUp,
    moveLayerDown,
    moveLayerToTop,
    moveLayerToBottom,
    renameLayer,
    toggleLayerLock,
    reorderLayers,
  };
};

export default useLayerManager;
