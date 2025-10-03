import React from 'react';
import PropTypes from 'prop-types';

/**
 * 頂部工具列操作按鈕組件
 * 包含撤銷、重做、測試輸出、儲存、加入購物車等按鈕
 * 僅在 product 模式下顯示
 */
const ToolbarActions = ({ mode, onSaveDraft, onAddToCart, onTestOutput, isEditingFromCart = false }) => {
  // 版型模式不顯示預設按鈕
  if (mode !== 'product') {
    return null;
  }

  return (
    <div className="flex items-center space-x-3">
      <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
        <span className="mr-1">↶</span> 撤銷
      </button>
      <button className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
        <span className="mr-1">↷</span> 重做
      </button>
      <div className="h-6 w-px bg-gray-300"></div>
      <button
        onClick={onTestOutput}
        className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
        title="輸出設計區域為圖片（不含底圖）"
      >
        <span className="mr-1">📸</span> 測試輸出
      </button>
      <div className="h-6 w-px bg-gray-300"></div>
      <button
        onClick={onSaveDraft}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        💾 儲存
      </button>
      <button
        onClick={onAddToCart}
        className="px-4 py-2 text-sm bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
      >
        {isEditingFromCart ? '🔄 更新購物車' : '🛒 加入購物車'}
      </button>
    </div>
  );
};

ToolbarActions.propTypes = {
  mode: PropTypes.oneOf(['product', 'template']).isRequired,
  onSaveDraft: PropTypes.func.isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onTestOutput: PropTypes.func.isRequired,
};

export default ToolbarActions;
