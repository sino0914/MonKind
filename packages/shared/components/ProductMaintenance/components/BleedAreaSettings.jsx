import React from 'react';

/**
 * BleedAreaSettings 組件
 * 出血區域設定介面
 */
const BleedAreaSettings = ({
  bleedArea,
  bleedMode,
  onEnableBleed,
  onDisableBleed,
  onModeChange,
  onValueChange,
  disabled = false,
}) => {
  const isEnabled = !!bleedArea;

  return (
    <div className="space-y-4">
      {/* 啟用/停用開關 */}
      <div className="flex items-center justify-between">
        <label className="font-medium text-gray-700">出血區域</label>
        <button
          onClick={() => (isEnabled ? onDisableBleed() : onEnableBleed())}
          disabled={disabled}
          className={`px-4 py-2 rounded ${
            isEnabled
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isEnabled ? '停用' : '啟用'}
        </button>
      </div>

      {/* 出血區域設定 */}
      {isEnabled && (
        <>
          {/* 模式切換 */}
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">模式:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => onModeChange('uniform')}
                disabled={disabled}
                className={`px-3 py-1 rounded text-sm ${
                  bleedMode === 'uniform'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                統一設定
              </button>
              <button
                onClick={() => onModeChange('separate')}
                disabled={disabled}
                className={`px-3 py-1 rounded text-sm ${
                  bleedMode === 'separate'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                分別設定
              </button>
            </div>
          </div>

          {/* 數值輸入 */}
          {bleedMode === 'uniform' ? (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 w-20">數值:</label>
              <input
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={bleedArea.value || 0}
                onChange={(e) => onValueChange({ value: Number(e.target.value) })}
                disabled={disabled}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <span className="text-sm text-gray-600">mm</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 上 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 w-20">上:</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={bleedArea.top || 0}
                  onChange={(e) => onValueChange({ top: Number(e.target.value) })}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-600">mm</span>
              </div>

              {/* 右 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 w-20">右:</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={bleedArea.right || 0}
                  onChange={(e) => onValueChange({ right: Number(e.target.value) })}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-600">mm</span>
              </div>

              {/* 下 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 w-20">下:</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={bleedArea.bottom || 0}
                  onChange={(e) => onValueChange({ bottom: Number(e.target.value) })}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-600">mm</span>
              </div>

              {/* 左 */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 w-20">左:</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={bleedArea.left || 0}
                  onChange={(e) => onValueChange({ left: Number(e.target.value) })}
                  disabled={disabled}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-600">mm</span>
              </div>
            </div>
          )}

          {/* 說明文字 */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            出血區域是印刷時額外的安全邊界，可避免裁切時出現白邊。數值範圍: 0-20mm
          </div>
        </>
      )}
    </div>
  );
};

export default BleedAreaSettings;
