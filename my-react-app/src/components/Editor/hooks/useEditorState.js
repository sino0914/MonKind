import { useState, useEffect, useRef } from 'react';
import { DEFAULT_BG_COLOR } from '../constants/editorConfig';

/**
 * 統一管理編輯器的所有狀態
 */
const useEditorState = (initialElements = [], initialBackgroundColor = DEFAULT_BG_COLOR, initialWorkName = '') => {
  // 設計元素狀態
  const [designElements, setDesignElements] = useState(initialElements);
  const [selectedElement, setSelectedElement] = useState(null);
  const [copiedElement, setCopiedElement] = useState(null);

  // 背景顏色
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);

  // 圖層管理
  const [hiddenLayers, setHiddenLayers] = useState(new Set());

  // 工具列狀態
  const [hoveredTool, setHoveredTool] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);

  // 拖曳和縮放狀態
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState(null);

  // 文字編輯狀態
  const [editingText, setEditingText] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [showTextToolbar, setShowTextToolbar] = useState(false);

  // 作品名稱狀態
  const [workName, setWorkName] = useState(initialWorkName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState(initialWorkName);

  // 初始化標記（用於避免初次觸發變更回調）
  const isInitialized = useRef(false);

  // 監聽初始化數據變化
  useEffect(() => {
    setDesignElements(initialElements);
  }, [initialElements]);

  useEffect(() => {
    setBackgroundColor(initialBackgroundColor);
  }, [initialBackgroundColor]);

  useEffect(() => {
    setWorkName(initialWorkName);
    setEditingNameValue(initialWorkName);
  }, [initialWorkName]);

  // 元素操作函數
  const addElement = (element) => {
    setDesignElements(prev => [...prev, element]);
  };

  const updateElement = (elementId, updates) => {
    setDesignElements(prev =>
      prev.map(el => (el.id === elementId ? { ...el, ...updates } : el))
    );

    // 同步更新 selectedElement，避免閉包問題
    setSelectedElement(prev => {
      if (prev && prev.id === elementId) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  };

  const deleteElement = (elementId) => {
    setDesignElements(prev => prev.filter(el => el.id !== elementId));
    setSelectedElement(null);
    setShowTextToolbar(false);
    setEditingText(null);
    // 從隱藏圖層集合中移除
    setHiddenLayers(prev => {
      const newSet = new Set(prev);
      newSet.delete(elementId);
      return newSet;
    });
  };

  const clearElements = () => {
    setDesignElements([]);
    setSelectedElement(null);
    setHiddenLayers(new Set());
  };

  // 選擇操作
  const selectElement = (element) => {
    setSelectedElement(element);
    if (element?.type === 'text') {
      setShowTextToolbar(true);
    } else {
      setShowTextToolbar(false);
      setEditingText(null);
    }
  };

  const clearSelection = () => {
    setSelectedElement(null);
    setShowTextToolbar(false);
    setEditingText(null);
  };

  // 複製貼上
  const copyElement = () => {
    if (selectedElement) {
      setCopiedElement({ ...selectedElement });
    }
  };

  const pasteElement = () => {
    if (copiedElement) {
      const newElement = {
        ...copiedElement,
        id: Date.now(),
        x: copiedElement.x + 20,
        y: copiedElement.y + 20,
      };
      addElement(newElement);
      setSelectedElement(newElement);
      return newElement;
    }
    return null;
  };

  // 拖曳操作
  const startDrag = (elementId, offset) => {
    setDraggedElement(elementId);
    setDragOffset(offset);
  };

  const endDrag = () => {
    setDraggedElement(null);
    setResizeHandle(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // 返回狀態和方法
  return {
    // 設計元素
    designElements,
    setDesignElements,
    selectedElement,
    copiedElement,

    // 背景顏色
    backgroundColor,
    setBackgroundColor,

    // 圖層
    hiddenLayers,
    setHiddenLayers,

    // 工具列
    hoveredTool,
    setHoveredTool,
    selectedTool,
    setSelectedTool,

    // 拖曳和縮放
    draggedElement,
    dragOffset,
    resizeHandle,
    setResizeHandle,

    // 文字編輯
    editingText,
    setEditingText,
    editingContent,
    setEditingContent,
    showTextToolbar,
    setShowTextToolbar,

    // 作品名稱
    workName,
    setWorkName,
    isEditingName,
    setIsEditingName,
    editingNameValue,
    setEditingNameValue,

    // 初始化標記
    isInitialized,

    // 操作函數
    addElement,
    updateElement,
    deleteElement,
    clearElements,
    selectElement,
    clearSelection,
    copyElement,
    pasteElement,
    startDrag,
    endDrag,
  };
};

export default useEditorState;
