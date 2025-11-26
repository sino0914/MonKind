/**
 * 出血区域映射坐标变换工具库
 * 处理设计坐标系到背景图坐标系的转换
 */

import { calculateBleedBounds, getBleedValues } from '../../../utils/bleedAreaUtils.js';

/**
 * 将设计坐标映射到背景图坐标系统
 * 输入：设计空间坐标 (x, y) - 基于 400x400 画布
 * 输出：背景图显示坐标 (display_x, display_y)
 *
 * 变换公式：
 * 1. 标准化到 [0, 1]
 * 2. 相对出血区中心应用缩放
 * 3. 应用平移（新中心位置）
 * 4. 转换回显示坐标 [0, 400]
 *
 * @param {number} x - 设计坐标 X
 * @param {number} y - 设计坐标 Y
 * @param {Object} product - 产品数据 {printArea, bleedArea}
 * @param {Object} bleedAreaMapping - 映射配置 {centerX, centerY, scale}
 * @param {number} displaySize - 显示尺寸（默认 400）
 * @returns {Object} {x, y} - 映射后的坐标
 */
export function mapDesignToBackground(x, y, product, bleedAreaMapping, displaySize = 400) {
  if (!product || !product.printArea || !bleedAreaMapping) {
    return { x, y };
  }

  try {
    // 获取出血区在设计空间中的边界
    const designBleedBounds = calculateBleedBounds(product.printArea, product.bleedArea);

    // 计算出血区的原始中心点（在设计空间）
    const bleedCenterX = designBleedBounds.x + designBleedBounds.width / 2;
    const bleedCenterY = designBleedBounds.y + designBleedBounds.height / 2;

    // 步骤1：标准化到 [0, 1]
    const normX = x / displaySize;
    const normY = y / displaySize;
    const normBleedCenterX = bleedCenterX / displaySize;
    const normBleedCenterY = bleedCenterY / displaySize;

    // 步骤2：相对出血区中心应用缩放
    const scale = bleedAreaMapping.scale || 1.0;
    const scaledX = (normX - 0.5) * scale + 0.5;
    const scaledY = (normY - 0.5) * scale + 0.5;

    // 步骤3：应用平移（中心位置）
    const targetCenterX = bleedAreaMapping.centerX / 100;
    const targetCenterY = bleedAreaMapping.centerY / 100;

    const offsetX = targetCenterX - 0.5;
    const offsetY = targetCenterY - 0.5;

    const finalX = scaledX + offsetX;
    const finalY = scaledY + offsetY;

    // 步骤4：转换回显示坐标
    const displayX = finalX * displaySize;
    const displayY = finalY * displaySize;

    return {
      x: displayX,
      y: displayY
    };
  } catch (e) {
    console.error('设计坐标映射失败:', e);
    return { x, y };
  }
}

/**
 * 反向映射：从背景图坐标转换回设计坐标
 * 用于处理用户在编辑器中的拖曳操作
 *
 * @param {number} bgX - 背景图坐标 X
 * @param {number} bgY - 背景图坐标 Y
 * @param {Object} product - 产品数据
 * @param {Object} bleedAreaMapping - 映射配置
 * @param {number} displaySize - 显示尺寸（默认 400）
 * @returns {Object} {x, y} - 设计空间坐标
 */
export function mapBackgroundToDesign(bgX, bgY, product, bleedAreaMapping, displaySize = 400) {
  if (!product || !product.printArea || !bleedAreaMapping) {
    return { x: bgX, y: bgY };
  }

  try {
    const scale = bleedAreaMapping.scale || 1.0;
    const targetCenterX = bleedAreaMapping.centerX / 100;
    const targetCenterY = bleedAreaMapping.centerY / 100;

    // 反向步骤4：从显示坐标转回标准化
    const normX = bgX / displaySize;
    const normY = bgY / displaySize;

    // 反向步骤3：移除平移
    const offsetX = targetCenterX - 0.5;
    const offsetY = targetCenterY - 0.5;

    const preTranX = normX - offsetX;
    const preTranY = normY - offsetY;

    // 反向步骤2：移除缩放
    const preScaleX = (preTranX - 0.5) / scale + 0.5;
    const preScaleY = (preTranY - 0.5) / scale + 0.5;

    // 转换回设计坐标
    const designX = preScaleX * displaySize;
    const designY = preScaleY * displaySize;

    return {
      x: designX,
      y: designY
    };
  } catch (e) {
    console.error('背景图坐标反向映射失败:', e);
    return { x: bgX, y: bgY };
  }
}

/**
 * 获取出血区在背景图中的映射边界
 * @param {Object} product - 产品数据 {printArea, bleedArea}
 * @param {Object} bleedAreaMapping - 映射配置
 * @param {number} displaySize - 显示尺寸（默认 400）
 * @returns {Object} 映射后的边界 {x, y, width, height, centerX, centerY}
 */
export function getBleedBoundsInBackground(product, bleedAreaMapping, displaySize = 400) {
  if (!product || !product.printArea || !bleedAreaMapping) {
    return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  try {
    // 获取设计空间中的出血区边界
    const designBleedBounds = calculateBleedBounds(product.printArea, product.bleedArea);

    // 四个角的坐标
    const corners = [
      { x: designBleedBounds.x, y: designBleedBounds.y },                                    // 左上
      { x: designBleedBounds.x + designBleedBounds.width, y: designBleedBounds.y },          // 右上
      { x: designBleedBounds.x + designBleedBounds.width, y: designBleedBounds.y + designBleedBounds.height }, // 右下
      { x: designBleedBounds.x, y: designBleedBounds.y + designBleedBounds.height }          // 左下
    ];

    // 映射所有角点
    const mappedCorners = corners.map(corner =>
      mapDesignToBackground(corner.x, corner.y, product, bleedAreaMapping, displaySize)
    );

    // 计算映射后的边界（AABB - 轴对齐边界框）
    const xs = mappedCorners.map(c => c.x);
    const ys = mappedCorners.map(c => c.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX;
    const height = maxY - minY;

    return {
      x: minX,
      y: minY,
      width: width,
      height: height,
      centerX: minX + width / 2,
      centerY: minY + height / 2,
      // 保留原始信息用于调试
      mappedCorners: mappedCorners
    };
  } catch (e) {
    console.error('计算背景图边界失败:', e);
    return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }
}

/**
 * 计算Canvas变换参数（用于Canvas.transform()）
 * @param {Object} product - 产品数据
 * @param {Object} bleedAreaMapping - 映射配置
 * @param {number} displaySize - 显示尺寸
 * @returns {Object} 变换参数 {translateX, translateY, scaleX, scaleY}
 */
export function getBleedMappingTransform(product, bleedAreaMapping, displaySize = 400) {
  if (!product || !product.printArea || !bleedAreaMapping) {
    return { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 };
  }

  try {
    const designBleedBounds = calculateBleedBounds(product.printArea, product.bleedArea);
    const bleedCenterX = designBleedBounds.x + designBleedBounds.width / 2;
    const bleedCenterY = designBleedBounds.y + designBleedBounds.height / 2;

    // 标准化中心点
    const normCenterX = bleedCenterX / displaySize;
    const normCenterY = bleedCenterY / displaySize;

    // 新中心位置
    const targetCenterX = bleedAreaMapping.centerX / 100;
    const targetCenterY = bleedAreaMapping.centerY / 100;

    // 缩放比例
    const scale = bleedAreaMapping.scale || 1.0;

    // 计算平移量（相对于中心缩放）
    const translateX = (targetCenterX - normCenterX) * displaySize;
    const translateY = (targetCenterY - normCenterY) * displaySize;

    return {
      translateX: translateX,
      translateY: translateY,
      scaleX: scale,
      scaleY: scale,
      // 以中心点为基准
      originX: bleedCenterX,
      originY: bleedCenterY
    };
  } catch (e) {
    console.error('计算变换参数失败:', e);
    return { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1 };
  }
}

/**
 * 验证映射配置的有效性（多维检查）
 * @param {Object} mapping - 映射配置
 * @param {Object} product - 产品数据
 * @param {number} displaySize - 显示尺寸
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateBleedAreaMapping(mapping, product, displaySize = 400) {
  const errors = [];

  if (!mapping || !product || !product.printArea) {
    return { valid: true, errors: [] };
  }

  // 基础参数验证
  if (typeof mapping.centerX !== 'number' || mapping.centerX < 0 || mapping.centerX > 100) {
    errors.push('中心X位置必须在 0-100% 之间');
  }

  if (typeof mapping.centerY !== 'number' || mapping.centerY < 0 || mapping.centerY > 100) {
    errors.push('中心Y位置必须在 0-100% 之间');
  }

  if (typeof mapping.scale !== 'number' || mapping.scale <= 0 || mapping.scale > 5) {
    errors.push('缩放比例必须在 0-5 之间');
  }

  // 检查映射后的出血区是否超出背景图边界
  try {
    const mappedBounds = getBleedBoundsInBackground(product, mapping, displaySize);
    const tolerance = 1; // 允许1px的误差

    if (mappedBounds.x < -tolerance) {
      errors.push(`出血区左侧超出背景图 ${Math.abs(mappedBounds.x).toFixed(1)}px`);
    }
    if (mappedBounds.y < -tolerance) {
      errors.push(`出血区上侧超出背景图 ${Math.abs(mappedBounds.y).toFixed(1)}px`);
    }
    if (mappedBounds.x + mappedBounds.width > displaySize + tolerance) {
      errors.push(`出血区右侧超出背景图 ${(mappedBounds.x + mappedBounds.width - displaySize).toFixed(1)}px`);
    }
    if (mappedBounds.y + mappedBounds.height > displaySize + tolerance) {
      errors.push(`出血区下侧超出背景图 ${(mappedBounds.y + mappedBounds.height - displaySize).toFixed(1)}px`);
    }
  } catch (e) {
    console.error('验证映射边界时出错:', e);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 约束映射配置到有效范围，同时保持映射内出血区不超出背景图边界
 * @param {Object} mapping - 原始映射配置
 * @param {Object} product - 产品数据
 * @param {number} displaySize - 显示尺寸
 * @returns {Object} 约束后的映射配置
 */
export function constrainBleedMapping(mapping, product, displaySize = 400) {
  if (!mapping || !product || !product.printArea) {
    return mapping;
  }

  let constrained = {
    ...mapping,
    centerX: Math.max(0, Math.min(100, mapping.centerX || 50)),
    centerY: Math.max(0, Math.min(100, mapping.centerY || 50)),
    scale: Math.max(0.1, Math.min(5, mapping.scale || 1.0))
  };

  // 检查约束后是否超出边界
  const validation = validateBleedAreaMapping(constrained, product, displaySize);
  if (!validation.valid && validation.errors.length > 0) {
    console.warn('约束后的映射仍然超出边界:', validation.errors);
    // 可选：进一步调整参数或返回警告
  }

  return constrained;
}

/**
 * 计算映射中心点到鼠标的距离（用于判断是否点中中心点）
 * @param {number} mouseX - 鼠标X坐标
 * @param {number} mouseY - 鼠标Y坐标
 * @param {Object} product - 产品数据
 * @param {Object} bleedAreaMapping - 映射配置
 * @param {number} displaySize - 显示尺寸
 * @returns {number} 距离
 */
export function distanceToMappingCenter(mouseX, mouseY, product, bleedAreaMapping, displaySize = 400) {
  const bounds = getBleedBoundsInBackground(product, bleedAreaMapping, displaySize);
  const dx = mouseX - bounds.centerX;
  const dy = mouseY - bounds.centerY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 判断点是否在映射的出血区内
 * @param {number} x - 点的X坐标
 * @param {number} y - 点的Y坐标
 * @param {Object} product - 产品数据
 * @param {Object} bleedAreaMapping - 映射配置
 * @param {number} displaySize - 显示尺寸
 * @returns {boolean}
 */
export function isPointInMappedBleedArea(x, y, product, bleedAreaMapping, displaySize = 400) {
  const bounds = getBleedBoundsInBackground(product, bleedAreaMapping, displaySize);
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

/**
 * 生成默认的映射配置
 * @returns {Object} 默认映射配置
 */
export function createDefaultBleedAreaMapping() {
  return {
    enabled: true,
    centerX: 50,
    centerY: 50,
    scale: 1.0,
    appliedAt: new Date().toISOString(),
    version: 1
  };
}
