import { useCallback } from 'react';
import { MIN_FONT_SIZE, MAX_FONT_SIZE } from '../constants/editorConfig';
import { measureTextWidth as measureText } from '../utils/canvasUtils';

/**
 * 文字編輯 Hook
 * 處理文字元素的編輯功能
 */
const useTextEditor = (editorState) => {
  const {
    selectedElement,
    editingText,
    setEditingText,
    editingContent,
    setEditingContent,
    updateElement
  } = editorState;

  /**
   * 開始編輯文字
   * @param {Object} element - 要編輯的文字元素
   */
  const handleStartTextEdit = useCallback((element) => {
    if (!element || element.type !== 'text') return;

    setEditingText(element.id);
    setEditingContent(element.content || '');
  }, [setEditingText, setEditingContent]);

  /**
   * 完成編輯文字
   */
  const handleFinishTextEdit = useCallback(() => {
    if (!editingText) return;

    // 更新元素內容
    updateElement(editingText, { content: editingContent });

    // 重置編輯狀態
    setEditingText(null);
    setEditingContent('');
  }, [editingText, editingContent, updateElement, setEditingText, setEditingContent]);

  /**
   * 切換粗體
   */
  const handleToggleBold = useCallback(() => {
    if (!selectedElement || selectedElement.type !== 'text') return;

    const currentBold = selectedElement.fontWeight === 'bold';
    updateElement(selectedElement.id, {
      fontWeight: currentBold ? 'normal' : 'bold'
    });
  }, [selectedElement, updateElement]);

  /**
   * 切換斜體
   */
  const handleToggleItalic = useCallback(() => {
    if (!selectedElement || selectedElement.type !== 'text') return;

    const currentItalic = selectedElement.fontStyle === 'italic';
    updateElement(selectedElement.id, {
      fontStyle: currentItalic ? 'normal' : 'italic'
    });
  }, [selectedElement, updateElement]);

  /**
   * 調整字體大小
   * @param {number} delta - 字體大小變化量
   */
  const handleFontSizeChange = useCallback((delta) => {
    if (!selectedElement || selectedElement.type !== 'text') return;

    const currentSize = selectedElement.fontSize || 24;
    const newSize = Math.max(
      MIN_FONT_SIZE,
      Math.min(MAX_FONT_SIZE, currentSize + delta)
    );

    updateElement(selectedElement.id, { fontSize: newSize });
  }, [selectedElement, updateElement]);

  /**
   * 改變文字顏色
   * @param {string} color - 新的顏色值
   */
  const handleColorChange = useCallback((color) => {
    if (!selectedElement || selectedElement.type !== 'text') return;

    updateElement(selectedElement.id, { color });
  }, [selectedElement, updateElement]);

  /**
   * 改變字體
   * @param {string} fontFamily - 新的字體名稱
   */
  const handleFontFamilyChange = useCallback((fontFamily) => {
    if (!selectedElement || selectedElement.type !== 'text') return;

    updateElement(selectedElement.id, { fontFamily });
  }, [selectedElement, updateElement]);

  /**
   * 測量文字寬度
   */
  const measureTextWidth = useCallback((text, fontSize, fontFamily, fontWeight = "normal", fontStyle = "normal") => {
    return measureText(text, fontSize, fontFamily, fontWeight, fontStyle);
  }, []);

  return {
    handleStartTextEdit,
    handleFinishTextEdit,
    handleToggleBold,
    handleToggleItalic,
    handleFontSizeChange,
    handleColorChange,
    handleFontFamilyChange,
    measureTextWidth,
  };
};

export default useTextEditor;
