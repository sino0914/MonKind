import React from 'react';

const PriceDisplay = ({ price }) => {
  if (!price && price !== 0) {
    return null;
  }

  return (
    <>
      {/* 分隔線 */}
      <div className="h-6 w-px bg-gray-300 mx-2"></div>

      {/* 價格顯示 */}
      <div className="flex items-center space-x-2 px-3">
        <label className="text-sm text-gray-600 whitespace-nowrap">
          購買價格:
        </label>
        <span className="text-lg font-bold text-orange-600 whitespace-nowrap">
          NT$ {price}
        </span>
      </div>
    </>
  );
};

export default PriceDisplay;
