import React from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import ProductThumbnail from '../../components/Preview/ProductThumbnail';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const navigate = useNavigate();

  const handleEditProduct = (item) => {
    console.log('🛒 開始編輯商品:', item);

    // 如果是客製化產品，使用保存的原始產品ID
    const productId = item.isCustom
      ? (item.originalProductId || item.id.replace('custom_', ''))
      : item.id;

    console.log('📦 解析的產品ID:', productId);

    // 檢查產品ID是否有效
    if (!productId || productId === item.id) {
      alert('無法編輯此產品，請重新加入購物車');
      return;
    }

    // 如果有設計資料，將其保存到 sessionStorage 供編輯器使用
    if (item.isCustom && item.designData) {
      const editData = {
        cartItemId: item.id,
        originalProductId: item.originalProductId,
        designData: item.designData,
        snapshot3D: item.snapshot3D, // 保存 3D 快照
        timestamp: Date.now()
      };
      console.log('💾 保存編輯資料到 sessionStorage:', editData);
      sessionStorage.setItem('editingDesignData', JSON.stringify(editData));
    } else {
      console.log('⚠️ 沒有設計資料或不是客製化商品');
      console.log('- isCustom:', item.isCustom);
      console.log('- designData:', item.designData);
    }

    navigate(`/editor/${productId}`);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">購物車</h1>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">購物車是空的</h2>
            <p className="text-gray-600 mb-6">快去挑選您喜歡的商品吧！</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              開始購物
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">購物車</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {cart.map((item) => (
                <div key={item.id} className="p-6 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0">
                      {item.isCustom && item.designData ? (
                        <ProductThumbnail
                          product={item} // 購物車項目本身就包含商品資料
                          designElements={item.designData.elements || []}
                          backgroundColor={item.designData.backgroundColor || '#ffffff'}
                          width={80}
                          height={80}
                          className=""
                          snapshot3D={item.snapshot3D || null}
                        />
                      ) : (
                        <ProductThumbnail
                          product={item}
                          designElements={[]}
                          width={80}
                          height={80}
                          className=""
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">NT$ {item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 select-none"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 select-none"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">NT$ {item.price * item.quantity}</p>
                      <div className="flex space-x-2 mt-1">
                        <button
                          onClick={() => handleEditProduct(item)}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 text-sm hover:underline"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4">訂單摘要</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>小計</span>
                  <span>NT$ {getCartTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span>運費</span>
                  <span>NT$ 60</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>總計</span>
                    <span>NT$ {getCartTotal() + 60}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                前往結帳
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;