import React from 'react';
import PropTypes from 'prop-types';

/**
 * 圖片浮動工具列組件
 * 當選取圖片元素時，在選取框上方顯示替換按鈕
 */
const ImageFloatingToolbar = ({
  element,
  isReplacingImage,
  onReplaceClick,
  currentProduct,
}) => {
  if (!element || element.type !== 'image') return null;

  // 計算工具列位置（選取框上方居中）
  const toolbarStyle = {
    position: 'absolute',
    left: `${(element.x / 400) * 100}%`,
    top: `${(element.y / 400) * 100}%`,
    transform: `translate(-50%, calc(-50% - ${(element.height / 400) * 100}% / 2 - 35px))`,
    zIndex: 100,
  };

  return (
    <div style={toolbarStyle} className="pointer-events-auto">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2">
        <button
          onClick={onReplaceClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
            isReplacingImage
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={isReplacingImage ? '取消替換模式' : '替換圖片'}
        >
          <span className="text-base">🔄</span>
          <span>替換</span>
          {isReplacingImage && (
            <span className="ml-1 text-xs opacity-90">(啟用中)</span>
          )}
        </button>
      </div>
    </div>
  );
};

ImageFloatingToolbar.propTypes = {
  element: PropTypes.object,
  isReplacingImage: PropTypes.bool.isRequired,
  onReplaceClick: PropTypes.func.isRequired,
  currentProduct: PropTypes.object,
};

export default ImageFloatingToolbar;
