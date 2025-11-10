import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { API } from '@monkind/shared/services/api';

const PricingSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    textElementPrice: 10,
    imageElementPrice: 30,
    minimumDesignFee: 50,
    enableMinimumFee: true,
    isActive: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await API.pricingSettings.getAll();
      setSettings(response.data || []);
    } catch (error) {
      console.error('載入定價設定失敗:', error);
      alert('載入定價設定失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (setting = null) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({
        name: setting.name,
        description: setting.description,
        textElementPrice: setting.textElementPrice,
        imageElementPrice: setting.imageElementPrice,
        minimumDesignFee: setting.minimumDesignFee,
        enableMinimumFee: setting.enableMinimumFee,
        isActive: setting.isActive,
      });
    } else {
      setEditingSetting(null);
      setFormData({
        name: '',
        description: '',
        textElementPrice: 10,
        imageElementPrice: 30,
        minimumDesignFee: 50,
        enableMinimumFee: true,
        isActive: false,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSetting(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('請輸入方案名稱');
      return;
    }

    try {
      if (editingSetting) {
        await API.pricingSettings.update(editingSetting.id, formData);
        alert('更新成功');
      } else {
        await API.pricingSettings.create(formData);
        alert('新增成功');
      }
      handleCloseModal();
      loadSettings();
    } catch (error) {
      console.error('儲存定價設定失敗:', error);
      alert('儲存失敗');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此定價設定嗎？')) {
      return;
    }

    try {
      await API.pricingSettings.delete(id);
      alert('刪除成功');
      loadSettings();
    } catch (error) {
      console.error('刪除定價設定失敗:', error);
      alert(error.message || '刪除失敗');
    }
  };

  const handleToggleActive = async (setting) => {
    try {
      await API.pricingSettings.update(setting.id, {
        ...setting,
        isActive: !setting.isActive,
      });
      loadSettings();
    } catch (error) {
      console.error('切換啟用狀態失敗:', error);
      alert('操作失敗');
    }
  };

  const stats = {
    total: settings.length,
    active: settings.filter(s => s.isActive).length,
    inactive: settings.filter(s => !s.isActive).length,
  };

  return (
    <Layout>
      <div className="p-6">
        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">定價設定</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理商品設計的定價規則
          </p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">全部方案</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="text-blue-500 text-3xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">啟用中</p>
                <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
              </div>
              <div className="text-green-500 text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">停用中</p>
                <p className="text-2xl font-bold text-gray-800">{stats.inactive}</p>
              </div>
              <div className="text-gray-500 text-3xl">⏸️</div>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            共 {settings.length} 個定價方案
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + 新增定價方案
          </button>
        </div>

        {/* 定價方案列表 */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">載入中...</div>
          ) : settings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              尚無定價方案，請新增一個
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      方案名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      文字元素價格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      圖片元素價格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      最低設計費
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settings.map((setting) => (
                    <tr key={setting.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {setting.name}
                          </span>
                          {setting.description && (
                            <span className="text-xs text-gray-500">
                              {setting.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        NT$ {setting.textElementPrice}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        NT$ {setting.imageElementPrice}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {setting.enableMinimumFee
                          ? `NT$ ${setting.minimumDesignFee}`
                          : '未啟用'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(setting)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            setting.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {setting.isActive ? '啟用中' : '已停用'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(setting)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => handleDelete(setting.id)}
                            className="text-red-600 hover:text-red-800"
                            disabled={setting.isActive}
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingSetting ? '編輯定價方案' : '新增定價方案'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  方案名稱 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  方案說明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文字元素價格 (NT$)
                </label>
                <input
                  type="number"
                  value={formData.textElementPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      textElementPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  圖片元素價格 (NT$)
                </label>
                <input
                  type="number"
                  value={formData.imageElementPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      imageElementPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.enableMinimumFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enableMinimumFee: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    啟用最低設計費
                  </span>
                </label>
              </div>

              {formData.enableMinimumFee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低設計費 (NT$)
                  </label>
                  <input
                    type="number"
                    value={formData.minimumDesignFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumDesignFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    設為啟用方案
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  啟用後，其他方案將自動停用
                </p>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingSetting ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PricingSettings;
