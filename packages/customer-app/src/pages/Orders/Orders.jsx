import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '@monkind/shared/services/api';
import { HttpAPI } from '@monkind/shared/services/api';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 載入訂單列表（包含完整訂單詳情）
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);

        // 獲取當前用戶
        const currentUser = HttpAPI.users.getCurrentUser();
        const userId = currentUser?.id || 'guest';

        // 載入訂單列表（後端已包含完整商品資訊）
        const orderList = await API.orders.getUserOrders(userId);
        console.log('📦 載入訂單列表:', orderList);

        setOrders(orderList);
      } catch (error) {
        console.error('載入訂單失敗:', error);
        alert('載入訂單失敗，請重新整理頁面');
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

  // 獲取快照圖片來源
  const getSnapshotSrc = (item) => {
    console.log('🖼️ 處理商品快照:', item);

    // 優先使用 snapshotUrl（後端提供的 API 路徑）
    if (item.snapshotUrl) {
      const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002';
      const fullUrl = `${baseUrl}${item.snapshotUrl}`;
      console.log('✅ 使用 snapshotUrl:', fullUrl);
      return fullUrl;
    }

    // 如果有 snapshot，嘗試處理各種格式
    const snapshot = item.snapshot;
    if (!snapshot) {
      console.log('❌ 沒有 snapshot 資料');
      return null;
    }

    // 如果是伺服器路徑 (/data/orders/...)
    if (snapshot.startsWith('/data/')) {
      const fullUrl = `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002'}${snapshot}`;
      console.log('✅ 使用 /data/ 路徑:', fullUrl);
      return fullUrl;
    }

    // 如果是 uploads 路徑
    if (snapshot.startsWith('/uploads/')) {
      const fullUrl = `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002'}${snapshot}`;
      console.log('✅ 使用 /uploads/ 路徑:', fullUrl);
      return fullUrl;
    }

    // 如果是 base64
    if (snapshot.startsWith('data:image/')) {
      console.log('✅ 使用 base64');
      return snapshot;
    }

    console.log('❌ 無法識別的 snapshot 格式:', snapshot);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">我的訂單</h1>
          <div className="text-sm text-gray-500">
            共 {orders.length} 筆訂單
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">尚無訂單</h2>
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
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/orders/${order.orderId}`)}
              >
                <div className="p-6">
                  {/* 訂單標題 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">訂單編號</div>
                        <div className="font-mono text-sm font-semibold">{order.orderId}</div>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* 商品縮圖預覽 */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4 pb-4 border-b">
                      <div className="flex items-center space-x-3 overflow-x-auto">
                        {order.items.slice(0, 4).map((item, index) => {
                          const snapshotSrc = getSnapshotSrc(item);
                          return (
                            <div key={index} className="flex-shrink-0">
                              <div className="w-16 h-16 rounded overflow-hidden border border-gray-200 bg-gray-50">
                                {snapshotSrc ? (
                                  <img
                                    src={snapshotSrc}
                                    alt={item.productTitle}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      console.error('快照載入失敗:', snapshotSrc, item);
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">無圖</div>';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    無圖
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {order.items.length > 4 && (
                          <div className="flex-shrink-0 w-16 h-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{order.items.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 訂單資訊 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">訂單日期：</span>
                      <span className="font-medium">{formatDate(order.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">商品數量：</span>
                      <span className="font-medium">{order.items?.length || order.itemCount || 0} 件</span>
                    </div>
                    <div>
                      <span className="text-gray-500">訂單金額：</span>
                      <span className="font-semibold text-blue-600">NT$ {order.totalAmount}</span>
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="mt-4 pt-4 border-t flex justify-end">
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
