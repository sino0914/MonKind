import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { API } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入訂單列表
  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // 如果是廠商，只顯示該廠商的訂單
      const vendorId = user?.userType === 'vendor' ? user.id : null;
      const response = await API.orders.getAll(vendorId);

      if (response.success) {
        // 按創建時間排序（最新的在前）
        const sortedOrders = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
      }
    } catch (err) {
      setError('載入訂單失敗');
      console.error('載入訂單失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  // 訂單狀態標籤
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-800' },
      paid: { label: '已付款', color: 'bg-green-100 text-green-800' },
      shipped: { label: '已出貨', color: 'bg-blue-100 text-blue-800' },
      completed: { label: '已完成', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 訂單統計
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">訂單管理</h1>
          <p className="text-gray-600">管理所有客戶訂單</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-gray-500 text-sm mb-1">全部訂單</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-4">
            <div className="text-yellow-700 text-sm mb-1">待付款</div>
            <div className="text-2xl font-bold text-yellow-800">
              {stats.pending}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <div className="text-green-700 text-sm mb-1">已付款</div>
            <div className="text-2xl font-bold text-green-800">{stats.paid}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4">
            <div className="text-blue-700 text-sm mb-1">已出貨</div>
            <div className="text-2xl font-bold text-blue-800">
              {stats.shipped}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg shadow-sm p-4">
            <div className="text-gray-700 text-sm mb-1">已完成</div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.completed}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">訂單列表</h2>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500">尚無訂單</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      訂單編號
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      客戶資訊
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      訂單日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      商品數量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      訂單金額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {order.orderId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.customerInfo?.name || '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.customerInfo?.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.itemCount} 件
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        NT$ {order.totalAmount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() =>
                            navigate(`/orders/${order.orderId}`)
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          查看詳情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
