import React, { useState } from "react";
import PropTypes from "prop-types";
import { SHAPE_CATEGORIES, getShapesByCategory } from "../../constants/shapeClipConfig";

/**
 * 元素面板組件
 * 顯示設計元素庫，允許用戶添加元素到設計中
 */
const ElementPanel = ({
  managedElements,
  loadingElements,
  loadManagedElements,
  addManagedElementToDesign,
  handleDragStart,
  handleDragEnd,
  isReplacingImage,
  isAdmin = false,
  addElement,
  currentProduct,
}) => {
  // 計算設計區中心
  const calculateCenter = (printArea) => {
    if (!printArea) {
      return { x: 200, y: 200 }; // 預設值
    }
    return {
      x: printArea.x + printArea.width / 2,
      y: printArea.y + printArea.height / 2,
    };
  };

  // 形狀分類展開狀態
  const [expandedCategories, setExpandedCategories] = useState({
    basic: true,
    polygon: false,
    special: false,
  });

  // 取得形狀分類資料
  const shapesByCategory = getShapesByCategory();

  // 切換形狀分類展開/收合
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // 管理員測試功能：添加失效圖片
  const handleAddBrokenImage = () => {
    if (!addElement) return;

    // 計算預設位置：使用設計區中心
    const { x: centerX, y: centerY } = calculateCenter(currentProduct?.printArea);

    // 生成一個唯一的無效 URL（避免緩存）
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const invalidUrl = `https://invalid-test-image-${timestamp}-${randomId}.jpg`;

    console.log('📐 版型專用圖片位置計算:', {
      position: { x: centerX, y: centerY },
      printArea: currentProduct?.printArea
    });

    // 創建失效圖片元素
    const brokenImageElement = {
      id: `broken-image-${timestamp}`,
      type: 'image',
      url: invalidUrl,
      width: 100,
      height: 100,
      x: centerX,
      y: centerY,
      rotation: 0,
      opacity: 1,
    };

    addElement(brokenImageElement);
  };

  // 添加形狀裁切圖片
  const handleAddShapeImage = (shape) => {
    if (!addElement) return;

    // 計算預設位置：使用設計區中心
    const { x: centerX, y: centerY } = calculateCenter(currentProduct?.printArea);

    // 生成一個唯一的無效 URL（與 handleAddBrokenImage 相同邏輯）
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const invalidUrl = `https://shape-image-${shape.id}-${timestamp}-${randomId}.jpg`;

    console.log('📐 形狀圖片位置計算:', {
      shape: shape.name,
      position: { x: centerX, y: centerY },
      printArea: currentProduct?.printArea
    });

    // 創建帶有形狀裁切的圖片元素（強制正方形）
    const shapeSize = 100; // 形狀圖片固定為正方形
    const shapeImageElement = {
      id: `shape-image-${shape.id}-${timestamp}`,
      type: 'image',
      url: invalidUrl,
      width: shapeSize,
      height: shapeSize,
      x: centerX,
      y: centerY,
      rotation: 0,
      opacity: 1,
      // 形狀裁切資訊
      shapeClip: {
        shapeId: shape.id,
        clipPath: shape.clipPath,
        // 圖片在形狀內的偏移（用於調整顯示區域）
        imageOffset: { x: 0, y: 0 },
        // 圖片縮放倍率（1 = 剛好填滿）
        imageScale: 1,
      },
    };

    addElement(shapeImageElement);
  };
  return (
    <div className="space-y-4">
      {/* 替換模式提示 */}
      {isReplacingImage && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-2">
          <div className="flex items-center gap-2 text-blue-800">
            <span className="text-lg">🔄</span>
            <div className="flex-1">
              <div className="text-sm font-medium">替換模式已啟用</div>
              <div className="text-xs text-blue-600 mt-0.5">
                點擊元素以替換選取的圖片
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 管理員測試工具 */}
      {isAdmin && (
        <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
          <h5 className="text-sm font-medium text-orange-900 mb-2 flex items-center gap-2">
            <span>🔧</span>
            <span>管理員工具</span>
          </h5>
          <button
            onClick={handleAddBrokenImage}
            className="w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-colors"
            title="添加一個版型專用圖片"
          >
            ➕ 添加版型專用圖片
          </button>
        </div>
      )}

      {/* 形狀圖片 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
          <span>🔷</span>
          <span>形狀圖片</span>
        </h4>
        <p className="text-xs text-purple-700 mb-3">
          點擊形狀新增圖片，再使用「替換」功能更換圖片
        </p>

        {/* 形狀分類 */}
        {Object.entries(SHAPE_CATEGORIES).map(([categoryKey, categoryName]) => (
          <div key={categoryKey} className="mb-2">
            {/* 分類標題 */}
            <button
              onClick={() => toggleCategory(categoryKey)}
              className="w-full flex items-center justify-between px-2 py-1.5 bg-purple-100 hover:bg-purple-200 rounded text-sm text-purple-800 transition-colors"
            >
              <span>{categoryName}</span>
              <span className="text-xs">{expandedCategories[categoryKey] ? '▼' : '▶'}</span>
            </button>

            {/* 形狀按鈕網格 */}
            {expandedCategories[categoryKey] && (
              <div className="grid grid-cols-4 gap-2 mt-2 px-1">
                {shapesByCategory[categoryKey]?.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => handleAddShapeImage(shape)}
                    className="aspect-square border border-purple-300 rounded bg-white hover:bg-purple-100 hover:border-purple-500 transition-colors p-1 group relative"
                    title={shape.name}
                  >
                    {/* 形狀預覽 SVG */}
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-purple-600 group-hover:text-purple-800"
                    >
                      <path
                        d={shape.svgPath}
                        fill="currentColor"
                        fillOpacity="0.3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    {/* 形狀名稱 tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {shape.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

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
                draggable={handleDragStart ? true : false}
                onDragStart={(e) => {
                  if (handleDragStart) {
                    e.dataTransfer.effectAllowed = 'copy';
                    handleDragStart(element.url);
                  }
                }}
                onDragEnd={() => {
                  if (handleDragEnd) {
                    handleDragEnd();
                  }
                }}
                onClick={() => addManagedElementToDesign(element)}
              >
                <img
                  src={element.url}
                  alt={element.name}
                  className="w-full h-full object-cover pointer-events-none"
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
  handleDragStart: PropTypes.func,
  handleDragEnd: PropTypes.func,
  isReplacingImage: PropTypes.bool,
  isAdmin: PropTypes.bool,
  addElement: PropTypes.func,
  currentProduct: PropTypes.object,
};

export default ElementPanel;
