import { useState, useCallback, useRef, useMemo } from 'react';
import {
  mapDesignToBackground,
  mapBackgroundToDesign,
  getBleedBoundsInBackground,
  constrainBleedMapping,
  distanceToMappingCenter,
  validateBleedAreaMapping,
  createDefaultBleedAreaMapping
} from '../utils/bleedAreaMappingUtils.js';

/**
 * 映射编辑 Hook
 * 管理出血区映射配置的编辑状态、拖曳交互、约束计算
 *
 * @param {Object} product - 产品数据 {printArea, bleedArea}
 * @param {Object} initialMapping - 初始映射配置
 * @param {function} onMappingChange - 映射配置变更回调
 * @param {number} displaySize - 显示尺寸（默认 400）
 * @returns {Object} Hook 返回对象
 */
const useBleedAreaMapping = (product, initialMapping, onMappingChange, displaySize = 400) => {
  // 映射配置状态（编辑中的临时数据）
  const [mapping, setMapping] = useState(
    initialMapping || createDefaultBleedAreaMapping()
  );

  // 拖曳状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'center' | 'corner-tl' | 'corner-tr' | 'corner-br' | 'corner-bl'

  // 拖曳的初始数据
  const dragStateRef = useRef({
    startMouseX: 0,
    startMouseY: 0,
    startMapping: null,
    draggedCorner: null
  });

  // 缓存的变换计算结果
  const [cachedBounds, setCachedBounds] = useState(null);

  // 验证结果缓存
  const validationResult = useMemo(
    () => validateBleedAreaMapping(mapping, product, displaySize),
    [mapping, product, displaySize]
  );

  /**
   * 更新映射配置（带验证和约束）
   */
  const updateMapping = useCallback((newMapping) => {
    const constrained = constrainBleedMapping(newMapping, product, displaySize);
    setMapping(constrained);
    onMappingChange?.(constrained);
  }, [product, displaySize, onMappingChange]);

  /**
   * 处理中心点拖曳开始
   */
  const handleCenterDragStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType('center');

    dragStateRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startMapping: { ...mapping },
      draggedCorner: null
    };
  }, [mapping]);

  /**
   * 处理角点拖曳开始
   */
  const handleCornerDragStart = useCallback((corner, e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(`corner-${corner}`);

    dragStateRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startMapping: { ...mapping },
      draggedCorner: corner
    };
  }, [mapping]);

  /**
   * 处理拖曳移动
   */
  const handleDragMove = useCallback((e) => {
    if (!isDragging || !dragStateRef.current.startMapping) {
      return;
    }

    e.preventDefault();

    const deltaX = e.clientX - dragStateRef.current.startMouseX;
    const deltaY = e.clientY - dragStateRef.current.startMouseY;

    const startMapping = dragStateRef.current.startMapping;
    const bounds = getBleedBoundsInBackground(product, startMapping, displaySize);

    if (dragType === 'center') {
      // 拖曳中心点
      const pixelToCenterPercent = displaySize / 100; // 像素到百分比的转换
      const newCenterX = startMapping.centerX + (deltaX / pixelToCenterPercent);
      const newCenterY = startMapping.centerY + (deltaY / pixelToCenterPercent);

      updateMapping({
        ...startMapping,
        centerX: newCenterX,
        centerY: newCenterY
      });
    } else if (dragType && dragType.startsWith('corner-')) {
      // 拖曳角点进行缩放
      handleCornerScaling(startMapping, bounds, deltaX, deltaY);
    }
  }, [isDragging, dragType, product, displaySize, updateMapping]);

  /**
   * 处理角点缩放
   */
  const handleCornerScaling = (startMapping, bounds, deltaX, deltaY) => {
    // 计算相对于中心的距离变化
    const originalDistance = Math.sqrt(
      Math.pow(bounds.width / 2, 2) + Math.pow(bounds.height / 2, 2)
    );

    // 使用deltaX计算缩放（通常X方向的拖曳表示整体缩放）
    const scaleFactor = 1 + (deltaX / displaySize);
    const newScale = Math.max(0.1, startMapping.scale * scaleFactor);

    updateMapping({
      ...startMapping,
      scale: newScale
    });
  };

  /**
   * 处理拖曳结束
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    dragStateRef.current = {
      startMouseX: 0,
      startMouseY: 0,
      startMapping: null,
      draggedCorner: null
    };
  }, []);

  /**
   * 更新中心位置（数值输入）
   */
  const setCenterX = useCallback((value) => {
    const num = Math.max(0, Math.min(100, parseFloat(value) || 0));
    updateMapping({ ...mapping, centerX: num });
  }, [mapping, updateMapping]);

  const setCenterY = useCallback((value) => {
    const num = Math.max(0, Math.min(100, parseFloat(value) || 0));
    updateMapping({ ...mapping, centerY: num });
  }, [mapping, updateMapping]);

  /**
   * 更新缩放（数值输入）
   */
  const setScale = useCallback((value) => {
    const num = Math.max(0.1, Math.min(5, parseFloat(value) || 1.0));
    updateMapping({ ...mapping, scale: num });
  }, [mapping, updateMapping]);

  /**
   * 重置为默认值
   */
  const resetMapping = useCallback(() => {
    const defaultMapping = createDefaultBleedAreaMapping();
    updateMapping(defaultMapping);
  }, [updateMapping]);

  /**
   * 应用映射配置
   */
  const applyMapping = useCallback(() => {
    // 确保映射有效
    if (!validationResult.valid) {
      console.warn('映射配置无效，无法应用:', validationResult.errors);
      return false;
    }
    onMappingChange?.(mapping);
    return true;
  }, [mapping, validationResult, onMappingChange]);

  /**
   * 重新计算边界（用于缓存优化）
   */
  const bounds = useMemo(
    () => getBleedBoundsInBackground(product, mapping, displaySize),
    [product, mapping, displaySize]
  );

  /**
   * 判断鼠标是否在中心点区域
   */
  const isMouseNearCenter = useCallback((x, y, threshold = 20) => {
    const distance = distanceToMappingCenter(x, y, product, mapping, displaySize);
    return distance <= threshold;
  }, [product, mapping, displaySize]);

  /**
   * 判断鼠标是否在出血区内
   */
  const isMouseInBleedArea = useCallback((x, y) => {
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }, [bounds]);

  /**
   * 获取映射信息摘要（用于显示）
   */
  const getMappingSummary = useCallback(() => {
    return {
      centerX: mapping.centerX.toFixed(1),
      centerY: mapping.centerY.toFixed(1),
      scale: mapping.scale.toFixed(2),
      width: bounds.width.toFixed(0),
      height: bounds.height.toFixed(0),
      valid: validationResult.valid
    };
  }, [mapping, bounds, validationResult]);

  /**
   * 启用/禁用映射
   */
  const toggleMappingEnabled = useCallback((enabled) => {
    updateMapping({ ...mapping, enabled });
  }, [mapping, updateMapping]);

  return {
    // 状态
    mapping,
    isDragging,
    dragType,
    bounds,
    validationResult,

    // 拖曳处理
    handleCenterDragStart,
    handleCornerDragStart,
    handleDragMove,
    handleDragEnd,

    // 数值更新
    setCenterX,
    setCenterY,
    setScale,

    // 操作
    updateMapping,
    resetMapping,
    applyMapping,
    toggleMappingEnabled,

    // 查询
    isMouseNearCenter,
    isMouseInBleedArea,
    getMappingSummary
  };
};

export default useBleedAreaMapping;
