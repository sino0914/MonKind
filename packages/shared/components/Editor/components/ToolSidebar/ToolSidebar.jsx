import React from 'react';
import PropTypes from 'prop-types';
import ToolIcon from './ToolIcon';
import ToolPanel from './ToolPanel';

/**
 * 工具側邊欄主組件
 * 組合工具圖標和工具面板，提供可展開/收縮的側邊欄功能
 */
const ToolSidebar = ({
  tools,
  currentTool,
  hoveredTool,
  selectedTool,
  setHoveredTool,
  setSelectedTool,
  children
}) => {
  // 處理整個側邊欄區域的 hover
  const handleSidebarMouseEnter = () => {
    // 當滑鼠進入側邊欄區域時，如果還沒有 hoveredTool，設置第一個工具
    if (!hoveredTool && !selectedTool && tools.length > 0) {
      setHoveredTool(tools[0].id);
    }
  };

  const handleSidebarMouseLeave = () => {
    // 只有當沒有選中的工具時，才清除 hover 狀態
    if (!selectedTool) {
      setHoveredTool(null);
    }
  };

  return (
    <div
      className="bg-white border-r border-gray-200 transition-all duration-300 ease-in-out"
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
    >
      <div className="flex">
        {/* Tool Icons */}
        <div className="w-16 bg-gray-50 border-r border-gray-200">
          <div className="p-2 space-y-1">
            {tools.map((tool) => (
              <ToolIcon
                key={tool.id}
                tool={tool}
                isHovered={hoveredTool === tool.id}
                isSelected={selectedTool === tool.id}
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => {}} // 移除單個圖標的 onMouseLeave，改由整個側邊欄控制
                onClick={() =>
                  setSelectedTool(selectedTool === tool.id ? null : tool.id)
                }
              />
            ))}
          </div>
        </div>

        {/* Expanded Tool Panel */}
        <div
          className={`bg-white transition-all duration-300 ease-in-out overflow-hidden ${
            hoveredTool || selectedTool ? "w-80" : "w-0"
          }`}
        >
          {(hoveredTool || selectedTool) && (
            <div className="p-4 w-80">
              {currentTool && (
                <ToolPanel tool={currentTool}>
                  {children}
                </ToolPanel>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ToolSidebar.propTypes = {
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
      description: PropTypes.string,
    })
  ).isRequired,
  currentTool: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    description: PropTypes.string,
  }),
  hoveredTool: PropTypes.string,
  selectedTool: PropTypes.string,
  setHoveredTool: PropTypes.func.isRequired,
  setSelectedTool: PropTypes.func.isRequired,
  children: PropTypes.node,
};

export default ToolSidebar;
