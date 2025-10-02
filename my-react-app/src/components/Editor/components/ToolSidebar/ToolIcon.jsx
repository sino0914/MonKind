import React from 'react';
import PropTypes from 'prop-types';

/**
 * 工具圖標按鈕組件
 * 用於側邊欄的工具圖標展示
 */
const ToolIcon = ({
  tool,
  isHovered,
  isSelected,
  onMouseEnter,
  onMouseLeave,
  onClick
}) => {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${
        isSelected
          ? "bg-blue-500 text-white shadow-md"
          : isHovered
          ? "bg-gray-200"
          : "hover:bg-gray-100"
      }`}
      title={tool.label}
    >
      {tool.icon}
    </button>
  );
};

ToolIcon.propTypes = {
  tool: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
  }).isRequired,
  isHovered: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ToolIcon;
