import { useState, useCallback } from 'react';

/**
 * 形狀圖片調整 Hook
 * 處理形狀圖片內的圖片位置調整（平移）
 */
const useShapeAdjust = (editorState) => {
  // 正在調整的形狀圖片元素
  const [adjustingElement, setAdjustingElement] = useState(null);

  // 當前的圖片偏移（調整過程中的暫時值）
  const [currentOffset, setCurrentOffset] = useState({ x: 0, y: 0 });

  /**
   * 開始調整形狀圖片
   * @param {Object} element - 要調整的形狀圖片元素
   */
  const startAdjust = useCallback((element) => {
    if (!element || element.type !== 'image') {
      console.warn('只能調整圖片元素');
      return false;
    }

    // 確認是形狀圖片
    if (!element.shapeClip || !element.shapeClip.clipPath) {
      console.warn('此圖片不是形狀圖片，無法使用形狀調整');
      return false;
    }

    console.log('🔷 開始調整形狀圖片:', element.id);

    setAdjustingElement(element);
    // 初始化偏移為當前值
    setCurrentOffset(element.shapeClip.imageOffset || { x: 0, y: 0 });

    return true;
  }, []);

  /**
   * 更新圖片偏移
   * @param {Object} newOffset - 新的偏移 { x, y }
   */
  const updateOffset = useCallback((newOffset) => {
    if (!adjustingElement) return;

    // 計算可移動範圍（基於圖片比例）
    const imageRatio = adjustingElement.shapeClip.originalImageRatio || 1;
    const containerSize = adjustingElement.width;

    // 計算圖片實際尺寸（object-fit: cover 後）
    let imageWidth, imageHeight;
    if (imageRatio >= 1) {
      // 圖片較寬：高度 = containerSize，寬度 = containerSize * ratio
      imageHeight = containerSize;
      imageWidth = containerSize * imageRatio;
    } else {
      // 圖片較高：寬度 = containerSize，高度 = containerSize / ratio
      imageWidth = containerSize;
      imageHeight = containerSize / imageRatio;
    }

    // 計算最大可偏移量（圖片超出容器的部分 / 2）
    const maxOffsetX = Math.max(0, (imageWidth - containerSize) / 2);
    const maxOffsetY = Math.max(0, (imageHeight - containerSize) / 2);

    // 限制偏移範圍
    const clampedOffset = {
      x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffset.x)),
      y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffset.y)),
    };

    setCurrentOffset(clampedOffset);
  }, [adjustingElement]);

  /**
   * 取消調整
   */
  const cancelAdjust = useCallback(() => {
    console.log('❌ 取消形狀調整');
    setAdjustingElement(null);
    setCurrentOffset({ x: 0, y: 0 });
  }, []);

  /**
   * 應用調整
   */
  const applyAdjust = useCallback(() => {
    if (!adjustingElement) return;

    console.log('✅ 應用形狀調整:', {
      elementId: adjustingElement.id,
      newOffset: currentOffset,
    });

    // 更新元素
    editorState.updateElement(adjustingElement.id, {
      shapeClip: {
        ...adjustingElement.shapeClip,
        imageOffset: currentOffset,
      },
    });

    // 清空狀態
    setAdjustingElement(null);
    setCurrentOffset({ x: 0, y: 0 });
  }, [adjustingElement, currentOffset, editorState]);

  /**
   * 重置偏移為中心
   */
  const resetOffset = useCallback(() => {
    if (!adjustingElement) return;

    console.log('🔄 重置形狀圖片偏移');
    setCurrentOffset({ x: 0, y: 0 });
  }, [adjustingElement]);

  return {
    // 狀態
    adjustingElement,
    currentOffset,
    isAdjusting: !!adjustingElement,

    // 方法
    startAdjust,
    updateOffset,
    applyAdjust,
    cancelAdjust,
    resetOffset,
  };
};

export default useShapeAdjust;
