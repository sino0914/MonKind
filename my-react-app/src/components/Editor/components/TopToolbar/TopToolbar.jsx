import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import WorkNameEditor from './WorkNameEditor';
import ToolbarActions from './ToolbarActions';

/**
 * 頂部工具列主組件
 * 包含返回按鈕、標題、作品名稱編輯器和操作按鈕
 */
const TopToolbar = ({
  showTopToolbar,
  topToolbarLeft,
  topToolbarRight,
  title,
  mode,
  currentProduct,
  onNavigateBack,
  workName,
  isEditingName,
  editingNameValue,
  setWorkName,
  setIsEditingName,
  setEditingNameValue,
  onSaveDraft,
  onAddToCart,
  onTestOutput,
  isEditingFromCart = false,
  onResetView,
  currentZoom,
}) => {
  const navigate = useNavigate();

  // 默認左側內容
  const defaultTopToolbarLeft = (
    <div className="flex items-center space-x-4">
      <button
        onClick={onNavigateBack || (() => navigate(-1))}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg
          className="w-5 h-5 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        返回
      </button>
      <div className="h-6 w-px bg-gray-300"></div>
      <h1 className="text-lg font-semibold text-gray-900">
        {title || (mode === "template" ? "📐 版型編輯器" : "編輯器")} -{" "}
        {currentProduct?.title}
      </h1>
      {mode === "product" && (
        <WorkNameEditor
          workName={workName}
          isEditingName={isEditingName}
          editingNameValue={editingNameValue}
          currentProduct={currentProduct}
          setWorkName={setWorkName}
          setIsEditingName={setIsEditingName}
          setEditingNameValue={setEditingNameValue}
        />
      )}
    </div>
  );

  // 默認右側內容
  const defaultTopToolbarRight = (
    <ToolbarActions
      mode={mode}
      onSaveDraft={onSaveDraft}
      onAddToCart={onAddToCart}
      onTestOutput={onTestOutput}
      isEditingFromCart={isEditingFromCart}
      onResetView={onResetView}
      currentZoom={currentZoom}
    />
  );

  if (!showTopToolbar) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      {topToolbarLeft || defaultTopToolbarLeft}
      {topToolbarRight || defaultTopToolbarRight}
    </div>
  );
};

TopToolbar.propTypes = {
  showTopToolbar: PropTypes.bool,
  topToolbarLeft: PropTypes.node,
  topToolbarRight: PropTypes.node,
  title: PropTypes.string,
  mode: PropTypes.oneOf(['product', 'template']).isRequired,
  currentProduct: PropTypes.shape({
    title: PropTypes.string,
  }),
  onNavigateBack: PropTypes.func,
  workName: PropTypes.string,
  isEditingName: PropTypes.bool,
  editingNameValue: PropTypes.string,
  setWorkName: PropTypes.func,
  setIsEditingName: PropTypes.func,
  setEditingNameValue: PropTypes.func,
  onSaveDraft: PropTypes.func,
  onAddToCart: PropTypes.func,
  onTestOutput: PropTypes.func,
};

TopToolbar.defaultProps = {
  showTopToolbar: true,
};

export default TopToolbar;
