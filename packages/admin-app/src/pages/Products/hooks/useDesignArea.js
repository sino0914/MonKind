import { useState, useCallback } from 'react';
import { validatePrintArea, validateBleedArea } from '../utils/validationHelpers';

/**
 * useDesignArea Hook
 * 管理設計區域和出血區域的狀態
 */
export const useDesignArea = (initialPrintArea = null, initialBleedArea = null) => {
  // 設計區域狀態
  const [tempPrintArea, setTempPrintArea] = useState(
    initialPrintArea || { x: 50, y: 50, width: 200, height: 150 }
  );

  // 出血區域狀態
  const [tempBleedArea, setTempBleedArea] = useState(initialBleedArea);
  const [bleedMode, setBleedMode] = useState(
    initialBleedArea?.mode || 'uniform'
  );

  // 拖曳狀態
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'move', 'resize'
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  /**
   * 更新設計區域
   */
  const updatePrintArea = useCallback((updates) => {
    setTempPrintArea((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * 重置設計區域
   */
  const resetPrintArea = useCallback((printArea) => {
    setTempPrintArea(printArea || { x: 50, y: 50, width: 200, height: 150 });
  }, []);

  /**
   * 驗證設計區域
   */
  const validateDesignArea = useCallback(() => {
    const printAreaValidation = validatePrintArea(tempPrintArea);
    if (!printAreaValidation.valid) {
      return printAreaValidation;
    }

    const bleedAreaValidation = validateBleedArea(tempBleedArea, tempPrintArea);
    if (!bleedAreaValidation.valid) {
      return bleedAreaValidation;
    }

    return { valid: true };
  }, [tempPrintArea, tempBleedArea]);

  /**
   * 啟用出血區域
   */
  const enableBleedArea = useCallback(() => {
    setTempBleedArea({ mode: 'uniform', value: 3 });
    setBleedMode('uniform');
  }, []);

  /**
   * 停用出血區域
   */
  const disableBleedArea = useCallback(() => {
    setTempBleedArea(null);
  }, []);

  /**
   * 切換出血區域模式
   */
  const toggleBleedMode = useCallback((mode) => {
    setBleedMode(mode);

    setTempBleedArea((prev) => {
      if (!prev) return null;

      if (mode === 'uniform') {
        // 切換到統一模式，使用平均值
        const avgValue = prev.mode === 'separate'
          ? Math.round(((prev.top || 0) + (prev.right || 0) + (prev.bottom || 0) + (prev.left || 0)) / 4)
          : (prev.value || 3);
        return { mode: 'uniform', value: avgValue };
      } else {
        // 切換到分別設定模式
        const uniformValue = prev.value || 3;
        return {
          mode: 'separate',
          top: uniformValue,
          right: uniformValue,
          bottom: uniformValue,
          left: uniformValue,
        };
      }
    });
  }, []);

  /**
   * 更新出血區域數值
   */
  const updateBleedArea = useCallback((updates) => {
    setTempBleedArea((prev) => {
      if (!prev) return null;
      return { ...prev, ...updates };
    });
  }, []);

  /**
   * 重置出血區域
   */
  const resetBleedArea = useCallback((bleedArea) => {
    setTempBleedArea(bleedArea ? { ...bleedArea } : null);
    setBleedMode(bleedArea?.mode || 'uniform');
  }, []);

  /**
   * 開始拖曳
   */
  const startDrag = useCallback((type, startPos) => {
    setIsDragging(true);
    setDragType(type);
    setDragStart(startPos);
  }, []);

  /**
   * 停止拖曳
   */
  const stopDrag = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  /**
   * 處理拖曳移動
   */
  const handleDragMove = useCallback((currentPos, canvasSize = 400) => {
    if (!isDragging) return;

    const dx = currentPos.x - dragStart.x;
    const dy = currentPos.y - dragStart.y;

    if (dragType === 'move') {
      setTempPrintArea((prev) => {
        const newX = Math.max(0, Math.min(canvasSize - prev.width, prev.x + dx));
        const newY = Math.max(0, Math.min(canvasSize - prev.height, prev.y + dy));
        return { ...prev, x: newX, y: newY };
      });
    } else if (dragType === 'resize') {
      setTempPrintArea((prev) => {
        const newWidth = Math.max(20, Math.min(canvasSize - prev.x, prev.width + dx));
        const newHeight = Math.max(20, Math.min(canvasSize - prev.y, prev.height + dy));
        return { ...prev, width: newWidth, height: newHeight };
      });
    }

    setDragStart(currentPos);
  }, [isDragging, dragType, dragStart]);

  return {
    // 設計區域狀態
    tempPrintArea,
    setTempPrintArea,
    updatePrintArea,
    resetPrintArea,

    // 出血區域狀態
    tempBleedArea,
    bleedMode,
    enableBleedArea,
    disableBleedArea,
    toggleBleedMode,
    updateBleedArea,
    resetBleedArea,

    // 拖曳狀態
    isDragging,
    dragType,
    startDrag,
    stopDrag,
    handleDragMove,

    // 驗證
    validateDesignArea,
  };
};
