import { useCallback } from 'react';
import { validatePrintArea } from '../utils/validationUtils';
import { MIN_ELEMENT_SIZE } from '../constants/editorConfig';

/**
 * 畫布交互邏輯 Hook
 * 處理拖曳、縮放、旋轉
 */
const useCanvasInteraction = (editorState, currentProduct) => {
  const {
    draggedElement,
    dragOffset,
    resizeHandle,
    selectedElement,
    copiedElement,
    setResizeHandle,
    updateElement,
    startDrag,
    endDrag,
    selectElement,
    clearSelection,
    copyElement,
    pasteElement,
  } = editorState;

  // 處理滑鼠按下
  const handleMouseDown = useCallback((e, element, handle = null) => {
    e.preventDefault();
    e.stopPropagation();

    selectElement(element);

    if (handle) {
      setResizeHandle(handle);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      startDrag(element.id, {
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
    }
  }, [selectElement, setResizeHandle, startDrag]);

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

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCanvasClick,
    handleCopyElement,
    handlePasteElement,
    handleCopyAndPaste,
    copiedElement,
    draggedElement,
  };
};

export default useCanvasInteraction;
