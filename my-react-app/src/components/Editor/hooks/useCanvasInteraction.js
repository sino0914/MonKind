import { useCallback, useState, useEffect } from 'react';
import { validatePrintArea } from '../utils/validationUtils';
import { MIN_ELEMENT_SIZE } from '../constants/editorConfig';

/**
 * 畫布交互邏輯 Hook
 * 處理拖曳、縮放、旋轉、圖片替換拖曳預覽
 */
const useCanvasInteraction = (editorState, currentProduct, imageReplace = null, draggingImageUrl = null, viewport = null) => {
  const {
    draggedElement,
    dragOffset,
    resizeHandle,
    selectedElement,
    copiedElement,
    designElements,
    lockedLayers,
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

  /**
   * 將螢幕座標轉換為畫布座標（考慮視圖的縮放和平移）
   * @param {number} clientX - 螢幕 X 座標
   * @param {number} clientY - 螢幕 Y 座標
   * @param {DOMRect} canvasRect - 畫布元素的 getBoundingClientRect()
   * @returns {object} - 畫布座標 { canvasX, canvasY }
   */
  const screenToCanvasCoords = useCallback((clientX, clientY, canvasRect) => {
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    // 計算相對於畫布容器的座標
    let relativeX = clientX - canvasRect.left;
    let relativeY = clientY - canvasRect.top;

    // 如果有 viewport，需要反向應用縮放和平移
    if (viewport) {
      // 先計算相對於畫布中心的位置
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      // 減去中心點
      relativeX -= centerX;
      relativeY -= centerY;

      // 反向應用平移
      relativeX -= viewport.pan.x;
      relativeY -= viewport.pan.y;

      // 反向應用縮放
      relativeX /= viewport.zoom;
      relativeY /= viewport.zoom;

      // 加回中心點
      relativeX += centerX;
      relativeY += centerY;
    }

    // 轉換為畫布座標系（400x400）
    const canvasX = (relativeX / canvasWidth) * 400;
    const canvasY = (relativeY / canvasHeight) * 400;

    return { canvasX, canvasY };
  }, [viewport]);

  // 處理滑鼠按下
  const handleMouseDown = useCallback((e, element, handle = null) => {
    // 只允許滑鼠左鍵 (button === 0) 進行操作
    // 觸控事件沒有 button 屬性，所以 e.button === undefined 時也允許
    if (e.button !== undefined && e.button !== 0) {
      return;
    }

    // 檢查圖層是否被鎖定
    if (lockedLayers.has(element.id)) {
      e.preventDefault();
      e.stopPropagation();
      // 鎖定的圖層只能選中，不能拖曳或調整
      selectElement(element);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    selectElement(element);

    if (handle) {
      setResizeHandle(handle);
      // 開始旋轉或縮放操作,暫停歷史記錄
      startResize();
    } else {
      // 尋找畫布容器 (canvas-container)
      let canvasContainer = e.currentTarget;
      while (canvasContainer && !canvasContainer.classList.contains('canvas-container')) {
        canvasContainer = canvasContainer.parentElement;
      }

      if (!canvasContainer) {
        console.error('找不到畫布容器');
        return;
      }

      const canvasRect = canvasContainer.getBoundingClientRect();

      // 使用轉換函數計算畫布座標
      const { canvasX, canvasY } = screenToCanvasCoords(e.clientX, e.clientY, canvasRect);

      // 計算拖曳偏移（元素中心到滑鼠位置的差值）
      startDrag(element.id, {
        x: canvasX - element.x,
        y: canvasY - element.y,
      });
    }
  }, [selectElement, setResizeHandle, startDrag, startResize, screenToCanvasCoords, lockedLayers]);

  // 處理滑鼠移動
  const handleMouseMove = useCallback((e) => {
    if (!draggedElement && !resizeHandle) return;

    const printArea = validatePrintArea(currentProduct?.printArea);
    const canvasRect = e.currentTarget.getBoundingClientRect();

    if (draggedElement) {
      // 拖曳元素 - 使用轉換函數計算畫布座標
      const { canvasX, canvasY } = screenToCanvasCoords(e.clientX, e.clientY, canvasRect);

      // 應用拖曳偏移
      updateElement(draggedElement, {
        x: canvasX - dragOffset.x,
        y: canvasY - dragOffset.y
      });
    } else if (resizeHandle && selectedElement) {
      // 縮放或旋轉 - 使用轉換函數計算畫布座標
      const { canvasX: currentX, canvasY: currentY } = screenToCanvasCoords(e.clientX, e.clientY, canvasRect);

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
    // 點擊畫布空白處就取消選取
    // 元素會在自己的 onClick 中 stopPropagation，所以不會執行到這裡
    clearSelection();
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

    // 使用轉換函數計算畫布座標
    const { canvasX, canvasY } = screenToCanvasCoords(e.clientX, e.clientY, canvasRect);

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
  }, [draggingImageUrl, imageReplace, designElements, isMouseOverElement, screenToCanvasCoords]);

  /**
   * 拖曳放下（用於圖片替換或新增）
   * @param {Event} e - 放下事件
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();

    if (!draggingImageUrl) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();

    // 使用轉換函數計算畫布座標
    const { canvasX, canvasY } = screenToCanvasCoords(e.clientX, e.clientY, canvasRect);

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
      // 替換圖片 - 直接傳入 targetId 執行替換（不需要啟動替換模式）
      imageReplace.executeReplace(draggingImageUrl, targetImageElement.id);
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
  }, [draggingImageUrl, imageReplace, designElements, isMouseOverElement, updateElement, editorState, screenToCanvasCoords]);

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
