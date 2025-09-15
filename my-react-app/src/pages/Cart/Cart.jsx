import React from 'react';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useCart();

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
                    <div className="bg-gray-200 w-20 h-20 rounded flex items-center justify-center">
                      <span className="text-gray-500 text-xs">圖片</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600">NT$ {item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">NT$ {item.price * item.quantity}</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 text-sm hover:underline"
                      >
                        移除
                      </button>
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
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
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