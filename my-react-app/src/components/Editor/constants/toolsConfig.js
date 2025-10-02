// 工具配置

export const createTools = (showTemplateTools = true) => {
  const tools = [];

  if (showTemplateTools) {
    tools.push({
      id: "template",
      icon: "📐",
      label: "版型",
      description: "選擇設計模板",
    });
  }

  tools.push(
    { id: "elements", icon: "✨", label: "元素", description: "添加裝飾元素" },
    { id: "text", icon: "➕", label: "文字", description: "添加文字內容" },
    { id: "image", icon: "🖼️", label: "照片", description: "上傳圖片" },
    {
      id: "background",
      icon: "🎨",
      label: "底色",
      description: "設定背景顏色",
    },
    { id: "layers", icon: "📑", label: "圖層", description: "管理圖層順序" }
  );

  return tools;
};

export const TOOLS = createTools();
