/**
 * 商品背景图和出血区域映射验证器
 * 提供背景图URL、映射配置和边界约束验证
 */

/**
 * 验证背景图URL有效性
 * @param {string} url - 背景图URL
 * @returns {Object} {valid: boolean, error: string|null}
 */
export function validateBackgroundImageUrl(url) {
  if (!url) {
    return { valid: false, error: '背景图URL不能为空' };
  }

  if (typeof url !== 'string') {
    return { valid: false, error: '背景图URL必须是字符串' };
  }

  // 检查URL格式：必须是完整URL（http:// 或 https://）
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, error: `背景图URL必须是完整URL (http:// 或 https://): ${url}` };
  }

  try {
    new URL(url);
    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: `背景图URL格式无效: ${url}` };
  }
}

/**
 * 验证映射配置的基础有效性
 * @param {Object} mapping - 出血区映射配置
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateBleedAreaMapping(mapping) {
  const errors = [];

  if (!mapping) {
    return { valid: true, errors: [] }; // 映射配置可选
  }

  // 验证 centerX
  if (typeof mapping.centerX !== 'number') {
    errors.push('centerX 必须是数字');
  } else if (mapping.centerX < 0 || mapping.centerX > 100) {
    errors.push('centerX 必须在 0-100% 之间');
  }

  // 验证 centerY
  if (typeof mapping.centerY !== 'number') {
    errors.push('centerY 必须是数字');
  } else if (mapping.centerY < 0 || mapping.centerY > 100) {
    errors.push('centerY 必须在 0-100% 之间');
  }

  // 验证 scale
  if (typeof mapping.scale !== 'number') {
    errors.push('scale 必须是数字');
  } else if (mapping.scale <= 0) {
    errors.push('scale 必须大于 0');
  } else if (mapping.scale > 5) {
    errors.push('scale 不能超过 5');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证映射配置是否会导致出血区超出背景图边界
 * @param {Object} mapping - 出血区映射配置
 * @param {Object} product - 产品数据（包含 printArea, bleedArea）
 * @param {number} displaySize - 背景图显示尺寸（默认 400）
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateMappingBounds(mapping, product, displaySize = 400) {
  const errors = [];

  if (!mapping || !product || !product.printArea) {
    return { valid: true, errors: [] };
  }

  try {
    // 获取出血区在设计空间中的边界
    const { calculateBleedBounds } = require('../../shared/utils/bleedAreaUtils.js');
    const designBleedBounds = calculateBleedBounds(product.printArea, product.bleedArea);

    // 计算映射后的出血区边界
    const mappedBounds = mapBleedAreaToBackground(
      product.bleedArea,
      product.printArea,
      mapping,
      displaySize
    );

    // 检查是否超出背景图边界
    if (mappedBounds.x < 0) {
      errors.push(`出血区左侧超出背景图边界 ${Math.abs(mappedBounds.x).toFixed(1)}px`);
    }
    if (mappedBounds.y < 0) {
      errors.push(`出血区上侧超出背景图边界 ${Math.abs(mappedBounds.y).toFixed(1)}px`);
    }
    if (mappedBounds.x + mappedBounds.width > displaySize) {
      errors.push(`出血区右侧超出背景图边界 ${(mappedBounds.x + mappedBounds.width - displaySize).toFixed(1)}px`);
    }
    if (mappedBounds.y + mappedBounds.height > displaySize) {
      errors.push(`出血区下侧超出背景图边界 ${(mappedBounds.y + mappedBounds.height - displaySize).toFixed(1)}px`);
    }
  } catch (e) {
    console.error('验证映射边界时出错:', e);
    return { valid: false, errors: ['映射边界计算错误'] };
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 验证完整的背景图配置
 * @param {Object} backgroundImage - 背景图配置
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateProductBackgroundImage(backgroundImage) {
  const errors = [];

  if (!backgroundImage) {
    return { valid: true, errors: [] }; // 背景图可选
  }

  // 验证 URL
  const urlValidation = validateBackgroundImageUrl(backgroundImage.url);
  if (!urlValidation.valid) {
    errors.push(urlValidation.error);
  }

  // 验证文件信息
  if (backgroundImage.fileInfo) {
    if (!backgroundImage.fileInfo.filename) {
      errors.push('背景图文件名不能为空');
    }
    if (backgroundImage.fileInfo.size && backgroundImage.fileInfo.size <= 0) {
      errors.push('背景图文件大小必须大于 0');
    }
  }

  // 验证上传时间戳
  if (backgroundImage.uploadedAt) {
    try {
      new Date(backgroundImage.uploadedAt);
    } catch (e) {
      errors.push('上传时间戳格式无效');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 生成默认的映射配置
 * @returns {Object} 默认映射配置
 */
export function createDefaultBleedAreaMapping() {
  return {
    enabled: true,
    centerX: 50,        // 中心位置（百分比）
    centerY: 50,
    scale: 1.0,         // 等比缩放比例
    appliedAt: new Date().toISOString(),
    version: 1
  };
}

/**
 * 约束映射配置到有效范围
 * @param {Object} mapping - 出血区映射配置
 * @param {number} minScale - 最小缩放（默认 0.1）
 * @param {number} maxScale - 最大缩放（默认 5）
 * @returns {Object} 约束后的映射配置
 */
export function constrainBleedMapping(mapping, minScale = 0.1, maxScale = 5) {
  if (!mapping) {
    return createDefaultBleedAreaMapping();
  }

  return {
    enabled: mapping.enabled !== false,
    centerX: Math.max(0, Math.min(100, mapping.centerX || 50)),
    centerY: Math.max(0, Math.min(100, mapping.centerY || 50)),
    scale: Math.max(minScale, Math.min(maxScale, mapping.scale || 1.0)),
    appliedAt: mapping.appliedAt || new Date().toISOString(),
    version: mapping.version || 1
  };
}

/**
 * 计算出血区在背景图中的映射边界（用于验证）
 * 这是一个简化版本，完整版本在 bleedAreaMappingUtils.js 中
 * @param {Object} bleedArea - 出血区配置
 * @param {Object} printArea - 设计区配置
 * @param {Object} mapping - 映射配置
 * @param {number} displaySize - 显示尺寸
 * @returns {Object} 映射后的边界
 */
export function mapBleedAreaToBackground(bleedArea, printArea, mapping, displaySize = 400) {
  try {
    const { calculateBleedBounds } = require('../../shared/utils/bleedAreaUtils.js');
    const designBounds = calculateBleedBounds(printArea, bleedArea);

    // 标准化坐标 [0, 1]
    const normX = designBounds.x / displaySize;
    const normY = designBounds.y / displaySize;
    const normW = designBounds.width / displaySize;
    const normH = designBounds.height / displaySize;

    // 出血区原始中心点
    const centerNormX = normX + normW / 2;
    const centerNormY = normY + normH / 2;

    // 相对于中心应用缩放
    const scaledX = (normX - 0.5) * mapping.scale + 0.5;
    const scaledY = (normY - 0.5) * mapping.scale + 0.5;
    const scaledW = normW * mapping.scale;
    const scaledH = normH * mapping.scale;

    // 应用平移（中心位置）
    const targetCenterX = mapping.centerX / 100;
    const targetCenterY = mapping.centerY / 100;

    const finalX = scaledX + (targetCenterX - 0.5);
    const finalY = scaledY + (targetCenterY - 0.5);

    // 转换回像素坐标
    return {
      x: Math.round(finalX * displaySize),
      y: Math.round(finalY * displaySize),
      width: Math.round(scaledW * displaySize),
      height: Math.round(scaledH * displaySize)
    };
  } catch (e) {
    console.error('计算映射边界失败:', e);
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/**
 * 验证完整的产品背景配置（背景图 + 映射）
 * @param {Object} product - 产品数据
 * @returns {Object} {valid: boolean, backgroundImageErrors: string[], mappingErrors: string[]}
 */
export function validateProductBackgroundConfig(product) {
  const backgroundImageErrors = [];
  const mappingErrors = [];

  if (!product) {
    return { valid: true, backgroundImageErrors, mappingErrors };
  }

  // 验证背景图
  if (product.productBackgroundImage) {
    const bgValidation = validateProductBackgroundImage(product.productBackgroundImage);
    if (!bgValidation.valid) {
      backgroundImageErrors.push(...bgValidation.errors);
    }
  }

  // 验证映射配置
  if (product.bleedAreaMapping) {
    const mappingValidation = validateBleedAreaMapping(product.bleedAreaMapping);
    if (!mappingValidation.valid) {
      mappingErrors.push(...mappingValidation.errors);
    }

    // 验证映射边界
    const boundsValidation = validateMappingBounds(
      product.bleedAreaMapping,
      product,
      400
    );
    if (!boundsValidation.valid) {
      mappingErrors.push(...boundsValidation.errors);
    }
  }

  return {
    valid: backgroundImageErrors.length === 0 && mappingErrors.length === 0,
    backgroundImageErrors,
    mappingErrors
  };
}

/**
 * 合并产品更新中的背景配置
 * @param {Object} currentProduct - 当前产品数据
 * @param {Object} updateData - 更新数据
 * @returns {Object} 合并后的产品数据
 */
/**
 * 轉換相對路徑為完整URL
 * @param {string} url - 可能是相對或完整URL
 * @returns {string} 完整URL
 */
function normalizeImageUrl(url) {
  if (!url) return null;

  // 如果已是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 如果是相對路徑，補充完整URL
  if (url.startsWith('/')) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3002';
    return `${baseUrl}${url}`;
  }

  return url;
}

export function mergeBackgroundConfig(currentProduct, updateData) {
  const merged = { ...currentProduct };

  // 更新背景图
  if (updateData.productBackgroundImage !== undefined) {
    if (updateData.productBackgroundImage === null) {
      delete merged.productBackgroundImage;
    } else {
      merged.productBackgroundImage = {
        ...currentProduct?.productBackgroundImage,
        ...updateData.productBackgroundImage,
        uploadedAt: updateData.productBackgroundImage.uploadedAt || new Date().toISOString()
      };

      // 確保URL是完整URL（修復相對路徑）
      if (merged.productBackgroundImage.url) {
        merged.productBackgroundImage.url = normalizeImageUrl(merged.productBackgroundImage.url);
      }
    }
  }

  // 更新映射配置
  if (updateData.bleedAreaMapping !== undefined) {
    if (updateData.bleedAreaMapping === null) {
      delete merged.bleedAreaMapping;
    } else {
      merged.bleedAreaMapping = {
        ...currentProduct?.bleedAreaMapping,
        ...updateData.bleedAreaMapping,
        appliedAt: new Date().toISOString(),
        version: (currentProduct?.bleedAreaMapping?.version || 0) + 1
      };
    }
  }

  return merged;
}
