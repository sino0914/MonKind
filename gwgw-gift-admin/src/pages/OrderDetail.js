import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { API } from '../services/api';
import { useAuth } from '../context/AuthContext';

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrderDetail();
  }, [orderId, user]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // 如果是廠商，只能看自己的訂單
      const vendorId = user?.userType === 'vendor' ? user.id : null;
      const response = await API.orders.getAll(vendorId);

      if (response.success) {
        const foundOrder = response.data.find((o) => o.orderId === orderId);
        if (foundOrder) {
          // 如果是廠商，再次確認訂單項目中有該廠商的商品
          if (user?.userType === 'vendor') {
            const hasVendorItems = foundOrder.items?.some(
              (item) => item.vendorId === user.id
            );
            if (!hasVendorItems) {
              setError('您無權查看此訂單');
              return;
            }
          }
          setOrder(foundOrder);
        } else {
          setError('找不到該訂單');
        }
      }
    } catch (err) {
      setError('載入訂單失敗');
      console.error('載入訂單失敗:', err);
    } finally {
      setLoading(false);
    }
  };

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

    // 如果已經是完整 URL，直接使用
    if (snapshot.startsWith('http://') || snapshot.startsWith('https://')) {
      return snapshot;
    }

    return null;
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

  if (error || !order) {
    return (
      <Layout>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error || '訂單不存在'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回訂單列表
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
            >
              ← 返回訂單列表
            </button>
            <h1 className="text-2xl font-bold text-gray-900">訂單詳情</h1>
            <p className="text-gray-600">訂單編號: {order.orderId}</p>
          </div>
          <div>{getStatusBadge(order.status)}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  訂單商品
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 pb-4 border-b last:border-b-0"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0">
                      {item.snapshot && getSnapshotSrc(item.snapshot) ? (
                        <img
                          src={getSnapshotSrc(item.snapshot)}
                          alt={item.productName}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            console.error('快照載入失敗:', item.snapshot);
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400">📦</div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        數量: {item.quantity}
                      </p>
                      {item.vendorName && (
                        <p className="text-sm text-gray-500 mt-1">
                          廠商: {item.vendorName}
                        </p>
                      )}
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        NT$ {item.price?.toLocaleString()}
                      </p>
                      {item.printFile && (
                        <a
                          href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3002'}/api/orders/${order.orderId}/items/${item.itemId}/print-file`}
                          download
                          className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          📥 下載列印檔案
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        NT${' '}
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  配送資訊
                </h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      收件人
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {order.customerInfo?.name || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      聯絡電話
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {order.customerInfo?.phone || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {order.customerInfo?.email || '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      配送地址
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {order.customerInfo?.address || '-'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  訂單摘要
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">訂單日期</span>
                  <span className="text-gray-900">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">商品數量</span>
                  <span className="text-gray-900">{order.itemCount} 件</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">訂單總額</span>
                    <span className="text-gray-900">
                      NT$ {order.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
                {order.notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      備註
                    </p>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetail;
