import React from 'react';
import PropTypes from 'prop-types';

/**
 * 工具面板容器組件
 * 渲染展開的工具面板，包含標題、描述和具體內容
 */
const ToolPanel = ({ tool, children }) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">
          {tool.icon}
        </span>
        <div>
          <h3 className="font-semibold text-gray-900">
            {tool.label}
          </h3>
          <p className="text-sm text-gray-600">
            {tool.description}
          </p>
        </div>
      </div>

      {/* Tool-specific content */}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

ToolPanel.propTypes = {
  tool: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    description: PropTypes.string,
  }).isRequired,
  children: PropTypes.node,
};

export default ToolPanel;
