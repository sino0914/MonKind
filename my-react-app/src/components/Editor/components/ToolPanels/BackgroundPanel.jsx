import React from "react";
import PropTypes from "prop-types";
import { COLOR_PRESETS } from "../../constants/editorConfig";

/**
 * 背景色面板組件
 * 提供背景色選擇和管理功能
 */
const BackgroundPanel = ({ backgroundColor, setBackgroundColor }) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          商品底色
        </label>
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          className="w-full h-10 rounded border"
        />
      </div>

      <div className="text-xs text-gray-600 mb-2">
        當前顏色: {backgroundColor}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            onClick={() => setBackgroundColor(color)}
            className={`w-12 h-12 rounded border-2 transition-colors ${
              backgroundColor === color
                ? "border-blue-500 shadow-md scale-105"
                : "border-gray-200 hover:border-gray-400"
            }`}
            style={{ backgroundColor: color }}
            title={`選擇顏色: ${color}`}
          />
        ))}
      </div>

      {/* 重置按鈕 */}
      <button
        onClick={() => setBackgroundColor("#ffffff")}
        className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
      >
        🔄 重置為白色
      </button>

      {/* 說明文字 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-900 mb-1">💡 使用說明</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 選擇顏色會設定設計區域的背景色</li>
          <li>• 背景色會顯示在設計區域和即時預覽中</li>
          <li>• 設計元素會顯示在背景色上方</li>
        </ul>
      </div>
    </div>
  );
};

BackgroundPanel.propTypes = {
  backgroundColor: PropTypes.string.isRequired,
  setBackgroundColor: PropTypes.func.isRequired,
};

export default BackgroundPanel;
