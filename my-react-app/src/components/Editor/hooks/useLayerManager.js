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
    setHiddenLayers
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

  return {
    toggleLayerVisibility,
    moveLayerUp,
    moveLayerDown,
    moveLayerToTop,
    moveLayerToBottom,
  };
};

export default useLayerManager;
