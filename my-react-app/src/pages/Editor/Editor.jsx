import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API } from "../../services/api";
import UniversalEditor from "../../components/Editor/UniversalEditor";

const Editor = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart, updateQuantity, removeFromCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [isNewDesign, setIsNewDesign] = useState(false);

  // 載入商品資料
  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("載入編輯器商品 ID:", id);
      const foundProduct = await API.products.getById(parseInt(id));

      // 檢查商品是否存在
      if (!foundProduct) {
        setError("找不到此商品");
        return;
      }

      // 檢查商品是否啟用
      if (foundProduct.isActive === false) {
        setError("此商品目前無法使用");
        return;
      }

      console.log("編輯器載入的商品:", foundProduct);

      // 檢查是否有設計區設定
      if (!foundProduct.printArea) {
        console.warn("此商品尚未設定設計區範圍，使用預設值");
        foundProduct.printArea = { x: 50, y: 50, width: 200, height: 150 };
      }

      setProduct(foundProduct);
    } catch (error) {
      console.error("載入商品失敗:", error);

      if (error.message.includes("找不到")) {
        setError("商品不存在或已被移除");
      } else {
        setError("載入商品失敗，請重新嘗試");
      }
    } finally {
      setLoading(false);
    }
  };

  // 檢查是否有編輯中的設計資料
  const checkEditingData = () => {
    try {
      const editDataString = sessionStorage.getItem('editingDesignData');
      console.log('🔍 檢查 sessionStorage 中的編輯資料:', editDataString);

      if (editDataString) {
        const editData = JSON.parse(editDataString);
        console.log('📝 解析的編輯資料:', editData);
        console.log('🆔 當前產品ID:', id, '原始產品ID:', editData.originalProductId);

        // 檢查是否是編輯同一個產品
        if (editData.originalProductId == id) {
          setEditingData(editData);
          setIsEditingExisting(true);
          console.log('✅ 載入編輯中的設計資料:', editData);
          console.log('🎨 設計元素:', editData.designData?.elements);
          console.log('🎨 背景顏色:', editData.designData?.backgroundColor);
        } else {
          console.log('❌ 產品ID不匹配，清除編輯資料');
          sessionStorage.removeItem('editingDesignData');
        }
      } else {
        console.log('📭 沒有找到編輯資料');
      }
    } catch (error) {
      console.error('載入編輯資料失敗:', error);
    }
  };

  useEffect(() => {
    if (id) {
      // 檢查是否是新設計模式
      const newDesignId = searchParams.get('new');
      if (newDesignId) {
        console.log('🎨 新設計模式，設計ID:', newDesignId);
        setIsNewDesign(true);
        // 清除任何現有的編輯資料
        sessionStorage.removeItem('editingDesignData');
      } else {
        checkEditingData();
      }
      loadProduct();
    }
  }, [id, searchParams]);

  const handleAddToCart = (designData) => {
    if (product) {
      if (isEditingExisting && editingData) {
        // 如果是編輯現有商品，更新購物車中的該項目
        const updatedProduct = {
          ...product,
          id: editingData.cartItemId,
          originalProductId: product.id,
          title: `客製化 ${product.title}`,
          price: product.price + 50,
          isCustom: true,
          designData // 更新設計資料
        };

        // 先移除舊的項目，然後加入更新的項目
        removeFromCart(editingData.cartItemId);
        addToCart(updatedProduct);

        // 清除編輯資料
        sessionStorage.removeItem('editingDesignData');

        navigate("/cart");
        alert("客製化商品已更新！");
      } else {
        // 新建客製化商品
        const customProduct = {
          ...product,
          id: `custom_${Date.now()}`,
          originalProductId: product.id, // 保存原始產品ID
          title: `客製化 ${product.title}`,
          price: product.price + 50, // 客製化加價
          isCustom: true,
          designData // 包含設計資料
        };
        addToCart(customProduct);
        navigate("/cart");
        alert("客製化商品成功加入購物車！");
      }
    }
  };

  // 準備傳遞給UniversalEditor的初始化資料
  const initialElements = isNewDesign ? [] : (editingData?.designData?.elements || []);
  const initialBackgroundColor = isNewDesign ? '#ffffff' : (editingData?.designData?.backgroundColor || '#ffffff');

  console.log('📤 傳遞給 UniversalEditor 的資料:');
  console.log('- initialElements:', initialElements);
  console.log('- initialBackgroundColor:', initialBackgroundColor);
  console.log('- isEditingExisting:', isEditingExisting);

  return (
    <UniversalEditor
      mode="product"
      product={product}
      loading={loading}
      error={error}
      onNavigateBack={() => navigate(-1)}
      onAddToCart={handleAddToCart}
      showTemplateTools={true}
      // 傳入編輯中的設計資料
      initialElements={initialElements}
      initialBackgroundColor={initialBackgroundColor}
    />
  );
};

export default Editor;
