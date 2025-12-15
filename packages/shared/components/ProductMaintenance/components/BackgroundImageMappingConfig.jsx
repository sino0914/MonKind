import React, { useState } from 'react';
import BackgroundImageUploader from './BackgroundImageUploader';
import BleedAreaMappingEditor from './BleedAreaMappingEditor';
import '../styles/BackgroundImageUploader.css';
import '../styles/BleedAreaMappingEditor.css';

/**
 * 背景圖映射設定組件（合併版本）
 * 整合背景圖上傳和出血區映射編輯為一個組件
 */
const BackgroundImageMappingConfig = ({
  product,
  backgroundImage,
  bleedAreaMapping,
  onBackgroundImageUpload,
  onBackgroundImageDelete,
  onMappingChange,
  onSave, // 新增：保存回調
  loading = false,
  error = null,
  saving = false // 新增：保存中狀態
}) => {
  const [expandedSection, setExpandedSection] = useState('upload'); // 'upload' or 'mapping'

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 標題欄 */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">
                背景圖映射設定
              </h4>
              {backgroundImage && (
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  ✓ 已設定
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 內容區 */}
        <div className="p-4">
          {/* 背景圖上傳部分 */}
          <div className="mb-6">
            <button
              onClick={() => setExpandedSection(expandedSection === 'upload' ? null : 'upload')}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📸</span>
                <span className="text-sm font-medium text-gray-700">背景圖片</span>
                {backgroundImage && (
                  <span className="text-xs text-green-600 font-medium">
                    ({Math.round(backgroundImage.fileInfo?.size / 1024)}KB)
                  </span>
                )}
              </div>
              <span className={`transform transition-transform ${expandedSection === 'upload' ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {(expandedSection === 'upload' || !backgroundImage) && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <BackgroundImageUploader
                  backgroundImage={backgroundImage}
                  onUpload={onBackgroundImageUpload}
                  onDelete={onBackgroundImageDelete}
                  loading={loading}
                  error={error}
                />
              </div>
            )}
          </div>

          {/* 分割線 */}
          {backgroundImage && (
            <div className="my-6 border-t border-gray-200"></div>
          )}

          {/* 出血區映射部分 */}
          {backgroundImage && (
            <div>
              <button
                onClick={() => setExpandedSection(expandedSection === 'mapping' ? null : 'mapping')}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <span className="text-sm font-medium text-gray-700">出血區映射</span>
                  {bleedAreaMapping && (
                    <span className="text-xs text-blue-600 font-medium">
                      (中心: {bleedAreaMapping.centerX?.toFixed(1)}%, {bleedAreaMapping.centerY?.toFixed(1)}%)
                    </span>
                  )}
                </div>
                <span className={`transform transition-transform ${expandedSection === 'mapping' ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {expandedSection === 'mapping' && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <BleedAreaMappingEditor
                    product={product}
                    initialMapping={bleedAreaMapping}
                    onMappingChange={onMappingChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 使用提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <p>💡 <strong>使用說明</strong>：先上傳背景圖片，然後調整出血區在圖片上的位置和大小。</p>
      </div>

      {/* 保存按鈕 */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={saving}
          className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            saving
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {saving ? "儲存中..." : "💾 儲存背景圖設定"}
        </button>
      )}
    </div>
  );
};

export default BackgroundImageMappingConfig;
