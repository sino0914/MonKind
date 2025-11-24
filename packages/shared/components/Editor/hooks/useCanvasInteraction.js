import { useCallback, useState, useEffect } from 'react';
import { validatePrintArea } from '../utils/validationUtils';
import { MIN_ELEMENT_SIZE } from '../constants/editorConfig';
import { calculateMaskCenter, measureTextWidth } from '../utils/canvasUtils';

/**
 * 畫布交互邏輯 Hook
 * 處理拖曳、縮放、旋轉、圖片替換拖曳預覽
 */
const useCanvasInteraction = (editorState, currentProduct, imageReplace = null, draggingImageUrl = null, viewport = null, isFreeTransform = false, addImageToCanvas = null) => {
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

  // 記錄縮放開始時的狀態（用於文字元素縮放）
  const [resizeStartState, setResizeStartState] = useState(null);

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

      // 如果是文字元素的縮放，記錄初始狀態
      if (element.type === 'text' && handle !== 'rotate') {
        // 尋找畫布容器以獲取滑鼠座標
        let canvasContainer = e.currentTarget;
        while (canvasContainer && !canvasContainer.classList.contains('canvas-container')) {
          canvasContainer = canvasContainer.parentElement;
        }

        if (canvasContainer) {
          const canvasRect = canvasContainer.getBoundingClientRect();
          const { canvasX, canvasY } = screenToCanvasCoords(e.clientX, e.clientY, canvasRect);

          // 計算當前文字的選取框尺寸
          const textWidth = measureTextWidth(
            element.content,
            element.fontSize,
            element.fontFamily,
            element.fontWeight,
            element.fontStyle
          );
          const textHeight = element.fontSize * 1.5;

          // 計算初始滑鼠到文字中心的距離
          const deltaX = canvasX - element.x;
          const deltaY = canvasY - element.y;
          const initialMouseDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          // 計算初始對角線長度
          const initialDiagonal = Math.sqrt(textWidth * textWidth + textHeight * textHeight);

          setResizeStartState({
            initialFontSize: element.fontSize,
            initialMouseDistance: initialMouseDistance,
            initialDiagonal: initialDiagonal,
          });
        }
      }
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
        // 旋轉 - 當有遮罩時以遮罩中心為旋轉中心，否則以元素中心為旋轉中心
        const center = calculateMaskCenter(selectedElement);
        const angle = Math.atan2(currentY - center.y, currentX - center.x);
        const degrees = (angle * 180) / Math.PI + 90;

        const updates = { rotation: degrees };

        // 如果有遮罩，需要調整元素位置使遮罩中心保持固定
        if (selectedElement.hasMask && selectedElement.mask) {
          // 計算遮罩中心相對於元素中心的偏移（未旋轉時）
          const maskOffsetX = selectedElement.mask.x - selectedElement.width / 2;
          const maskOffsetY = selectedElement.mask.y - selectedElement.height / 2;

          // 計算舊的旋轉角度下的偏移
          const oldRotation = (selectedElement.rotation || 0) * Math.PI / 180;
          const oldRotatedOffsetX = maskOffsetX * Math.cos(oldRotation) - maskOffsetY * Math.sin(oldRotation);
          const oldRotatedOffsetY = maskOffsetX * Math.sin(oldRotation) + maskOffsetY * Math.cos(oldRotation);

          // 計算新的旋轉角度下的偏移
          const newRotation = degrees * Math.PI / 180;
          const newRotatedOffsetX = maskOffsetX * Math.cos(newRotation) - maskOffsetY * Math.sin(newRotation);
          const newRotatedOffsetY = maskOffsetX * Math.sin(newRotation) + maskOffsetY * Math.cos(newRotation);

          // 調整元素位置，使遮罩中心保持在原位置
          updates.x = selectedElement.x + (oldRotatedOffsetX - newRotatedOffsetX);
          updates.y = selectedElement.y + (oldRotatedOffsetY - newRotatedOffsetY);
        }

        updateElement(selectedElement.id, updates);
      } else {
        // 縮放（圖片和文字）
        if (selectedElement.type === 'image') {
          // 🔷 形狀圖片：強制保持正方形
          const isShapeImage = selectedElement.shapeClip && selectedElement.shapeClip.clipPath;
          const aspectRatio = isShapeImage ? 1 : selectedElement.width / selectedElement.height;
          let newWidth = selectedElement.width;
          let newHeight = selectedElement.height;

          // 當有遮罩時，使用遮罩中心作為縮放中心；否則使用元素中心
          const scaleCenter = selectedElement.hasMask ? calculateMaskCenter(selectedElement) : { x: selectedElement.x, y: selectedElement.y };

          // 判斷是否為自由變形模式（非等比例縮放）
          // 🔷 形狀圖片不支援自由變形，始終使用等比例縮放
          if (isFreeTransform && !isShapeImage) {
            // 非等比例縮放：獨立調整寬高
            const deltaX = currentX - scaleCenter.x;
            const deltaY = currentY - scaleCenter.y;

            if (resizeHandle === 'se') {
              newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
              newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
            } else if (resizeHandle === 'nw') {
              newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(scaleCenter.x - currentX) * 2);
              newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(scaleCenter.y - currentY) * 2);
            } else if (resizeHandle === 'ne') {
              newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
              newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(scaleCenter.y - currentY) * 2);
            } else if (resizeHandle === 'sw') {
              newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(scaleCenter.x - currentX) * 2);
              newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
            }
          } else {
            // 等比例縮放
            if (resizeHandle === 'se') {
              const deltaX = currentX - scaleCenter.x;
              const deltaY = currentY - scaleCenter.y;
              if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
                newWidth = newHeight * aspectRatio;
              }
            } else if (resizeHandle === 'nw') {
              const deltaX = scaleCenter.x - currentX;
              const deltaY = scaleCenter.y - currentY;
              if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
                newWidth = newHeight * aspectRatio;
              }
            } else if (resizeHandle === 'ne') {
              const deltaX = currentX - scaleCenter.x;
              const deltaY = scaleCenter.y - currentY;
              if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
                newWidth = newHeight * aspectRatio;
              }
            } else if (resizeHandle === 'sw') {
              const deltaX = scaleCenter.x - currentX;
              const deltaY = currentY - scaleCenter.y;
              if (Math.abs(deltaX) > Math.abs(deltaY * aspectRatio)) {
                newWidth = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaX) * 2);
                newHeight = newWidth / aspectRatio;
              } else {
                newHeight = Math.max(MIN_ELEMENT_SIZE, Math.abs(deltaY) * 2);
                newWidth = newHeight * aspectRatio;
              }
            }
          }

          // 計算縮放比例（相對於原始尺寸）
          // 獲取原始尺寸（第一次縮放時儲存）
          const originalWidth = selectedElement.originalWidth || selectedElement.width;
          const originalHeight = selectedElement.originalHeight || selectedElement.height;

          const scaleX = newWidth / originalWidth;
          const scaleY = newHeight / originalHeight;

          const updates = {
            width: newWidth,
            height: newHeight,
            scaleX: scaleX,
            scaleY: scaleY,
            originalWidth: originalWidth,
            originalHeight: originalHeight,
          };

          // 如果元素有 mask，需要調整元素位置使遮罩中心保持固定
          if (selectedElement.hasMask && selectedElement.mask) {
            const maskScaleX = newWidth / selectedElement.width;
            const maskScaleY = newHeight / selectedElement.height;

            // 縮放遮罩尺寸
            updates.mask = {
              x: selectedElement.mask.x * maskScaleX,
              y: selectedElement.mask.y * maskScaleY,
              width: selectedElement.mask.width * maskScaleX,
              height: selectedElement.mask.height * maskScaleY,
            };

            // 計算舊的遮罩中心（相對於元素中心的偏移）
            const oldMaskOffsetX = selectedElement.mask.x - selectedElement.width / 2;
            const oldMaskOffsetY = selectedElement.mask.y - selectedElement.height / 2;

            // 計算新的遮罩中心（相對於新元素中心的偏移）
            const newMaskOffsetX = updates.mask.x - newWidth / 2;
            const newMaskOffsetY = updates.mask.y - newHeight / 2;

            // 應用旋轉矩陣計算偏移差異
            const rotation = (selectedElement.rotation || 0) * Math.PI / 180;
            const oldRotatedOffsetX = oldMaskOffsetX * Math.cos(rotation) - oldMaskOffsetY * Math.sin(rotation);
            const oldRotatedOffsetY = oldMaskOffsetX * Math.sin(rotation) + oldMaskOffsetY * Math.cos(rotation);
            const newRotatedOffsetX = newMaskOffsetX * Math.cos(rotation) - newMaskOffsetY * Math.sin(rotation);
            const newRotatedOffsetY = newMaskOffsetX * Math.sin(rotation) + newMaskOffsetY * Math.cos(rotation);

            // 調整元素位置，使遮罩中心保持在原位置
            updates.x = selectedElement.x + (oldRotatedOffsetX - newRotatedOffsetX);
            updates.y = selectedElement.y + (oldRotatedOffsetY - newRotatedOffsetY);
          }

          console.log('📐 縮放資訊:', {
            原始尺寸: { width: originalWidth, height: originalHeight },
            新尺寸: { width: newWidth, height: newHeight },
            縮放比例: { scaleX: scaleX.toFixed(2), scaleY: scaleY.toFixed(2) },
            模式: isFreeTransform ? '自由變形' : '等比例',
          });

          updateElement(selectedElement.id, updates);
        } else if (selectedElement.type === 'text') {
          // 文字縮放 - 調整 fontSize
          // 使用記錄的初始狀態（如果有的話）
          if (resizeStartState) {
            // 計算當前滑鼠到文字中心的距離
            const deltaX = currentX - selectedElement.x;
            const deltaY = currentY - selectedElement.y;
            const currentMouseDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // 計算距離的變化比例（相對於初始滑鼠距離）
            const distanceRatio = currentMouseDistance / resizeStartState.initialMouseDistance;

            // 根據距離變化比例計算新的字體大小
            const MIN_FONT_SIZE = 12;
            const MAX_FONT_SIZE = 200;
            const newFontSize = Math.max(
              MIN_FONT_SIZE,
              Math.min(MAX_FONT_SIZE, resizeStartState.initialFontSize * distanceRatio)
            );

            updateElement(selectedElement.id, {
              fontSize: Math.round(newFontSize)
            });
          }
        }
      }
    }
  }, [draggedElement, resizeHandle, selectedElement, dragOffset, currentProduct, updateElement, resizeStartState]);

  // 處理滑鼠放開
  const handleMouseUp = useCallback(() => {
    endDrag();
    // 清除縮放開始狀態
    setResizeStartState(null);
  }, [endDrag]);

  // 處理畫布點擊（取消選擇）
  const handleCanvasClick = useCallback((e) => {
    console.log('🔴 畫布 onClick - 取消選取', { target: e.target.className });
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

    // 找到滑鼠懸停的圖片元素（從後往前找，跳過模板元素）
    let hoveredImageElement = null;
    for (let i = designElements.length - 1; i >= 0; i--) {
      const element = designElements[i];

      // 檢查滑鼠是否在元素上
      if (!isMouseOverElement(canvasX, canvasY, element)) continue;

      // 跳過模板元素（穿透到下層）
      if (element.isFromTemplate) {
        continue;
      }

      // 找到可替換的元素
      hoveredImageElement = element;
      break;
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

    // 找到放下位置的圖片元素（跳過模板元素）
    let targetImageElement = null;
    for (let i = designElements.length - 1; i >= 0; i--) {
      const element = designElements[i];

      // 檢查滑鼠是否在元素上
      if (!isMouseOverElement(canvasX, canvasY, element)) continue;

      // 跳過模板元素（穿透到下層）
      if (element.isFromTemplate) {
        continue;
      }

      // 找到可替換的元素
      targetImageElement = element;
      break;
    }

    if (targetImageElement && imageReplace) {
      // 替換圖片 - 直接傳入 targetId 執行替換（不需要啟動替換模式）
      imageReplace.executeReplace(draggingImageUrl, targetImageElement.id);
    } else {
      // 新增圖片到畫布 - 使用統一的新增邏輯
      if (addImageToCanvas) {
        addImageToCanvas(draggingImageUrl, { x: canvasX, y: canvasY });
      } else {
        console.warn('addImageToCanvas 函數未提供，無法新增圖片');
      }
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
