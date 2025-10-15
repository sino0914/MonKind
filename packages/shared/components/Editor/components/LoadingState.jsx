import React from 'react';
import PropTypes from 'prop-types';

/**
 * 載入中狀態組件
 * 顯示載入動畫和提示訊息
 */
const LoadingState = ({ message }) => {
  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
        <p className="text-sm text-gray-500 mt-2">
          正在載入商品資料與設計區域
        </p>
      </div>
    </div>
  );
};

LoadingState.propTypes = {
  message: PropTypes.string,
};

LoadingState.defaultProps = {
  message: "載入編輯器中...",
};

export default LoadingState;
