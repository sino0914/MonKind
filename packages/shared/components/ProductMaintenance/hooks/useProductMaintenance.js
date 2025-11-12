import { useState, useEffect, useCallback } from 'react';
import { API } from '@monkind/shared/services/api';
import { useNotification } from './useNotification';
import { useDesignArea } from './useDesignArea';
import {
  validateProductTitle,
  validateProductPrice,
  validatePrintArea,
  validateBleedArea,
} from '../utils/validationHelpers';

/**
 * useProductMaintenance Hook
 * 集中管理所有產品維護相關的業務邏輯
 */
export const useProductMaintenance = (config = {}) => {
  // === 基礎狀態 ===
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // === UI 狀態 ===
  const [editingProduct, setEditingProduct] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'mug',
    price: 299,
    description: '',
    featured: false,
    isActive: true,
    type: '2D',
  });

  // === UV 測試圖片狀態 ===
  const [uvTestImage, setUvTestImage] = useState(null);

  // === 使用通知和設計區域 Hooks ===
  const { notification, showNotification, showSuccess, showError } = useNotification();

  const {
    tempPrintArea,
    setTempPrintArea,
    tempBleedArea,
    bleedMode,
    isDragging,
    updatePrintArea,
    resetPrintArea,
    enableBleedArea,
    disableBleedArea,
    toggleBleedMode,
    updateBleedArea,
    resetBleedArea,
    startDrag,
    stopDrag,
    handleDragMove,
    validateDesignArea,
  } = useDesignArea();

  // === 載入商品資料 ===
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await API.products.getAll();
      setProducts(productsData);

      if (productsData.length > 0) {
        setSelectedProduct(productsData[0]);
        resetPrintArea(productsData[0].printArea || { x: 50, y: 50, width: 200, height: 150 });

        // 只在啟用出血區域功能時初始化
        if (config.features?.bleedArea) {
          resetBleedArea(productsData[0].bleedArea || null);
        }
      }
    } catch (error) {
      console.error('載入商品失敗:', error);
      setError('載入商品資料失敗: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [config.features?.bleedArea, resetPrintArea, resetBleedArea]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // === 選擇商品 ===
  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setEditingProduct(false);
    resetPrintArea(product.printArea || { x: 50, y: 50, width: 200, height: 150 });

    if (config.features?.bleedArea) {
      resetBleedArea(product.bleedArea || null);
    }
  }, [config.features?.bleedArea, resetPrintArea, resetBleedArea]);

  // === 更新產品屬性 ===
  const handleUpdateProduct = useCallback(async (field, value) => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      const updatedProduct = await API.products.update(selectedProduct.id, {
        [field]: value,
      });

      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      return updatedProduct;
    } catch (error) {
      console.error(`更新${field}失敗:`, error);
      showError(`更新失敗: ${error.message}`);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [selectedProduct, showError]);

  // === 保存設計區域 ===
  const handleSavePrintArea = useCallback(async () => {
    if (!selectedProduct) return;

    // 驗證設計區域
    const printAreaValidation = validatePrintArea(tempPrintArea);
    if (!printAreaValidation.valid) {
      showError(printAreaValidation.message);
      return;
    }

    // 驗證出血區域（如果啟用）
    if (config.features?.bleedArea) {
      const bleedAreaValidation = validateBleedArea(tempBleedArea, tempPrintArea);
      if (!bleedAreaValidation.valid) {
        showError(bleedAreaValidation.message);
        return;
      }
    }

    try {
      setSaving(true);

      const updateData = { printArea: tempPrintArea };

      // 如果啟用出血區域功能，則一併保存
      if (config.features?.bleedArea) {
        updateData.bleedArea = tempBleedArea;
      }

      await API.products.update(selectedProduct.id, updateData);

      setSelectedProduct((prev) => ({ ...prev, ...updateData }));
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? { ...p, ...updateData } : p))
      );

      showSuccess('設計區域已儲存');
    } catch (error) {
      console.error('儲存設計區域失敗:', error);
      showError('儲存失敗: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [selectedProduct, tempPrintArea, tempBleedArea, config.features?.bleedArea, showSuccess, showError]);

  // === 產品類型變更 ===
  const handleProductTypeChange = useCallback(async (newType) => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      const updatedProduct = { ...selectedProduct, type: newType };

      // 如果切換到3D模式，初始化3D資料
      if (newType === '3D' && !selectedProduct.model3D) {
        updatedProduct.model3D = {
          glbUrl: null,
          uvMapping: {
            defaultUV: { u: 0.5, v: 0.5, width: 0.4, height: 0.3 },
            availableUVs: [],
          },
          camera: {
            position: { x: 0, y: 0, z: 5 },
            target: { x: 0, y: 0, z: 0 },
          },
        };
      }

      await API.products.update(selectedProduct.id, updatedProduct);
      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      showSuccess(`產品類型已更新為 ${newType}`);
    } catch (error) {
      console.error('更新產品類型失敗:', error);
      showError('更新產品類型失敗: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [selectedProduct, showSuccess, showError]);

  // === 切換產品啟用狀態 ===
  const handleToggleActive = useCallback(async (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      const newActiveState = !product.isActive;
      await API.products.update(productId, { isActive: newActiveState });

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isActive: newActiveState } : p))
      );

      if (selectedProduct?.id === productId) {
        setSelectedProduct((prev) => ({ ...prev, isActive: newActiveState }));
      }

      showSuccess(newActiveState ? '商品已啟用' : '商品已停用');
    } catch (error) {
      console.error('切換商品狀態失敗:', error);
      showError('操作失敗: ' + error.message);
    }
  }, [products, selectedProduct, showSuccess, showError]);

  // === 新增商品 ===
  const handleAddProduct = useCallback(async () => {
    // 驗證
    const titleValidation = validateProductTitle(newProduct.title);
    if (!titleValidation.valid) {
      showError(titleValidation.message);
      return;
    }

    const priceValidation = validateProductPrice(newProduct.price);
    if (!priceValidation.valid) {
      showError(priceValidation.message);
      return;
    }

    try {
      setSaving(true);
      const createdProduct = await API.products.create(newProduct);

      setProducts((prev) => [...prev, createdProduct]);
      setSelectedProduct(createdProduct);
      resetPrintArea(createdProduct.printArea || { x: 50, y: 50, width: 200, height: 150 });

      if (config.features?.bleedArea) {
        resetBleedArea(null);
      }

      setShowAddModal(false);
      setNewProduct({
        title: '',
        category: 'mug',
        price: 299,
        description: '',
        featured: false,
        isActive: true,
        type: '2D',
      });

      showSuccess('商品已新增');
    } catch (error) {
      console.error('新增商品失敗:', error);
      showError('新增商品失敗: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [newProduct, config.features?.bleedArea, resetPrintArea, resetBleedArea, showSuccess, showError]);

  // === 刪除商品 ===
  const handleDeleteProduct = useCallback(async (productId) => {
    if (!config.permissions?.canDelete) {
      showError('沒有刪除權限');
      return;
    }

    if (!window.confirm('確定要刪除此商品嗎？此操作無法復原。')) {
      return;
    }

    try {
      setSaving(true);
      await API.products.delete(productId);

      const updatedProducts = products.filter((p) => p.id !== productId);
      setProducts(updatedProducts);

      if (selectedProduct?.id === productId) {
        if (updatedProducts.length > 0) {
          handleProductSelect(updatedProducts[0]);
        } else {
          setSelectedProduct(null);
        }
      }

      showSuccess('商品已刪除');
    } catch (error) {
      console.error('刪除商品失敗:', error);
      showError('刪除失敗: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [config.permissions?.canDelete, products, selectedProduct, handleProductSelect, showSuccess, showError]);

  // === 上傳 GLB ===
  const handleUploadGLB = useCallback(async (file) => {
    if (!selectedProduct || selectedProduct.type !== '3D') return;
    if (!config.permissions?.canUploadGLB) {
      showError('沒有上傳權限');
      return;
    }

    try {
      setSaving(true);
      const updatedProduct = await API.products.uploadGLB(selectedProduct.id, file);

      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      showSuccess(`3D模型上傳成功！文件大小: ${updatedProduct.model3D.fileSizeMB}MB`);
    } catch (error) {
      console.error('上傳GLB失敗:', error);
      showError('上傳失敗: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [selectedProduct, config.permissions?.canUploadGLB, showSuccess, showError]);

  // === 移除 GLB ===
  const handleRemoveGLB = useCallback(async () => {
    if (!selectedProduct || selectedProduct.type !== '3D') return;

    if (!window.confirm('確定要移除3D模型嗎？')) {
      return;
    }

    try {
      setSaving(true);
      const updatedProduct = await API.products.removeGLB(selectedProduct.id);

      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      showSuccess('3D模型已移除');
    } catch (error) {
      console.error('移除GLB失敗:', error);
      showError('移除失敗: ' + error.message);
    } finally {
      setSaving(false);
    }
  }, [selectedProduct, showSuccess, showError]);

  // === 更新 UV 映射 ===
  const handleUpdateUVMapping = useCallback(async (uvData) => {
    if (!selectedProduct || selectedProduct.type !== '3D') return;

    try {
      const updatedProduct = {
        ...selectedProduct,
        model3D: {
          ...selectedProduct.model3D,
          uvMapping: uvData,
        },
      };

      await API.products.update(selectedProduct.id, {
        model3D: updatedProduct.model3D,
      });

      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );
    } catch (error) {
      console.error('更新UV映射失敗:', error);
      showError('更新UV映射失敗: ' + error.message);
    }
  }, [selectedProduct, showError]);

  // === 返回所有狀態和方法 ===
  return {
    // 狀態
    products,
    selectedProduct,
    loading,
    saving,
    error,
    setError,
    editingProduct,
    setEditingProduct,
    showAddModal,
    setShowAddModal,
    newProduct,
    setNewProduct,
    uvTestImage,
    setUvTestImage,

    // 通知
    notification,
    showNotification,
    showSuccess,
    showError,

    // 設計區域
    tempPrintArea,
    setTempPrintArea,
    tempBleedArea,
    bleedMode,
    isDragging,
    updatePrintArea,
    resetPrintArea,
    enableBleedArea,
    disableBleedArea,
    toggleBleedMode,
    updateBleedArea,
    resetBleedArea,
    startDrag,
    stopDrag,
    handleDragMove,
    validateDesignArea,

    // 業務邏輯方法
    loadProducts,
    handleProductSelect,
    handleUpdateProduct,
    handleSavePrintArea,
    handleProductTypeChange,
    handleToggleActive,
    handleAddProduct,
    handleDeleteProduct,
    handleUploadGLB,
    handleRemoveGLB,
    handleUpdateUVMapping,
  };
};
