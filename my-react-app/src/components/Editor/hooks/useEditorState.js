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

  // 骯髒狀態（追蹤用戶是否進行了實際操作）
  const [isDirty, setIsDirty] = useState(false);

  // 歷史記錄管理（用於撤銷/重做）
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isApplyingHistory = useRef(false); // 防止應用歷史時再次記錄
  const isDragging = useRef(false); // 追蹤是否正在拖曳中
  const hasUserAction = useRef(false); // 追蹤是否有用戶操作

  // 初始化標記（用於避免初次觸發變更回調）
  const isInitialized = useRef(false);

  // 記錄歷史狀態
  const recordHistory = (newElements, newBackgroundColor) => {
    if (isApplyingHistory.current) {
      console.log('⏭️ 正在應用歷史，跳過記錄');
      return; // 如果正在應用歷史，不記錄
    }

    const snapshot = {
      elements: JSON.parse(JSON.stringify(newElements)),
      backgroundColor: newBackgroundColor,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      // 如果當前不在歷史記錄的末尾，移除後面的記錄
      const newHistory = prev.slice(0, historyIndex + 1);
      // 添加新記錄
      newHistory.push(snapshot);
      console.log('📝 記錄歷史，新長度:', newHistory.length, '新索引:', newHistory.length - 1);
      // 限制歷史記錄數量（最多保留 50 個）
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistoryIndex(prev => prev); // 保持索引不變
        return newHistory;
      }
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  };

  // 監聽設計元素和背景顏色變化，自動記錄歷史
  useEffect(() => {
    // 標記為已初始化
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('🎬 編輯器已初始化，元素數:', designElements.length);
      return; // 初始化時不記錄歷史
    }

    // 只有真正的用戶操作才記錄
    if (!hasUserAction.current) return;
    if (isDragging.current) return; // 拖曳中不記錄（等拖曳結束時才記錄）

    recordHistory(designElements, backgroundColor);
  }, [designElements, backgroundColor]);

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
    // 首次操作時記錄初始狀態
    if (!hasUserAction.current) {
      hasUserAction.current = true;
      const initialSnapshot = {
        elements: JSON.parse(JSON.stringify(designElements)),
        backgroundColor: backgroundColor,
        timestamp: Date.now(),
      };
      setHistory([initialSnapshot]);
      setHistoryIndex(0);
      console.log('🎯 首次用戶操作，記錄初始狀態');
    }

    setDesignElements(prev => [...prev, element]);
    setIsDirty(true); // 標記為骯髒
  };

  const updateElement = (elementId, updates) => {
    // 首次操作時記錄初始狀態
    if (!hasUserAction.current) {
      hasUserAction.current = true;
      const initialSnapshot = {
        elements: JSON.parse(JSON.stringify(designElements)),
        backgroundColor: backgroundColor,
        timestamp: Date.now(),
      };
      setHistory([initialSnapshot]);
      setHistoryIndex(0);
      console.log('🎯 首次用戶操作（更新元素），記錄初始狀態');
    }

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

    setIsDirty(true); // 標記為骯髒
  };

  const deleteElement = (elementId) => {
    // 首次操作時記錄初始狀態
    if (!hasUserAction.current) {
      hasUserAction.current = true;
      const initialSnapshot = {
        elements: JSON.parse(JSON.stringify(designElements)),
        backgroundColor: backgroundColor,
        timestamp: Date.now(),
      };
      setHistory([initialSnapshot]);
      setHistoryIndex(0);
      console.log('🎯 首次用戶操作，記錄初始狀態');
    }

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
    setIsDirty(true); // 標記為骯髒
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
      setIsDirty(true); // 標記為骯髒
      return newElement;
    }
    return null;
  };

  // 拖曳操作
  const startDrag = (elementId, offset) => {
    setDraggedElement(elementId);
    setDragOffset(offset);
    isDragging.current = true; // 開始拖曳，暫停歷史記錄
    console.log('🎯 開始拖曳，暫停歷史記錄');
  };

  const endDrag = () => {
    setDraggedElement(null);
    setResizeHandle(null);
    setDragOffset({ x: 0, y: 0 });

    // 拖曳結束後，記錄最終位置
    if (isDragging.current) {
      isDragging.current = false;
      console.log('🎯 結束拖曳，記錄最終位置');
      // 手動記錄一次歷史
      recordHistory(designElements, backgroundColor);
    }
  };

  // 背景顏色變更包裝函數（標記為骯髒）
  const changeBackgroundColor = (color) => {
    // 首次操作時記錄初始狀態
    if (!hasUserAction.current) {
      hasUserAction.current = true;
      const initialSnapshot = {
        elements: JSON.parse(JSON.stringify(designElements)),
        backgroundColor: backgroundColor,
        timestamp: Date.now(),
      };
      setHistory([initialSnapshot]);
      setHistoryIndex(0);
      console.log('🎯 首次用戶操作，記錄初始狀態');
    }

    setBackgroundColor(color);
    setIsDirty(true);
  };

  // 重置骯髒狀態（在儲存或加入購物車後調用）
  const resetDirty = () => {
    setIsDirty(false);
  };

  // 撤銷（Undo）
  const undo = () => {
    console.log('🔙 執行撤銷，當前索引:', historyIndex, '歷史長度:', history.length);
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const snapshot = history[newIndex];

      isApplyingHistory.current = true;
      setDesignElements(JSON.parse(JSON.stringify(snapshot.elements)));
      setBackgroundColor(snapshot.backgroundColor);
      setHistoryIndex(newIndex);
      setIsDirty(true);

      console.log('✅ 撤銷完成，新索引:', newIndex);

      // 使用 setTimeout 確保狀態更新完成後再重置標記
      setTimeout(() => {
        isApplyingHistory.current = false;
      }, 0);
    } else {
      console.log('⚠️ 無法撤銷，已在歷史起點');
    }
  };

  // 重做（Redo）
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const snapshot = history[newIndex];

      isApplyingHistory.current = true;
      setDesignElements(JSON.parse(JSON.stringify(snapshot.elements)));
      setBackgroundColor(snapshot.backgroundColor);
      setHistoryIndex(newIndex);
      setIsDirty(true);

      // 使用 setTimeout 確保狀態更新完成後再重置標記
      setTimeout(() => {
        isApplyingHistory.current = false;
      }, 0);
    }
  };

  // 檢查是否可以撤銷/重做
  const canUndo = historyIndex > 0; // 保留初始狀態不可撤銷
  const canRedo = historyIndex < history.length - 1;

  // 返回狀態和方法
  return {
    // 設計元素
    designElements,
    setDesignElements,
    selectedElement,
    copiedElement,

    // 背景顏色
    backgroundColor,
    setBackgroundColor, // 保留原始設置函數供初始化使用
    changeBackgroundColor, // 新增：用於用戶操作的背景顏色變更

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

    // 骯髒狀態
    isDirty,
    setIsDirty,
    resetDirty,

    // 歷史記錄
    history,
    historyIndex,
    undo,
    redo,
    canUndo,
    canRedo,

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
