import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '@monkind/shared/services/api';
import { HttpAPI } from '@monkind/shared/services/api';

const Account = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 載入訂單列表
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);

        // 獲取當前用戶
        const currentUser = HttpAPI.users.getCurrentUser();
        const userId = currentUser?.id || 'guest';

        // 載入訂單列表
        const orderList = await API.orders.getUserOrders(userId);
        console.log('📦 載入訂單列表:', orderList);

        setOrders(orderList);
      } catch (error) {
        console.error('載入訂單失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  // 訂單狀態標籤
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: '已付款', color: 'bg-green-100 text-green-800' },
      shipped: { label: '已出貨', color: 'bg-blue-100 text-blue-800' },
      completed: { label: '已完成', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">我的帳號</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">👤</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">張小明</h2>
                <p className="text-gray-600">ming.zhang@example.com</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    defaultValue="張小明"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                  <input
                    type="email"
                    defaultValue="ming.zhang@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                  <input
                    type="tel"
                    defaultValue="0912-345-678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                  更新資料
                </button>
              </div>
            </div>
          </div>

          {/* Order History - 使用真實訂單資料 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">我的訂單</h3>
                <div className="text-sm text-gray-500">
                  共 {orders.length} 筆訂單
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">載入訂單中...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">尚無訂單</h2>
                  <p className="text-gray-600 mb-6">您還沒有建立任何訂單</p>
                  <button
                    onClick={() => navigate('/products')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    開始購物
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.orderId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/orders/${order.orderId}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">訂單編號</div>
                          <div className="font-mono text-sm font-semibold">{order.orderId}</div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">訂單日期：</span>
                          <span className="font-medium">{formatDate(order.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">商品數量：</span>
                          <span className="font-medium">{order.itemCount} 件</span>
                        </div>
                        <div>
                          <span className="text-gray-500">訂單金額：</span>
                          <span className="font-semibold text-blue-600">NT$ {order.totalAmount}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/${order.orderId}`);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          查看詳情 →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
