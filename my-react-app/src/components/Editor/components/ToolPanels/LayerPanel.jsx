import React from "react";
import PropTypes from "prop-types";

/**
 * 圖層面板組件
 * 顯示和管理設計中的所有圖層
 */
const LayerPanel = ({
  designElements,
  selectedElement,
  hiddenLayers,
  handleSelectElement,
  toggleLayerVisibility,
  moveLayerUp,
  moveLayerDown,
  handleDeleteElement,
  backgroundColor,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">圖層列表</h4>
        <span className="text-xs text-gray-500">
          {designElements.length + 1} 個圖層
        </span>
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {/* 設計元素圖層 - 按照z-index順序顯示 */}
        {[...designElements].reverse().map((element, index) => {
          const isSelected = selectedElement?.id === element.id;
          const isHidden = hiddenLayers.has(element.id);
          const layerName =
            element.type === "text"
              ? `文字: ${
                  element.content?.substring(0, 10) || "新增文字"
                }${element.content?.length > 10 ? "..." : ""}`
              : `圖片: ${element.url ? "自訂圖片" : "圖片"}`;

          return (
            <div
              key={element.id}
              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors select-none ${
                isSelected
                  ? "bg-blue-100 border border-blue-300"
                  : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
              } ${isHidden ? "opacity-50" : ""}`}
              onClick={() => handleSelectElement(element)}
            >
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-lg">
                  {element.type === "text" ? "📝" : "🖼️"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {layerName}
                  </div>
                  <div className="text-xs text-gray-500">
                    圖層 {designElements.length - index}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* 可見性切換 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(element.id);
                  }}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isHidden
                      ? "bg-gray-300 text-gray-600 hover:bg-gray-400"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  title={isHidden ? "顯示圖層" : "隱藏圖層"}
                >
                  {isHidden ? "👁️‍🗨️" : "👁️"}
                </button>

                {/* 圖層順序控制 */}
                <div className="flex flex-col">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerUp(element.id);
                    }}
                    className="text-xs px-1 py-0.5 bg-white hover:bg-gray-100 rounded-t border border-gray-300"
                    title="向上移動"
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayerDown(element.id);
                    }}
                    className="text-xs px-1 py-0.5 bg-white hover:bg-gray-100 rounded-b border border-gray-300 border-t-0"
                    title="向下移動"
                    disabled={index === designElements.length - 1}
                  >
                    ↓
                  </button>
                </div>

                {/* 刪除按鈕 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("確定要刪除這個圖層嗎？")) {
                      handleDeleteElement(element.id);
                    }
                  }}
                  className="text-xs px-2 py-1 bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
                  title="刪除圖層"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
        {/* 背景圖層 - 始終在最底層 */}
        <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🎨</span>
            <div>
              <span className="text-sm font-medium text-blue-900">
                背景顏色
              </span>
              <div className="text-xs text-blue-700">{backgroundColor}</div>
            </div>
          </div>
          <div
            className="w-4 h-4 border border-gray-300 rounded"
            style={{ backgroundColor: backgroundColor }}
          />
        </div>

        {designElements.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            <div className="text-2xl mb-2">📑</div>
            還沒有設計元素
            <br />
            使用左側工具開始添加元素
          </div>
        )}
      </div>

      {/* 圖層操作提示 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-900 mb-1">💡 圖層操作</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 點擊圖層可選中對應元素</li>
          <li>• 👁️ 控制圖層顯示/隱藏</li>
          <li>• ↑↓ 調整圖層順序</li>
          <li>• 🗑️ 刪除圖層</li>
        </ul>
      </div>
    </div>
  );
};

LayerPanel.propTypes = {
  designElements: PropTypes.array.isRequired,
  selectedElement: PropTypes.object,
  hiddenLayers: PropTypes.instanceOf(Set).isRequired,
  handleSelectElement: PropTypes.func.isRequired,
  toggleLayerVisibility: PropTypes.func.isRequired,
  moveLayerUp: PropTypes.func.isRequired,
  moveLayerDown: PropTypes.func.isRequired,
  handleDeleteElement: PropTypes.func.isRequired,
  backgroundColor: PropTypes.string.isRequired,
};

export default LayerPanel;
