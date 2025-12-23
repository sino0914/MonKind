import React from 'react';
import { CANVAS_SIZE, DISPLAY_SIZE } from '../constants/editorConfig';

/**
 * 文字編輯輸入框組件
 * 用於雙擊文字元素時的內容編輯
 */
const TextEditingInput = ({
  element,
  editingContent,
  onContentChange,
  onFinishEdit,
  inputWidth,
  canvasScale = 1,
}) => {
  if (!element) return null;

  return (
    <input
      type="text"
      value={editingContent}
      onChange={(e) => onContentChange(e.target.value)}
      onBlur={onFinishEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onFinishEdit();
        }
        if (e.key === "Escape") {
          onContentChange("");
        }
      }}
      autoFocus
      className="absolute bg-white border-2 border-blue-500 p-1 pointer-events-auto z-40"
      style={{
        left: `${(element.x / CANVAS_SIZE) * 100}%`,
        top: `${(element.y / CANVAS_SIZE) * 100}%`,
        transform: "translate(-50%, -50%)",
        fontSize: `${element.fontSize * canvasScale}px`,
        color: element.color,
        fontFamily: element.fontFamily,
        fontWeight: element.fontWeight || "normal",
        fontStyle: element.fontStyle || "normal",
        width: `${inputWidth}px`,
        border: "2px solid #3b82f6",
        borderRadius: "2px",
        outline: "none",
        textAlign: "center",
      }}
    />
  );
};

export default TextEditingInput;
