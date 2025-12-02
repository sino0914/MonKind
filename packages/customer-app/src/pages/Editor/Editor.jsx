import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { API } from "@monkind/shared/services/api";
import { UniversalEditor } from "@monkind/shared/components/Editor";

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

  const handleAddToCart = async (designData) => {
    if (product) {
      // 確保產品有廠商資訊
      let vendorId = product.vendorId;
      if (!vendorId) {
        try {
          console.log('⚠️ 產品沒有廠商資訊，載入並分配第一個廠商');
          const activeVendors = await API.vendors.getActive();
          if (activeVendors.length > 0) {
            vendorId = activeVendors[0].id;
            console.log('✅ 自動分配廠商:', activeVendors[0]);
          } else {
            alert('目前沒有可用的廠商，無法加入購物車');
            return;
          }
        } catch (error) {
          console.error('❌ 載入廠商失敗:', error);
          alert('載入廠商資訊失敗，請稍後再試');
          return;
        }
      }
      // 只有當 cartItemId 存在時，才是真正從購物車編輯
      if (isEditingExisting && editingData && editingData.cartItemId) {
        // 生成快照並上傳到伺服器
        let snapshot3D = editingData.snapshot3D; // 保留原有 3D 快照
        let snapshot2D = editingData.snapshot2D; // 保留原有 2D 快照

        if (product.type === '3D') {
          // 3D 商品生成 3D 快照
          const glbUrl = product?.glbUrl || product?.model3D?.glbUrl;
          if (glbUrl) {
            try {
              const { generate3DSnapshot } = await import('@monkind/shared/components/Editor/utils');
              const snapshotBase64 = await generate3DSnapshot(
                product,
                designData.elements,
                designData.backgroundColor,
                400,
                400
              );
              console.log('✅ 更新購物車時已重新生成 3D 快照');

              // 上傳快照到伺服器
              try {
                const uploadResult = await API.upload.snapshot(snapshotBase64, product.id);
                snapshot3D = uploadResult.url; // 儲存 URL 而非 base64
                console.log('✅ 購物車更新 3D 快照已上傳到伺服器:', uploadResult.url);
              } catch (uploadError) {
                console.error('❌ 上傳 3D 快照失敗，使用 base64 儲存:', uploadError);
                snapshot3D = snapshotBase64; // 失敗時回退到 base64
              }
            } catch (error) {
              console.error('❌ 生成 3D 快照失敗:', error);
            }
          }
        } else {
          // 2D 商品生成 2D 快照
          try {
            const { generate2DSnapshot } = await import('@monkind/shared/components/Editor/utils');
            const snapshotBase64 = await generate2DSnapshot(
              product,
              designData.elements,
              designData.backgroundColor,
              400,
              400,
              { useProductBackground: true } // 優先使用商品背景圖
            );
            console.log('✅ 更新購物車時已重新生成 2D 快照');

            // 上傳快照到伺服器
            try {
              const uploadResult = await API.upload.snapshot(snapshotBase64, product.id);
              snapshot2D = uploadResult.url; // 儲存 URL 而非 base64
              console.log('✅ 購物車更新 2D 快照已上傳到伺服器:', uploadResult.url);
            } catch (uploadError) {
              console.error('❌ 上傳 2D 快照失敗，使用 base64 儲存:', uploadError);
              snapshot2D = snapshotBase64; // 失敗時回退到 base64
            }
          } catch (error) {
            console.error('❌ 生成 2D 快照失敗:', error);
          }
        }

        // 排除 model3D 以避免儲存大型 GLB 資料
        const { model3D, ...productWithoutModel } = product;

        // 如果是編輯現有商品，更新購物車中的該項目
        const updatedProduct = {
          ...productWithoutModel,
          id: editingData.cartItemId,
          originalProductId: product.id,
          title: `客製化 ${product.title}`,
          price: product.price + 50,
          isCustom: true,
          type: product.type, // 保留類型
          vendorId, // 包含廠商資訊
          designData, // 更新設計資料
          snapshot3D, // 更新 3D 快照
          snapshot2D  // 更新 2D 快照
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
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9);
        const uniqueId = editingData?.draftId
          ? `custom_${product.id}_${editingData.draftId}_${timestamp}_${randomStr}`
          : `custom_${product.id}_${timestamp}_${randomStr}`;

        console.log('🆔 生成購物車商品 ID:', {
          productId: product.id,
          draftId: editingData?.draftId,
          timestamp,
          randomStr,
          finalId: uniqueId
        });

        // 生成對應類型的快照
        let snapshot3D = editingData?.snapshot3D; // 先嘗試使用現有快照（從草稿）
        let snapshot2D = editingData?.snapshot2D;

        if (product.type === '3D') {
          // 3D 商品生成 3D 快照
          const glbUrl = product?.glbUrl || product?.model3D?.glbUrl;
          if (glbUrl) {
            try {
              const { generate3DSnapshot } = await import('@monkind/shared/components/Editor/utils');
              const snapshotBase64 = await generate3DSnapshot(
                product,
                designData.elements,
                designData.backgroundColor,
                400,
                400
              );
              console.log('✅ 新建購物車時已生成 3D 快照');

              // 上傳快照到伺服器
              try {
                const uploadResult = await API.upload.snapshot(snapshotBase64, product.id);
                snapshot3D = uploadResult.url; // 儲存 URL 而非 base64
                console.log('✅ 購物車 3D 快照已上傳到伺服器:', uploadResult.url);
              } catch (uploadError) {
                console.error('❌ 上傳 3D 快照失敗，使用 base64 儲存:', uploadError);
                snapshot3D = snapshotBase64; // 失敗時回退到 base64
              }
            } catch (error) {
              console.error('❌ 生成 3D 快照失敗:', error);
            }
          }
        } else {
          // 2D 商品生成 2D 快照
          try {
            const { generate2DSnapshot } = await import('@monkind/shared/components/Editor/utils');
            const snapshotBase64 = await generate2DSnapshot(
              product,
              designData.elements,
              designData.backgroundColor,
              400,
              400,
              { useProductBackground: true } // 優先使用商品背景圖
            );
            console.log('✅ 新建購物車時已生成 2D 快照');

            // 上傳快照到伺服器
            try {
              const uploadResult = await API.upload.snapshot(snapshotBase64, product.id);
              snapshot2D = uploadResult.url; // 儲存 URL 而非 base64
              console.log('✅ 購物車 2D 快照已上傳到伺服器:', uploadResult.url);
            } catch (uploadError) {
              console.error('❌ 上傳 2D 快照失敗，使用 base64 儲存:', uploadError);
              snapshot2D = snapshotBase64; // 失敗時回退到 base64
            }
          } catch (error) {
            console.error('❌ 生成 2D 快照失敗:', error);
          }
        }

        const customProduct = {
          ...product,
          id: uniqueId,
          originalProductId: product.id, // 保存原始產品ID
          title: `客製化 ${product.title}`,
          price: product.price + 50, // 客製化加價
          isCustom: true,
          vendorId, // 包含廠商資訊
          designData, // 包含設計資料
          snapshot3D, // 包含生成的 3D 快照
          snapshot2D  // 包含生成的 2D 快照
        };

        // 排除 model3D 以避免儲存大型 GLB 資料
        const { model3D, ...productWithoutModel } = product;
        const optimizedProduct = {
          ...customProduct,
          ...productWithoutModel,
          id: customProduct.id, // 保留生成的唯一 ID
          type: product.type, // 保留類型
          vendorId // 確保廠商資訊被保留
        };

        console.log('🛒 準備加入購物車的商品:', optimizedProduct);
        console.log('📸 快照資料:', { snapshot3D, snapshot2D, productType: product.type });
        addToCart(optimizedProduct);
        navigate("/cart");
        alert("客製化商品成功加入購物車！");
      }
    }
  };

  // 處理返回按鈕 - 不再需要確認提示，由 TopToolbar 處理
  const handleNavigateBack = () => {
    // 清除編輯資料
    sessionStorage.removeItem('editingDesignData');
    navigate(-1);
  };

  // 準備傳遞給UniversalEditor的初始化資料
  const initialElements = isNewDesign ? [] : (editingData?.designData?.elements || []);
  const initialBackgroundColor = isNewDesign ? '#ffffff' : (editingData?.designData?.backgroundColor || '#ffffff');
  const initialWorkName = isNewDesign ? '' : (editingData?.workName || '');
  const isEditingFromCart = !!(editingData?.cartItemId); // 判斷是否從購物車編輯

  // 從商品資料取得預設視圖設定
  const initialViewport = product?.defaultViewport || null;

  console.log('📤 傳遞給 UniversalEditor 的資料:');
  console.log('- initialElements:', initialElements);
  console.log('- initialBackgroundColor:', initialBackgroundColor);
  console.log('- initialWorkName:', initialWorkName);
  console.log('- isEditingExisting:', isEditingExisting);
  console.log('- isEditingFromCart:', isEditingFromCart);
  console.log('- initialViewport:', initialViewport);

  return (
    <UniversalEditor
      mode="product"
      product={product}
      loading={loading}
      error={error}
      onNavigateBack={handleNavigateBack}
      onAddToCart={handleAddToCart}
      showTemplateTools={true}
      // 傳入編輯中的設計資料
      initialElements={initialElements}
      initialBackgroundColor={initialBackgroundColor}
      initialWorkName={initialWorkName}
      // 傳遞草稿ID用於更新現有草稿
      draftId={editingData?.draftId}
      // 傳遞是否從購物車編輯的標記
      isEditingFromCart={isEditingFromCart}
      // 傳遞預設視圖設定
      initialViewport={initialViewport}
    />
  );
};

export default Editor;
