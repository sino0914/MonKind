import { useCallback, useState, useEffect } from 'react';
import { validatePrintArea } from '../utils/validationUtils';
import { MIN_ELEMENT_SIZE } from '../constants/editorConfig';

/**
 * 畫布交互邏輯 Hook
 * 處理拖曳、縮放、旋轉、圖片替換拖曳預覽
 */
const useCanvasInteraction = (editorState, currentProduct, imageReplace = null, draggingImageUrl = null) => {
  const {
    draggedElement,
    dragOffset,
    resizeHandle,
    selectedElement,
    copiedElement,
    designElements,
    setResizeHandle,
    updateElement,
    startDrag,
    endDrag,
    startResize,
    selectElement,
    clearSelection,
    copyElement,
    pasteElement,
  } = editorState;

  // 追蹤是否懸停在圖片元素上
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  // 處理滑鼠按下
  const handleMouseDown = useCallback((e, element, handle = null) => {
    e.preventDefault();
    e.stopPropagation();

    selectElement(element);

    if (handle) {
      setResizeHandle(handle);
      // 開始旋轉或縮放操作，暫停歷史記錄
      startResize();
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      startDrag(element.id, {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    }
  }, [selectElement, setResizeHandle, startDrag, startResize]);

  // 處理滑鼠移動
  const handleMouseMove = useCallback((e) => {
    if (!draggedElement && !resizeHandle) return;

    const printArea = validatePrintArea(currentProduct?.printArea);
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    if (draggedElement) {
      // 拖曳元素
      const relativeX = e.clientX - canvasRect.left - dragOffset.x;
      const relativeY = e.clientY - canvasRect.top - dragOffset.y;

      const canvasX = (relativeX / canvasWidth) * 400;
      const canvasY = (relativeY / canvasHeight) * 400;

      updateElement(draggedElement, { x: canvasX, y: canvasY });
    } else if (resizeHandle && selectedElement) {
      // 縮放或旋轉
      const currentX = ((e.clientX - canvasRect.left) / canvasWidth) * 400;
      const currentY = ((e.clientY - canvasRect.top) / canvasHeight) * 400;

      if (resizeHandle === 'rotate') {
        // 旋轉
        const centerX = selectedElement.x;
        const centerY = selectedElement.y;
        const angle = Math.atan2(currentY - centerY, currentX - centerX);
        const degrees = (angle * 180) / Math.PI + 90;
        updateElement(selectedElement.id, { rotation: degrees });
      } else {
        // 縮放（僅圖片）
        if (selectedElement.type === 'image') {
          const aspectRatio = selectedElement.width / selectedElement.height;
          let newWidth = selectedElement.width;
          let newHeight = selectedElement.height;

          if (resizeHandle === 'se') {
            const deltaX = currentX - selectedElement.x;
            const deltaY = currentY - selectedElement.y;
            if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
              newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
              newHeight = newWidth / aspectRatio;
            } else {
              newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
              newWidth = newHeight * aspectRatio;
            }
          } else if (resizeHandle === 'nw') {
            const deltaX = selectedElement.x - currentX;
            const deltaY = selectedElement.y - currentY;
            if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
              newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
              newHeight = newWidth / aspectRatio;
            } else {
              newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
              newWidth = newHeight * aspectRatio;
            }
          } else if (resizeHandle === 'ne') {
            const deltaX = currentX - selectedElement.x;
            const deltaY = selectedElement.y - currentY;
            if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
              newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
              newHeight = newWidth / aspectRatio;
            } else {
              newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
              newWidth = newHeight * aspectRatio;
            }
          } else if (resizeHandle === 'sw') {
            const deltaX = selectedElement.x - currentX;
            const deltaY = currentY - selectedElement.y;
            if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
              newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
              newHeight = newWidth / aspectRatio;
            } else {
              newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
              newWidth = newHeight * aspectRatio;
            }
          }

          updateElement(selectedElement.id, {
            width: newWidth,
            height: newHeight,
          });
        }
      }
    }
  }, [draggedElement, resizeHandle, selectedElement, dragOffset, currentProduct, updateElement]);

  // 處理滑鼠放開
  const handleMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // 處理畫布點擊（取消選擇）
  const handleCanvasClick = useCallback((e) => {
    if (
      e.target.classList.contains('canvas-container') ||
      e.target.classList.contains('w-96') ||
      e.target.classList.contains('h-96')
    ) {
      clearSelection();
    }
  }, [clearSelection]);

  // 複製元素
  const handleCopyElement = useCallback(() => {
    copyElement();
  }, [copyElement]);

  // 貼上元素
  const handlePasteElement = useCallback(() => {
    pasteElement();
  }, [pasteElement]);

  // 複製並貼上元素（工具列按鈕使用）
  const handleCopyAndPaste = useCallback(() => {
    if (selectedElement) {
      const newElement = {
        ...selectedElement,
        id: Date.now(),
        x: selectedElement.x + 20,
        y: selectedElement.y + 20,
      };
      editorState.addElement(newElement);
      editorState.selectElement(newElement);
    }
  }, [selectedElement, editorState]);

  /**
   * 檢測滑鼠位置是否在圖片元素內（考慮旋轉）
   * @param {number} mouseX - 滑鼠 X 座標（畫布座標系）
   * @param {number} mouseY - 滑鼠 Y 座標（畫布座標系）
   * @param {object} element - 圖片元素
   * @returns {boolean} - 是否在元素內
   */
  const isMouseOverElement = useCallback((mouseX, mouseY, element) => {
    if (element.type !== 'image') return false;

    const { x, y, width, height, rotation = 0 } = element;

    // 將滑鼠座標轉換到元素的本地座標系（考慮旋轉）
    const rad = (-rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = mouseX - x;
    const dy = mouseY - y;

    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    // 檢查是否在邊界框內
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return (
      localX >= -halfWidth &&
      localX <= halfWidth &&
      localY >= -halfHeight &&
      localY <= halfHeight
    );
  }, []);

  /**
   * 拖曳懸停檢測（用於圖片替換預覽）
   * @param {Event} e - 拖曳事件
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();

    // 如果沒有拖曳圖片，直接返回
    if (!draggingImageUrl) {
      setIsHoveringImage(false);
      return;
    }

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    const relativeX = e.clientX - canvasRect.left;
    const relativeY = e.clientY - canvasRect.top;

    const canvasX = (relativeX / canvasWidth) * 400;
    const canvasY = (relativeY / canvasHeight) * 400;

    // 找到滑鼠懸停的圖片元素（從後往前找，優先選擇 z-index 較高的）
    let hoveredImageElement = null;
    for (let i = designElements.length - 1; i >= 0; i--) {
      const element = designElements[i];
      if (isMouseOverElement(canvasX, canvasY, element)) {
        hoveredImageElement = element;
        break;
      }
    }

    if (hoveredImageElement) {
      // 設置預覽
      if (imageReplace) {
        imageReplace.setPreview(hoveredImageElement.id, draggingImageUrl);
      }
      setIsHoveringImage(true);
    } else {
      // 清除預覽
      if (imageReplace) {
        imageReplace.clearPreview();
      }
      setIsHoveringImage(false);
    }
  }, [draggingImageUrl, imageReplace, designElements, isMouseOverElement]);

  /**
   * 拖曳放下（用於圖片替換或新增）
   * @param {Event} e - 放下事件
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();

    if (!draggingImageUrl) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    const relativeX = e.clientX - canvasRect.left;
    const relativeY = e.clientY - canvasRect.top;

    const canvasX = (relativeX / canvasWidth) * 400;
    const canvasY = (relativeY / canvasHeight) * 400;

    // 找到放下位置的圖片元素
    let targetImageElement = null;
    for (let i = designElements.length - 1; i >= 0; i--) {
      const element = designElements[i];
      if (isMouseOverElement(canvasX, canvasY, element)) {
        targetImageElement = element;
        break;
      }
    }

    if (targetImageElement && imageReplace) {
      // 替換圖片
      updateElement(targetImageElement.id, { url: draggingImageUrl });
    } else {
      // 新增圖片到畫布
      editorState.addElement({
        id: `image-${Date.now()}`,
        type: 'image',
        url: draggingImageUrl,
        width: 100,
        height: 100,
        x: canvasX,
        y: canvasY,
        rotation: 0,
        opacity: 1,
      });
    }

    // 清除預覽
    if (imageReplace) {
      imageReplace.clearPreview();
    }
    setIsHoveringImage(false);
  }, [draggingImageUrl, imageReplace, designElements, isMouseOverElement, updateElement, editorState]);

  // 當拖曳結束時重置懸停狀態
  useEffect(() => {
    if (!draggingImageUrl) {
      setIsHoveringImage(false);
    }
  }, [draggingImageUrl]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handleCopyElement,
    handlePasteElement,
    handleCopyAndPaste,
    handleDragOver,
    handleDrop,
    copiedElement,
    draggedElement,
    isHoveringImage,
  };
};

export default useCanvasInteraction;
