import React from 'react';
import PropTypes from 'prop-types';

/**
 * 比例鎖開關組件
 * 顯示在選取圖片元素時,允許用戶切換等比例/自由變形模式
 */
const AspectRatioLockToggle = ({
  element,
  isFreeTransform,
  onToggle,
  selectedElement,
}) => {
  // 只在選取圖片元素時顯示
  if (!selectedElement || selectedElement.type !== 'image') return null;
  if (!element || element.id !== selectedElement.id) return null;

  // 計算按鈕位置（選取框左上方）
  const buttonStyle = {
    position: 'absolute',
    left: `${(element.x / 400) * 100}%`,
    top: `${(element.y / 400) * 100}%`,
    transform: `translate(-50%, calc(-50% - ${(element.height / 400) * 100}% / 2 - 55px))`,
    zIndex: 100,
  };

  return (
    <div style={buttonStyle} className="pointer-events-auto">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all shadow-lg border ${
          isFreeTransform
            ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600'
            : 'bg-green-500 text-white border-green-600 hover:bg-green-600'
        }`}
        title={isFreeTransform ? '切換為等比例縮放' : '切換為自由變形'}
      >
        <span className="text-base">
          {isFreeTransform ? '🔓' : '🔒'}
        </span>
        <span>
          {isFreeTransform ? '自由變形' : '鎖定比例'}
        </span>
      </button>
    </div>
  );
};

AspectRatioLockToggle.propTypes = {
  element: PropTypes.object,
  isFreeTransform: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  selectedElement: PropTypes.object,
};

export default AspectRatioLockToggle;
