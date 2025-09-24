import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SystemAPI, API } from '../../services/api';

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    products: { total: 0, withPrintArea: 0 },
    users: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入統計資料
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const systemStats = await SystemAPI.getSystemStats();
      setStats(systemStats);
    } catch (error) {
      console.error('載入統計資料失敗:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const adminMenus = [
    {
      id: 'products',
      title: '商品維護',
      description: '管理商品資訊與設計區範圍',
      icon: '📦',
      path: '/admin/products',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'templates',
      title: '版型管理',
      description: '管理設計版型與模板',
      icon: '📐',
      path: '/admin/templates',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'elements',
      title: '元素管理',
      description: '管理設計元素與圖片資源',
      icon: '🎨',
      path: '/admin/elements',
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🛠️ 開發者後台</h1>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回前台
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">管理選單</h2>
          <p className="text-gray-600">選擇要管理的功能模組</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminMenus.map((menu) => (
            <div
              key={menu.id}
              onClick={() => navigate(menu.path)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-lg ${menu.color} flex items-center justify-center text-white text-2xl mr-4`}>
                    {menu.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{menu.title}</h3>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{menu.description}</p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  進入管理
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Card - 只顯示商品數量 */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200 max-w-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">商品總數</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : stats.products?.total || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-bold">系統錯誤：</strong>
                <span className="block sm:inline">{error}</span>
              </div>
              <button
                onClick={loadStats}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                重新載入
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Admin;