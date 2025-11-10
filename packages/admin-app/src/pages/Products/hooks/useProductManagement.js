import { useState, useEffect, useCallback } from 'react';
import { API } from '@monkind/shared/services/api';

/**
 * useProductManagement Hook
 * 管理商品的 CRUD 操作和相關狀態
 */
export const useProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(false);

  /**
   * 載入所有商品
   */
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const productsData = await API.products.getAll();
      setProducts(productsData);

      // 如果有商品，預設選擇第一個
      if (productsData.length > 0 && !selectedProduct) {
        setSelectedProduct(productsData[0]);
      }

      return productsData;
    } catch (error) {
      console.error('載入商品失敗:', error);
      setError('載入商品資料失敗: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedProduct]);

  /**
   * 初始載入商品
   */
  useEffect(() => {
    loadProducts();
  }, []);

  /**
   * 選擇商品
   */
  const selectProduct = useCallback((product) => {
    console.log('Selecting product:', product.title, 'mockupImage:', !!product.mockupImage);
    setSelectedProduct(product);

    // 強制重新渲染以確保底圖正確顯示
    setTimeout(() => {
      setSelectedProduct({ ...product });
    }, 10);
  }, []);

  /**
   * 新增商品
   */
  const createProduct = useCallback(async (productData) => {
    try {
      setSaving(true);
      setError(null);

      const createdProduct = await API.products.create({
        ...productData,
        image: `https://via.placeholder.com/300x300/cccccc/666666?text=${encodeURIComponent(
          productData.title
        )}`,
        mockupImage: null,
        contentImages: [],
        printArea: { x: 50, y: 50, width: 200, height: 150 },
      });

      const updatedProducts = await API.products.getAll();
      setProducts(updatedProducts);

      return createdProduct;
    } catch (error) {
      console.error('新增商品失敗:', error);
      setError('新增失敗: ' + error.message);
      throw error;
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * 更新商品
   */
  const updateProduct = useCallback(async (productId, updates) => {
    try {
      setSaving(true);
      setError(null);

      const updatedProduct = await API.products.update(productId, updates);

      const updatedProducts = products.map((p) =>
        p.id === productId ? updatedProduct : p
      );

      setProducts(updatedProducts);

      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(updatedProduct);
      }

      return updatedProduct;
    } catch (error) {
      console.error('更新商品失敗:', error);
      setError('更新失敗: ' + error.message);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [products, selectedProduct]);

  /**
   * 更新選中商品的單個欄位
   */
  const updateSelectedProductField = useCallback(async (field, value) => {
    if (!selectedProduct) return;

    return updateProduct(selectedProduct.id, { [field]: value });
  }, [selectedProduct, updateProduct]);

  /**
   * 切換商品啟用狀態
   */
  const toggleProductActive = useCallback(async (productId) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    return updateProduct(productId, {
      isActive: !product.isActive,
    });
  }, [products, updateProduct]);

  /**
   * 變更產品類型 (2D/3D)
   */
  const changeProductType = useCallback(async (newType) => {
    if (!selectedProduct) return;

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

    return updateProduct(selectedProduct.id, updatedProduct);
  }, [selectedProduct, updateProduct]);

  /**
   * 上傳 GLB 模型
   */
  const uploadGLB = useCallback(async (file) => {
    if (!selectedProduct) throw new Error('未選擇商品');

    try {
      setSaving(true);
      setError(null);

      // 檢查文件類型
      if (
        !file.name.toLowerCase().endsWith('.glb') &&
        !file.name.toLowerCase().endsWith('.gltf')
      ) {
        throw new Error('只支援 GLB 或 GLTF 格式的 3D 模型文件');
      }

      // 使用後端API上傳GLB文件
      const updatedProduct = await API.products.uploadGLB(selectedProduct.id, file);

      // 更新本地狀態
      setSelectedProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
      );

      return updatedProduct;
    } catch (error) {
      console.error('GLB上傳失敗:', error);
      setError('GLB上傳失敗: ' + error.message);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [selectedProduct]);

  /**
   * 移除 GLB 模型
   */
  const removeGLB = useCallback(async () => {
    if (!selectedProduct || selectedProduct.type !== '3D') return;

    const updatedProduct = {
      ...selectedProduct,
      model3D: {
        ...selectedProduct.model3D,
        glbUrl: null,
        fileName: null,
        fileSize: null,
        fileSizeMB: null,
        uploadedAt: null,
      },
    };

    return updateProduct(selectedProduct.id, updatedProduct);
  }, [selectedProduct, updateProduct]);

  /**
   * 更新 UV 映射
   */
  const updateUVMapping = useCallback((uvType, property, value) => {
    if (!selectedProduct || selectedProduct.type !== '3D') return;

    const updatedProduct = {
      ...selectedProduct,
      model3D: {
        ...selectedProduct.model3D,
        uvMapping: {
          ...selectedProduct.model3D.uvMapping,
          [uvType]: {
            ...selectedProduct.model3D.uvMapping[uvType],
            [property]: value,
          },
        },
      },
    };

    setSelectedProduct(updatedProduct);
    setProducts((prev) =>
      prev.map((p) => (p.id === selectedProduct.id ? updatedProduct : p))
    );
  }, [selectedProduct]);

  /**
   * 儲存 3D 模型設定
   */
  const save3DModel = useCallback(async () => {
    if (!selectedProduct || selectedProduct.type !== '3D') return;

    return updateProduct(selectedProduct.id, selectedProduct);
  }, [selectedProduct, updateProduct]);

  /**
   * 清除錯誤
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 狀態
    products,
    selectedProduct,
    loading,
    saving,
    error,
    editingProduct,

    // 操作函數
    loadProducts,
    selectProduct,
    createProduct,
    updateProduct,
    updateSelectedProductField,
    toggleProductActive,
    changeProductType,
    uploadGLB,
    removeGLB,
    updateUVMapping,
    save3DModel,
    clearError,

    // 設定編輯模式
    setEditingProduct,
  };
};
