import React from 'react';
import PropTypes from 'prop-types';

/**
 * 作品名稱編輯器組件
 * 支持點擊編輯、Enter 確認、Esc 取消
 */
const WorkNameEditor = ({
  workName,
  isEditingName,
  editingNameValue,
  currentProduct,
  setWorkName,
  setIsEditingName,
  setEditingNameValue,
}) => {
  const defaultName = `${
    currentProduct?.title || "作品"
  } - ${new Date().toLocaleDateString("zh-TW")}`;

  const handleConfirm = () => {
    setWorkName(editingNameValue);
    setIsEditingName(false);
  };

  const handleCancel = () => {
    setEditingNameValue(workName);
    setIsEditingName(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <>
      <div className="h-6 w-px bg-gray-300"></div>
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-600">作品名稱:</label>
        {isEditingName ? (
          <>
            <input
              type="text"
              value={editingNameValue}
              onChange={(e) => setEditingNameValue(e.target.value)}
              placeholder={defaultName}
              className="px-3 py-1 text-sm border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ width: "250px" }}
              autoFocus
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleConfirm}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              title="確定"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              title="取消"
            >
              ✗
            </button>
          </>
        ) : (
          <>
            <span
              className="text-sm font-medium text-gray-900"
              style={{ minWidth: "200px" }}
            >
              {workName || defaultName}
            </span>
            <button
              onClick={() => setIsEditingName(true)}
              className="px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="重新命名"
            >
              ✏️
            </button>
          </>
        )}
      </div>
    </>
  );
};

WorkNameEditor.propTypes = {
  workName: PropTypes.string.isRequired,
  isEditingName: PropTypes.bool.isRequired,
  editingNameValue: PropTypes.string.isRequired,
  currentProduct: PropTypes.shape({
    title: PropTypes.string,
  }),
  setWorkName: PropTypes.func.isRequired,
  setIsEditingName: PropTypes.func.isRequired,
  setEditingNameValue: PropTypes.func.isRequired,
};

export default WorkNameEditor;
