import React from "react";
import PropTypes from "prop-types";
import { COLOR_PRESETS } from "../../constants/editorConfig";

/**
 * 背景色面板組件
 * 提供背景色選擇和管理功能
 */
const BackgroundPanel = ({ backgroundColor, setBackgroundColor }) => {
  return (
    <div className="space-y-4">
      {/* 當前顏色顯示 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          當前背景色
        </label>
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
            style={{ backgroundColor: backgroundColor }}
          />
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">色碼</div>
            <div className="font-mono text-sm font-medium">{backgroundColor}</div>
          </div>
        </div>
      </div>

      {/* 自訂顏色選擇器 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          自訂顏色
        </label>
        <input
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          className="w-full h-12 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-colors"
        />
      </div>

      {/* 常用顏色 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">常用顏色</label>
          <button
            onClick={() => setBackgroundColor("#ffffff")}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            重置
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
          {COLOR_PRESETS.slice(0, 24).map((color) => (
            <button
              key={color}
              onClick={() => setBackgroundColor(color)}
              className={`aspect-square rounded border-2 transition-all hover:scale-105 ${
                backgroundColor === color
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-400"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* 使用說明 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-900 mb-1">💡 使用說明</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 點擊常用顏色快速套用</li>
          <li>• 使用自訂顏色選擇器精確調色</li>
          <li>• 背景色會顯示在設計區域和預覽中</li>
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
