import React from 'react';

/**
 * BleedAreaSettings Component
 * 出血區域設定組件
 *
 * @param {Object} tempBleedArea - 臨時出血區域設定
 * @param {string} bleedMode - 出血區域模式 ('uniform' | 'separate')
 * @param {Function} onToggleEnable - 切換啟用/停用
 * @param {Function} onModeChange - 變更模式
 * @param {Function} onValueChange - 變更數值
 */
const BleedAreaSettings = ({
  tempBleedArea,
  bleedMode,
  onToggleEnable,
  onModeChange,
  onValueChange,
}) => {
  return (
    <div className="pt-4 border-t border-gray-200">
      {/* 標題與啟用/停用按鈕 */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-900">出血區域設定</h4>
        <button
          onClick={onToggleEnable}
          className={`px-2 py-1 text-xs rounded ${
            tempBleedArea
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {tempBleedArea ? '✓ 已啟用' : '停用'}
        </button>
      </div>

      {/* 出血區域設定內容 */}
      {tempBleedArea && (
        <>
          {/* 模式選擇 */}
          <div className="mb-3">
            <label className="block text-xs text-gray-700 mb-2">模式</label>
            <div className="flex gap-2">
              <button
                onClick={() => onModeChange('uniform')}
                className={`flex-1 px-2 py-1.5 text-xs rounded ${
                  bleedMode === 'uniform'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                統一值
              </button>
              <button
                onClick={() => onModeChange('separate')}
                className={`flex-1 px-2 py-1.5 text-xs rounded ${
                  bleedMode === 'separate'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                分別設定
              </button>
            </div>
          </div>

          {/* 統一值模式 */}
          {bleedMode === 'uniform' && (
            <div>
              <label className="block text-xs text-gray-700 mb-1">
                出血值 (px)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={tempBleedArea.value || 0}
                onChange={(e) =>
                  onValueChange({ value: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              />
            </div>
          )}

          {/* 分別設定模式 */}
          {bleedMode === 'separate' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-700 mb-1">上 (top)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={tempBleedArea.top || 0}
                  onChange={(e) =>
                    onValueChange({ top: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">右 (right)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={tempBleedArea.right || 0}
                  onChange={(e) =>
                    onValueChange({ right: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">下 (bottom)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={tempBleedArea.bottom || 0}
                  onChange={(e) =>
                    onValueChange({ bottom: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 mb-1">左 (left)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={tempBleedArea.left || 0}
                  onChange={(e) =>
                    onValueChange({ left: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BleedAreaSettings;
