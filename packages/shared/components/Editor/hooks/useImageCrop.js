import { useState, useCallback } from 'react';

/**
 * 圖片剪裁 Hook（蒙版模式）
 * 使用蒙版來控制圖片顯示區域，不改變圖片元素本身的尺寸和位置
 */
const useImageCrop = (editorState) => {
  // 正在剪裁的元素
  const [croppingElement, setCroppingElement] = useState(null);

  // 蒙版數據（相對於圖片元素的座標）
  const [maskRect, setMaskRect] = useState(null);

  /**
   * 開始剪裁
   * @param {Object} element - 要剪裁的圖片元素
   */
  const startCrop = useCallback((element) => {
    if (!element || element.type !== 'image') {
      console.warn('只能剪裁圖片元素');
      return;
    }

    console.log('✂️ 開始剪裁圖片:', element.id);

    setCroppingElement(element);

    // 初始化蒙版：
    // 如果已有蒙版，則使用現有的；否則初始化為圖片中心，寬高等於圖片尺寸
    let initialMask = element.mask ? {
      x: element.mask.x,
      y: element.mask.y,
      width: element.mask.width,
      height: element.mask.height
    } : {
      x: element.width / 2,  // 中心點 x (50%)
      y: element.height / 2, // 中心點 y (50%)
      width: element.width,  // 寬度 = 圖片寬度
      height: element.height // 高度 = 圖片高度
    };

    // 確保蒙版尺寸不超過元素尺寸
    if (initialMask.width > element.width) {
      initialMask.width = element.width;
    }
    if (initialMask.height > element.height) {
      initialMask.height = element.height;
    }

    // 確保蒙版中心點在合法範圍內
    initialMask.x = Math.max(
      initialMask.width / 2,
      Math.min(element.width - initialMask.width / 2, initialMask.x)
    );
    initialMask.y = Math.max(
      initialMask.height / 2,
      Math.min(element.height - initialMask.height / 2, initialMask.y)
    );

    setMaskRect(initialMask);
  }, [editorState]);

  /**
   * 更新蒙版
   * @param {Object} newRect - 新的蒙版數據 {x, y, width, height}
   */
  const updateMaskRect = useCallback((newRect) => {
    setMaskRect(newRect);
  }, []);

  /**
   * 取消剪裁
   */
  const cancelCrop = useCallback(() => {
    console.log('❌ 取消剪裁');
    setCroppingElement(null);
    setMaskRect(null);
  }, []);

  /**
   * 應用剪裁（蒙版模式）
   * 只保存蒙版數據，不改變圖片元素的尺寸和位置
   */
  const applyCrop = useCallback(() => {
    if (!croppingElement || !maskRect) return;

    // 獲取當前元素的最新狀態
    const currentElement = editorState.designElements.find(el => el.id === croppingElement.id);
    if (!currentElement) {
      console.error('找不到元素:', croppingElement.id);
      return;
    }

    // 計算剪裁框在畫布上的絕對位置（開始剪裁時的位置）
    const originalElementLeft = croppingElement.x - croppingElement.width / 2;
    const originalElementTop = croppingElement.y - croppingElement.height / 2;
    const cropBoxCanvasX = originalElementLeft + maskRect.x - maskRect.width / 2;
    const cropBoxCanvasY = originalElementTop + maskRect.y - maskRect.height / 2;

    // 計算剪裁框中心點在畫布上的絕對位置
    const cropBoxCenterCanvasX = cropBoxCanvasX + maskRect.width / 2;
    const cropBoxCenterCanvasY = cropBoxCanvasY + maskRect.height / 2;

    // 計算當前元素左上角的位置
    const currentElementLeft = currentElement.x - currentElement.width / 2;
    const currentElementTop = currentElement.y - currentElement.height / 2;

    // 計算剪裁框中心相對於當前元素的位置
    const newMaskX = cropBoxCenterCanvasX - currentElementLeft;
    const newMaskY = cropBoxCenterCanvasY - currentElementTop;

    console.log('✅ 應用剪裁（蒙版模式）');
    console.log('  - 剪裁框畫布位置:', { x: cropBoxCanvasX, y: cropBoxCanvasY });
    console.log('  - 當前元素位置:', { x: currentElement.x, y: currentElement.y });
    console.log('  - 計算後的蒙版位置:', { x: newMaskX, y: newMaskY });

    // 只更新蒙版數據和 hasMask 標記
    // 圖片元素的 width, height, x, y 完全不變
    editorState.updateElement(croppingElement.id, {
      hasMask: true,
      mask: {
        x: Math.round(newMaskX),
        y: Math.round(newMaskY),
        width: Math.round(maskRect.width),
        height: Math.round(maskRect.height)
      }
    });

    // 退出剪裁模式
    cancelCrop();
  }, [croppingElement, maskRect, editorState, cancelCrop]);

  /**
   * 重置剪裁（移除蒙版數據）
   */
  const resetCrop = useCallback(() => {
    if (!croppingElement) return;

    console.log('🔄 重置剪裁');
    editorState.updateElement(croppingElement.id, {
      hasMask: false,
      mask: null
    });

    cancelCrop();
  }, [croppingElement, editorState, cancelCrop]);

  return {
    // 狀態
    croppingElement,
    maskRect,
    isCropping: !!croppingElement,

    // 方法
    startCrop,
    updateMaskRect,
    applyCrop,
    cancelCrop,
    resetCrop
  };
};

export default useImageCrop;
