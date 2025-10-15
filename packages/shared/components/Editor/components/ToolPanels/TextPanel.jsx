import React from "react";
import PropTypes from "prop-types";

/**
 * 文字面板組件
 * 提供添加文字元素的功能
 */
const TextPanel = ({ handleAddText }) => {
  return (
    <div className="space-y-2">
      <button
        onClick={handleAddText}
        className="w-full p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        ➕ 基本文字
      </button>
    </div>
  );
};

TextPanel.propTypes = {
  handleAddText: PropTypes.func.isRequired,
};

export default TextPanel;
