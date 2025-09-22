import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API } from "../../services/api";
import UniversalEditor from "../../components/Editor/UniversalEditor";

const Editor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const handleAddToCart = (designData) => {
    if (product) {
      const customProduct = {
        ...product,
        id: `custom_${Date.now()}`,
        title: `客製化 ${product.title}`,
        price: product.price + 50, // 客製化加價
        isCustom: true,
        designData // 包含設計資料
      };
      addToCart(customProduct);
      navigate("/cart");
      alert("客製化商品已加入購物車！");
    }
  };

  return (
    <UniversalEditor
      mode="product"
      product={product}
      loading={loading}
      error={error}
      onNavigateBack={() => navigate(-1)}
      onAddToCart={handleAddToCart}
      showTemplateTools={true}
    />
  );
};

export default Editor;
