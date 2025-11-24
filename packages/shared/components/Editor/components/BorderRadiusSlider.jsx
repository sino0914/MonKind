import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * 圓角滑桿元件
 * 用於調整圖片元素的圓角值
 */
const BorderRadiusSlider = ({
  value = 0,
  onChange,
  onClose,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef(null);

  // 同步外部值
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 處理滑桿變更
  const handleSliderChange = useCallback((e) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // 處理輸入框變更
  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      setLocalValue(0);
      return;
    }
    const newValue = Math.min(200, Math.max(0, parseInt(inputValue, 10) || 0));
    setLocalValue(newValue);
    onChange(newValue);
  }, [onChange]);

  // 預設值快捷按鈕 (px)
  const presetValues = [
    { label: '無', value: 0 },
    { label: '小', value: 10 },
    { label: '中', value: 25 },
    { label: '大', value: 50 },
    { label: '特大', value: 100 },
  ];

  return (
    <div
      className="absolute bg-gray-800 text-white rounded-lg shadow-xl p-3 z-50"
      style={{
        minWidth: '200px',
        transform: 'translateY(8px)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">圓角</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 滑桿 */}
      <div className="mb-3">
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="200"
          value={localValue}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
          style={{
            WebkitAppearance: 'none',
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(localValue / 200) * 100}%, #4B5563 ${(localValue / 200) * 100}%, #4B5563 100%)`,
          }}
        />
      </div>

      {/* 數值輸入 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">數值</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="200"
            value={localValue}
            onChange={handleInputChange}
            className="w-14 px-2 py-1 text-sm bg-gray-700 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>

      {/* 快捷按鈕 */}
      <div className="flex gap-1">
        {presetValues.map((preset) => (
          <button
            key={preset.value}
            onClick={() => {
              setLocalValue(preset.value);
              onChange(preset.value);
            }}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              localValue === preset.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};

BorderRadiusSlider.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BorderRadiusSlider;
