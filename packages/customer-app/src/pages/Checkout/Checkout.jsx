import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { API } from '@monkind/shared/services/api';
import { HttpAPI } from '@monkind/shared/services/api';
import { ProductThumbnail } from '@monkind/shared/components/Preview';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();

  // 收件人資訊
  const [shipping, setShipping] = useState({
    name: '',
    phone: '',
    address: '',
    method: '宅配',
    fee: 100,
    notes: ''
  });

  // 付款方式
  const [payment, setPayment] = useState({
    method: 'credit_card'
  });

  // 處理狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // 驗證表單
  const validateForm = () => {
    const newErrors = {};

    if (!shipping.name.trim()) {
      newErrors.name = '請輸入收件人姓名';
    }

    if (!shipping.phone.trim()) {
      newErrors.phone = '請輸入聯絡電話';
    } else if (!/^09\d{8}$/.test(shipping.phone.replace(/[- ]/g, ''))) {
      newErrors.phone = '請輸入正確的手機號碼格式';
    }

    if (!shipping.address.trim()) {
      newErrors.address = '請輸入收件地址';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單輸入
  const handleShippingChange = (field, value) => {
    setShipping(prev => ({ ...prev, [field]: value }));
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 處理運送方式變更
  const handleShippingMethodChange = (method) => {
    const fees = {
      '宅配': 100,
      '超商取貨': 60,
      '郵寄': 80
    };
    setShipping(prev => ({
      ...prev,
      method,
      fee: fees[method] || 100
    }));
  };

  // 提交訂單
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('請完整填寫收件資訊');
      return;
    }

    if (cart.length === 0) {
      alert('購物車是空的');
      return;
    }

    setIsSubmitting(true);

    try {
      // 獲取當前用戶
      const currentUser = HttpAPI.users.getCurrentUser();
      const userId = currentUser?.id || 'guest';

      // 為每個客製化商品生成列印檔案
      console.log('📄 開始生成列印檔案...');
      const cartItemsWithPrintFiles = await Promise.all(
        cart.map(async (item) => {
          // 只為客製化商品生成列印檔案
          if (!item.isCustom || !item.designData) {
            return item;
          }

          try {
            // 動態導入列印檔案生成函數
            const { generatePrintFile } = await import('@monkind/shared/components/Editor/utils');

            // 生成列印檔案 Blob
            const printFileBlob = await generatePrintFile(
              item, // product
              item.designData.elements || [],
              item.designData.backgroundColor || '#ffffff',
              8 // scaleFactor for high resolution
            );

            // 上傳列印檔案
            const uploadResult = await API.upload.printFile(printFileBlob, item.originalProductId || item.id);

            if (uploadResult && uploadResult.url) {
              console.log(`✅ 列印檔案已生成並上傳: ${item.title}`);
              return {
                ...item,
                printFileUrl: uploadResult.url
              };
            } else {
              console.warn(`⚠️ 列印檔案上傳失敗: ${item.title}`);
              return item;
            }
          } catch (err) {
            console.error(`❌ 生成列印檔案失敗 (${item.title}):`, err);
            // 失敗時仍繼續，不中斷訂單流程
            return item;
          }
        })
      );

      // 準備訂單資料
      const orderData = {
        userId,
        cartItems: cartItemsWithPrintFiles,
        shipping,
        payment
      };

      console.log('📦 提交訂單:', orderData);

      // 建立訂單
      const response = await API.orders.create(orderData);

      if (response.success) {
        console.log('✅ 訂單建立成功:', response.orderId);

        // 清空購物車
        clearCart();

        // 跳轉到訂單詳情頁
        navigate(`/orders/${response.orderId}`, {
          state: { fromCheckout: true }
        });

        alert('訂單建立成功！');
      } else {
        throw new Error(response.message || '建立訂單失敗');
      }

    } catch (error) {
      console.error('建立訂單失敗:', error);
      alert(`建立訂單失敗：${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 如果購物車為空，返回購物車頁面
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">購物車是空的</h2>
            <p className="text-gray-600 mb-6">請先將商品加入購物車</p>
            <button
              onClick={() => navigate('/cart')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回購物車
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = getCartTotal();
  const shippingFee = shipping.fee;
  const total = subtotal + shippingFee;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">結帳</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左側：收件資訊 + 付款方式 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 收件資訊 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">收件資訊</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      收件人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shipping.name}
                      onChange={(e) => handleShippingChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="請輸入收件人姓名"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      聯絡電話 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={shipping.phone}
                      onChange={(e) => handleShippingChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="0912-345-678"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      收件地址 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={shipping.address}
                      onChange={(e) => handleShippingChange('address', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="請輸入完整收件地址"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      備註（選填）
                    </label>
                    <textarea
                      value={shipping.notes}
                      onChange={(e) => handleShippingChange('notes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="有任何特殊需求可在此註明"
                    />
                  </div>
                </div>
              </div>

              {/* 運送方式 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">運送方式</h2>

                <div className="space-y-3">
                  {[
                    { method: '宅配', fee: 100, desc: '預計 3-5 個工作天送達' },
                    { method: '超商取貨', fee: 60, desc: '預計 3-5 個工作天到店' },
                    { method: '郵寄', fee: 80, desc: '預計 5-7 個工作天送達' }
                  ].map(({ method, fee, desc }) => (
                    <label
                      key={method}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        shipping.method === method
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method}
                        checked={shipping.method === method}
                        onChange={() => handleShippingMethodChange(method)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{method}</div>
                        <div className="text-sm text-gray-500">{desc}</div>
                      </div>
                      <div className="font-semibold">NT$ {fee}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 付款方式 */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">付款方式</h2>

                <div className="space-y-3">
                  {[
                    { method: 'credit_card', label: '信用卡', icon: '💳' },
                    { method: 'bank_transfer', label: '銀行轉帳', icon: '🏦' },
                    { method: 'cod', label: '貨到付款', icon: '💵' }
                  ].map(({ method, label, icon }) => (
                    <label
                      key={method}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        payment.method === method
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={payment.method === method}
                        onChange={(e) => setPayment({ method: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-2xl mr-2">{icon}</span>
                      <div className="font-medium">{label}</div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 右側：訂單摘要 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-4">訂單摘要</h2>

                {/* 商品列表 */}
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 pb-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        {item.isCustom && item.designData ? (
                          <ProductThumbnail
                            product={item}
                            designElements={item.designData.elements || []}
                            backgroundColor={item.designData.backgroundColor || '#ffffff'}
                            width={64}
                            height={64}
                            snapshot3D={item.snapshot3D || null}
                            snapshot2D={item.snapshot2D || null}
                          />
                        ) : (
                          <ProductThumbnail
                            product={item}
                            width={64}
                            height={64}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-sm text-gray-500">數量: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-semibold">
                        NT$ {item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 金額明細 */}
                <div className="space-y-2 mb-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">商品小計</span>
                    <span>NT$ {subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">運費</span>
                    <span>NT$ {shippingFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>總計</span>
                    <span className="text-blue-600">NT$ {total}</span>
                  </div>
                </div>

                {/* 提交按鈕 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isSubmitting ? '處理中...' : '確認送出訂單'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="w-full mt-2 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  返回購物車
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
