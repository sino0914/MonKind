import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/**
 * 錯誤狀態組件
 * 處理兩種錯誤情況：
 * 1. 一般錯誤（currentError）
 * 2. 商品不存在錯誤（!currentProduct）
 */
const ErrorState = ({ error, mode, onNavigateBack, onRetry }) => {
  const navigate = useNavigate();

  // 判斷是商品不存在還是一般錯誤
  const isProductNotFound = error === 'PRODUCT_NOT_FOUND';

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      navigate(mode === 'template' ? '/templates' : '/products');
    }
  };

  if (isProductNotFound) {
    // 商品不存在的錯誤狀態
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            商品不存在
          </h3>
          <p className="text-gray-600 mb-4">找不到此商品或商品已被移除</p>
          <button
            onClick={handleNavigateBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {mode === "template" ? "回到版型管理" : "回到商品頁"}
          </button>
        </div>
      </div>
    );
  }

  // 一般錯誤狀態
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          無法開啟編輯器
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={handleNavigateBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {mode === "template" ? "回到版型管理" : "回到商品頁"}
          </button>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              重新載入
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

ErrorState.propTypes = {
  error: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(['product', 'template']).isRequired,
  onNavigateBack: PropTypes.func,
  onRetry: PropTypes.func,
};

export default ErrorState;
