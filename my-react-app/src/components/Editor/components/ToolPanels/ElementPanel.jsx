import React from "react";
import PropTypes from "prop-types";

/**
 * 元素面板組件
 * 顯示設計元素庫，允許用戶添加元素到設計中
 */
const ElementPanel = ({
  managedElements,
  loadingElements,
  loadManagedElements,
  addManagedElementToDesign,
}) => {
  return (
    <div className="space-y-4">
      {/* 設計元素庫 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">設計元素庫</h4>
          <button
            onClick={loadManagedElements}
            disabled={loadingElements}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {loadingElements ? "載入中..." : "重新載入"}
          </button>
        </div>

        {loadingElements ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <span className="text-xs text-gray-500">載入元素中...</span>
          </div>
        ) : managedElements.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
            {managedElements.map((element) => (
              <div
                key={element.id}
                className="relative aspect-square border border-gray-200 rounded cursor-pointer hover:border-blue-400 transition-colors group overflow-hidden"
                onClick={() => addManagedElementToDesign(element)}
              >
                <img
                  src={element.url}
                  alt={element.name}
                  className="w-full h-full object-cover"
                />

                {/* 元素名稱 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {element.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            <div className="text-2xl mb-2">🎨</div>
            沒有可用的設計元素
            <br />
            <span className="text-xs">前往管理頁面上傳元素</span>
          </div>
        )}
      </div>

      {/* 使用說明 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-900 mb-1">💡 使用說明</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 點擊設計元素庫中的元素添加到畫布</li>
          <li>• 在畫布上可拖曳調整位置和大小</li>
          <li>• 滑鼠右鍵可刪除畫布上的圖片</li>
        </ul>
      </div>
    </div>
  );
};

ElementPanel.propTypes = {
  managedElements: PropTypes.array.isRequired,
  loadingElements: PropTypes.bool.isRequired,
  loadManagedElements: PropTypes.func.isRequired,
  addManagedElementToDesign: PropTypes.func.isRequired,
};

export default ElementPanel;
