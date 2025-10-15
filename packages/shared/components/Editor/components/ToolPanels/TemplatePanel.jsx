import React from "react";
import PropTypes from "prop-types";
import TemplateThumbnail from "../../../Preview/TemplateThumbnail";

/**
 * 版型面板組件
 * 顯示可用的版型列表，允許用戶選擇並應用版型
 */
const TemplatePanel = ({
  availableTemplates,
  loadingTemplates,
  applyTemplate,
}) => {
  return (
    <div className="space-y-3">
      {loadingTemplates ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">載入版型中...</p>
        </div>
      ) : availableTemplates.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">可用版型</h4>
            <span className="text-xs text-gray-500">
              {availableTemplates.length} 個版型
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
            {availableTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="p-2 bg-gray-50 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition-colors text-center group"
                title={`點擊應用版型：${template.name}`}
              >
                {/* 版型縮圖 */}
                <div className="w-full aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden mb-2">
                  <TemplateThumbnail
                    template={template}
                    width={120}
                    height={120}
                    showName={false}
                    showElementCount={false}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* 版型標題 */}
                <p className="text-xs font-medium text-gray-900 truncate">
                  {template.name}
                </p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm">
          <div className="text-2xl mb-2">📐</div>
          此商品還沒有可用版型
          <br />
          可在後台管理中新增版型
        </div>
      )}

      {/* 使用說明 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-900 mb-1">💡 使用說明</h5>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 點擊版型即可套用設計</li>
          <li>• 套用後可繼續編輯調整</li>
          <li>• 版型會覆蓋目前的設計內容</li>
        </ul>
      </div>
    </div>
  );
};

TemplatePanel.propTypes = {
  availableTemplates: PropTypes.array.isRequired,
  loadingTemplates: PropTypes.bool.isRequired,
  applyTemplate: PropTypes.func.isRequired,
};

export default TemplatePanel;
