import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { API } from '../../services/api';
import ProductThumbnail from '../../components/Preview/ProductThumbnail';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fromCheckout = location.state?.fromCheckout;

  // 載入訂單詳情
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        console.log('📦 載入訂單詳情:', orderId);

        const orderData = await API.orders.getById(orderId);
        console.log('✅ 訂單資料:', orderData);

        setOrder(orderData);
      } catch (error) {
        console.error('載入訂單失敗:', error);
        alert('載入訂單失敗，請重新整理頁面');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  // 訂單狀態配置
  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
      paid: { label: '已付款', color: 'bg-green-100 text-green-800', icon: '✅' },
      shipped: { label: '已出貨', color: 'bg-blue-100 text-blue-800', icon: '🚚' },
      completed: { label: '已完成', color: 'bg-gray-100 text-gray-800', icon: '🎉' },
      cancelled: { label: '已取消', color: 'bg-red-100 text-red-800', icon: '❌' }
    };

    return configs[status] || configs.pending;
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 獲取快照圖片來源
  const getSnapshotSrc = (snapshot) => {
    if (!snapshot) return null;

    // 如果是伺服器路徑 (/data/orders/...)
    if (snapshot.startsWith('/data/')) {
      return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002'}${snapshot}`;
    }

    // 如果是 uploads 路徑
    if (snapshot.startsWith('/uploads/')) {
      return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002'}${snapshot}`;
    }

    // 如果是 base64
    if (snapshot.startsWith('data:image/')) {
      return snapshot;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入訂單中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">找不到訂單</h2>
            <p className="text-gray-600 mb-6">此訂單可能不存在或已被刪除</p>
            <button
              onClick={() => navigate('/orders')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回訂單列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 成功提示（從結帳頁來的） */}
        {fromCheckout && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎉</span>
              <div>
                <p className="font-semibold text-green-800">訂單建立成功！</p>
                <p className="text-sm text-green-700">我們已收到您的訂單，將盡快為您處理</p>
              </div>
            </div>
          </div>
        )}

        {/* 訂單標題 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">訂單詳情</h1>
            <p className="text-sm text-gray-500">訂單編號：{order.orderId}</p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回訂單列表
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：訂單資訊 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 訂單狀態 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">訂單狀態</h2>
                  <p className="text-sm text-gray-500">建立時間：{formatDate(order.createdAt)}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-semibold ${statusConfig.color} flex items-center space-x-2`}>
                  <span className="text-lg">{statusConfig.icon}</span>
                  <span>{statusConfig.label}</span>
                </div>
              </div>
            </div>

            {/* 商品清單 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">商品清單</h2>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const snapshotSrc = getSnapshotSrc(item.snapshot);

                  return (
                    <div key={item.itemId} className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                      {/* 商品縮圖 */}
                      <div className="w-20 h-20 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                        {snapshotSrc ? (
                          <img
                            src={snapshotSrc}
                            alt={item.productTitle}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.error('快照載入失敗:', snapshotSrc);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">無圖</span>
                          </div>
                        )}
                      </div>

                      {/* 商品資訊 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{item.productTitle}</h3>
                        {item.isCustom && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            客製化商品
                          </span>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          單價 NT$ {item.price} × {item.quantity}
                        </p>
                      </div>

                      {/* 小計 */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">NT$ {item.subtotal}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 收件資訊 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">收件資訊</h2>
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-gray-500 w-24">收件人：</span>
                  <span className="font-medium">{order.shipping.name}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">聯絡電話：</span>
                  <span className="font-medium">{order.shipping.phone}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">收件地址：</span>
                  <span className="font-medium">{order.shipping.address}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">運送方式：</span>
                  <span className="font-medium">{order.shipping.method}</span>
                </div>
                {order.notes && (
                  <div className="flex">
                    <span className="text-gray-500 w-24">備註：</span>
                    <span className="font-medium">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 付款資訊 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">付款資訊</h2>
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-gray-500 w-24">付款方式：</span>
                  <span className="font-medium">
                    {order.payment.method === 'credit_card' && '信用卡'}
                    {order.payment.method === 'bank_transfer' && '銀行轉帳'}
                    {order.payment.method === 'cod' && '貨到付款'}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">付款狀態：</span>
                  <span className={`font-medium ${order.payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.payment.status === 'paid' ? '已付款' : '待付款'}
                  </span>
                </div>
                {order.payment.paidAt && (
                  <div className="flex">
                    <span className="text-gray-500 w-24">付款時間：</span>
                    <span className="font-medium">{formatDate(order.payment.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右側：金額明細 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">金額明細</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">商品小計</span>
                  <span className="font-medium">NT$ {order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">運費</span>
                  <span className="font-medium">NT$ {order.shippingFee}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">訂單總額</span>
                    <span className="text-xl font-bold text-blue-600">NT$ {order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* 操作按鈕 */}
              {order.status === 'pending' && (
                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => alert('付款功能開發中...')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    前往付款
                  </button>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => navigate('/products')}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  繼續購物
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
