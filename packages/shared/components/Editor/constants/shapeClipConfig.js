/**
 * 形狀裁切配置
 * 定義各種形狀的 clip-path 值和相關資訊
 */

// 形狀分類
export const SHAPE_CATEGORIES = {
  basic: '基本形狀',
  polygon: '多邊形',
  special: '特殊形狀',
};

// 形狀定義
export const SHAPE_CLIPS = {
  // ==================== 基本形狀 ====================
  circle: {
    id: 'circle',
    name: '圓形',
    category: 'basic',
    clipPath: 'circle(50% at 50% 50%)',
    // SVG path 用於預覽圖示
    svgPath: 'M50,0 A50,50 0 1,1 50,100 A50,50 0 1,1 50,0',
  },
  ellipse: {
    id: 'ellipse',
    name: '橢圓',
    category: 'basic',
    clipPath: 'ellipse(50% 40% at 50% 50%)',
    svgPath: 'M50,10 A40,30 0 1,1 50,90 A40,30 0 1,1 50,10',
  },
  triangle: {
    id: 'triangle',
    name: '三角形',
    category: 'basic',
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    svgPath: 'M50,0 L0,100 L100,100 Z',
  },
  triangleDown: {
    id: 'triangleDown',
    name: '倒三角形',
    category: 'basic',
    clipPath: 'polygon(0% 0%, 100% 0%, 50% 100%)',
    svgPath: 'M0,0 L100,0 L50,100 Z',
  },
  diamond: {
    id: 'diamond',
    name: '菱形',
    category: 'basic',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    svgPath: 'M50,0 L100,50 L50,100 L0,50 Z',
  },

  // ==================== 多邊形 ====================
  pentagon: {
    id: 'pentagon',
    name: '五邊形',
    category: 'polygon',
    clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    svgPath: 'M50,0 L100,38 L82,100 L18,100 L0,38 Z',
  },
  hexagon: {
    id: 'hexagon',
    name: '六邊形',
    category: 'polygon',
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    svgPath: 'M25,0 L75,0 L100,50 L75,100 L25,100 L0,50 Z',
  },
  octagon: {
    id: 'octagon',
    name: '八邊形',
    category: 'polygon',
    clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
    svgPath: 'M30,0 L70,0 L100,30 L100,70 L70,100 L30,100 L0,70 L0,30 Z',
  },

  // ==================== 特殊形狀 ====================
  star: {
    id: 'star',
    name: '星形',
    category: 'special',
    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    svgPath: 'M50,0 L61,35 L98,35 L68,57 L79,91 L50,70 L21,91 L32,57 L2,35 L39,35 Z',
  },
  heart: {
    id: 'heart',
    name: '愛心',
    category: 'special',
    // 使用 SVG path 實現更精確的愛心形狀
    // 原始路徑基於 24x24 viewBox，需要正規化到 0-1 用於 objectBoundingBox
    clipType: 'path',
    // 正規化到 0-1 座標 (原始座標除以 24)
    normalizedPath: 'M0.5 0.184 c-0.118 -0.237 -0.5 -0.169 -0.5 0.136 0 0.303 0.413 0.456 0.5 0.638 0.087 -0.182 0.5 -0.335 0.5 -0.638 0 -0.305 -0.382 -0.374 -0.5 -0.136 z',
    // SVG 預覽用路徑 (100x100 viewBox)
    svgPath: 'M50 18.4 c-11.8 -23.7 -50 -16.9 -50 13.6 0 30.3 41.3 45.6 50 63.8 8.7 -18.2 50 -33.5 50 -63.8 0 -30.5 -38.2 -37.4 -50 -13.6 z',
    // 兼容舊邏輯的 clipPath (使用 url 引用)
    clipPath: 'url(#shape-clip-heart)',
  },
  speechBubble: {
    id: 'speechBubble',
    name: '對話框',
    category: 'special',
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 70%, 30% 70%, 15% 100%, 20% 70%, 0% 70%)',
    svgPath: 'M0,0 L100,0 L100,70 L30,70 L15,100 L20,70 L0,70 Z',
  },
  roundedRect: {
    id: 'roundedRect',
    name: '圓角矩形',
    category: 'special',
    clipPath: 'inset(0% round 15%)',
    svgPath: 'M15,0 L85,0 Q100,0 100,15 L100,85 Q100,100 85,100 L15,100 Q0,100 0,85 L0,15 Q0,0 15,0 Z',
  },
};

// 取得所有形狀（按分類分組）
export const getShapesByCategory = () => {
  const result = {};

  Object.keys(SHAPE_CATEGORIES).forEach(category => {
    result[category] = Object.values(SHAPE_CLIPS).filter(
      shape => shape.category === category
    );
  });

  return result;
};

// 取得所有形狀列表
export const getAllShapes = () => Object.values(SHAPE_CLIPS);

// 根據 ID 取得形狀
export const getShapeById = (shapeId) => SHAPE_CLIPS[shapeId] || null;

// 取得需要 SVG clipPath 定義的形狀（clipType === 'path'）
export const getPathTypeShapes = () =>
  Object.values(SHAPE_CLIPS).filter(shape => shape.clipType === 'path');

export default SHAPE_CLIPS;
