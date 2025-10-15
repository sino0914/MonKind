import React from 'react';

/**
 * 文字工具列組件
 * 提供文字編輯相關的所有控制按鈕
 */
const TextToolbar = ({
  // 當前選中的文字元素
  element,
  // 事件處理器
  onStartEdit,
  onToggleBold,
  onToggleItalic,
  onFontSizeChange,
  onColorChange,
  onFontFamilyChange,
  onCopyAndPaste,
  // 視圖控制
  viewport = null,
}) => {
  if (!element) return null;

  // 計算考慮視圖變換後的位置
  let left = `${(element.x / 400) * 100}%`;
  let top = `${(element.y / 400) * 100}%`;
  let transform = "translate(-50%, calc(-100% - 80px))";

  // 如果有 viewport，需要應用縮放和平移
  if (viewport) {
    // 將畫布座標轉換為顯示座標（應用縮放和平移）
    const canvasWidth = 400; // 畫布容器的寬度（像素）
    const canvasHeight = 400; // 畫布容器的高度（像素）

    // 元素在畫布上的相對位置（像素）
    const elementX = (element.x / 400) * canvasWidth;
    const elementY = (element.y / 400) * canvasHeight;

    // 相對於畫布中心的位置
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // 應用縮放
    const scaledX = (elementX - centerX) * viewport.zoom + centerX;
    const scaledY = (elementY - centerY) * viewport.zoom + centerY;

    // 應用平移
    const finalX = scaledX + viewport.pan.x;
    const finalY = scaledY + viewport.pan.y;

    // 轉換為百分比
    left = `${(finalX / canvasWidth) * 100}%`;
    top = `${(finalY / canvasHeight) * 100}%`;
  }

  return (
    <div
      className="absolute bg-gray-800 text-white rounded-md shadow-lg flex items-center space-x-1 p-1 pointer-events-auto"
      style={{
        left,
        top,
        transform,
        zIndex: 1000,
      }}
    >
      {/* 編輯文字按鈕 */}
      <button
        onClick={() => onStartEdit(element)}
        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
        title="編輯文字"
      >
        ✏️
      </button>

      {/* 粗體按鈕 */}
      <button
        onClick={onToggleBold}
        className={`px-2 py-1 text-xs rounded font-bold ${
          element.fontWeight === "bold"
            ? "bg-yellow-600 text-white"
            : "bg-gray-600 hover:bg-gray-500"
        }`}
        title="粗體"
      >
        B
      </button>

      {/* 斜體按鈕 */}
      <button
        onClick={onToggleItalic}
        className={`px-2 py-1 text-xs rounded italic ${
          element.fontStyle === "italic"
            ? "bg-yellow-600 text-white"
            : "bg-gray-600 hover:bg-gray-500"
        }`}
        title="斜體"
      >
        I
      </button>

      {/* 分隔線 */}
      <div className="w-px h-4 bg-gray-500" />

      {/* 字體大小調整 */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onFontSizeChange(-2)}
          className="px-1 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
          title="縮小字體"
        >
          A-
        </button>
        <span className="text-xs px-1 min-w-6 text-center">
          {element.fontSize}
        </span>
        <button
          onClick={() => onFontSizeChange(2)}
          className="px-1 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
          title="放大字體"
        >
          A+
        </button>
      </div>

      {/* 分隔線 */}
      <div className="w-px h-4 bg-gray-500" />

      {/* 顏色選擇器 */}
      <div className="flex items-center space-x-1">
        <label
          className="cursor-pointer px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded flex items-center"
          title="文字顏色"
        >
          <span className="text-xs mr-1">🎨</span>
          <input
            type="color"
            value={element.color || "#000000"}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-0 h-0 opacity-0 absolute"
          />
          <div
            className="w-4 h-4 rounded border border-white"
            style={{
              backgroundColor: element.color || "#000000",
            }}
          />
        </label>
      </div>

      {/* 分隔線 */}
      <div className="w-px h-4 bg-gray-500" />

      {/* 字型選擇器 */}
      <select
        value={element.fontFamily || "Arial"}
        onChange={(e) => onFontFamilyChange(e.target.value)}
        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white border-none outline-none cursor-pointer"
        title="選擇字型"
      >
        <option value="Arial">Arial</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Georgia">Georgia</option>
        <option value="Courier New">Courier New</option>
        <option value="Verdana">Verdana</option>
        <option value="微軟正黑體">微軟正黑體</option>
        <option value="新細明體">新細明體</option>
        <option value="標楷體">標楷體</option>
      </select>

      {/* 分隔線 */}
      <div className="w-px h-4 bg-gray-500" />

      {/* 複製並貼上按鈕 */}
      <button
        onClick={onCopyAndPaste}
        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded whitespace-nowrap"
        title="複製並貼上"
      >
        📋複製
      </button>
    </div>
  );
};

export default TextToolbar;
