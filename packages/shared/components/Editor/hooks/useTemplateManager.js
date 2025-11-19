import { useState, useCallback, useEffect } from 'react';
import { API } from '../../../services/api';

/**
 * 版型管理 Hook
 * 處理版型載入和應用
 */
const useTemplateManager = (currentProduct, mode, showTemplateTools, editorState) => {
  const { setDesignElements, setBackgroundColor } = editorState;

  // 可用版型列表
  const [availableTemplates, setAvailableTemplates] = useState([]);
  // 載入中狀態
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  /**
   * 載入可用版型列表
   */
  const loadAvailableTemplates = useCallback(async () => {
    if (!currentProduct) return;

    setLoadingTemplates(true);
    try {
      const templates = await API.templates.getByProductId(currentProduct.id);
      setAvailableTemplates(templates);
    } catch (error) {
      console.error('載入版型失敗:', error);
      alert('載入版型失敗，請重試');
    } finally {
      setLoadingTemplates(false);
    }
  }, [currentProduct]);

  /**
   * 應用版型
   * @param {Object} template - 版型對象
   */
  const applyTemplate = useCallback((template) => {
    if (!template) return;

    // 檢查是否有現有元素
    const hasExistingElements = editorState.designElements && editorState.designElements.length > 0;

    if (hasExistingElements) {
      const confirmOverwrite = window.confirm(
        '應用版型將會覆蓋目前的設計，確定要繼續嗎？'
      );
      if (!confirmOverwrite) return;
    }

    // 應用版型的元素和背景色
    if (template.elements) {
      // 為所有模板元素添加標記，禁止替換和去背
      const elementsWithTemplateFlag = template.elements.map(element => ({
        ...element,
        isFromTemplate: true
      }));
      setDesignElements(elementsWithTemplateFlag);
    }

    if (template.backgroundColor) {
      setBackgroundColor(template.backgroundColor);
    }

    console.log('版型已應用:', template.name);
  }, [editorState.designElements, setDesignElements, setBackgroundColor]);

  // 當產品、模式或版型工具顯示狀態改變時，重新載入版型
  useEffect(() => {
    // 在 product 模式下且顯示版型工具時載入版型
    if (mode === 'product' && showTemplateTools && currentProduct) {
      loadAvailableTemplates();
    }
  }, [mode, showTemplateTools, currentProduct, loadAvailableTemplates]);

  return {
    availableTemplates,
    loadingTemplates,
    loadAvailableTemplates,
    applyTemplate,
  };
};

export default useTemplateManager;
