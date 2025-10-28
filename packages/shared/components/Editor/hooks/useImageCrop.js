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
    const initialMask = element.mask ? {
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

    console.log('✅ 應用剪裁（蒙版模式）:', maskRect);

    // 只更新蒙版數據和 hasMask 標記
    // 圖片元素的 width, height, x, y 完全不變
    editorState.updateElement(croppingElement.id, {
      hasMask: true,
      mask: {
        x: Math.round(maskRect.x),
        y: Math.round(maskRect.y),
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
