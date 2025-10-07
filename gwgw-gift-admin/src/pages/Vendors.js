import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { API } from '../services/api';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await API.vendors.getAll();
      if (response.success) {
        setVendors(response.data);
      }
    } catch (error) {
      console.error('載入廠商失敗:', error);
      alert('載入廠商失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        address: vendor.address || '',
        email: vendor.email,
        phone: vendor.phone || '',
        username: vendor.username,
        password: '', // 不預填密碼
      });
    } else {
      setEditingVendor(null);
      setFormData({
        name: '',
        address: '',
        email: '',
        phone: '',
        username: '',
        password: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    setFormData({
      name: '',
      address: '',
      email: '',
      phone: '',
      username: '',
      password: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingVendor) {
        // 更新廠商
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // 如果密碼為空，不更新密碼
        }
        await API.vendors.update(editingVendor.id, updateData);
        alert('廠商更新成功');
      } else {
        // 新增廠商
        await API.vendors.create(formData);
        alert('廠商新增成功');
      }

      handleCloseModal();
      loadVendors();
    } catch (error) {
      console.error('儲存廠商失敗:', error);
      alert(error.message || '儲存廠商失敗');
    }
  };

  const handleToggleStatus = async (vendor) => {
    if (
      window.confirm(
        `確定要${vendor.isActive ? '停用' : '啟用'} ${vendor.name} 嗎？`
      )
    ) {
      try {
        await API.vendors.update(vendor.id, {
          isActive: !vendor.isActive,
        });
        loadVendors();
      } catch (error) {
        console.error('更新廠商狀態失敗:', error);
        alert('更新廠商狀態失敗');
      }
    }
  };

  const handleDelete = async (vendor) => {
    if (window.confirm(`確定要刪除 ${vendor.name} 嗎？此操作無法復原。`)) {
      try {
        await API.vendors.delete(vendor.id);
        alert('廠商已刪除');
        loadVendors();
      } catch (error) {
        console.error('刪除廠商失敗:', error);
        alert('刪除廠商失敗');
      }
    }
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">廠商管理</h1>
            <p className="text-gray-600">管理所有廠商資料</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ 新增廠商
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-gray-500 text-sm mb-1">全部廠商</div>
            <div className="text-2xl font-bold text-gray-900">
              {vendors.length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <div className="text-green-700 text-sm mb-1">啟用中</div>
            <div className="text-2xl font-bold text-green-800">
              {vendors.filter((v) => v.isActive).length}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm p-4">
            <div className="text-red-700 text-sm mb-1">已停用</div>
            <div className="text-2xl font-bold text-red-800">
              {vendors.filter((v) => !v.isActive).length}
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">廠商列表</h2>
          </div>

          {vendors.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <p className="text-gray-500 mb-4">尚無廠商</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                新增第一個廠商
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      廠商名稱
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      聯絡資訊
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      帳號
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vendor.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {vendor.address || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vendor.email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {vendor.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendor.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            vendor.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {vendor.isActive ? '啟用' : '停用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleOpenModal(vendor)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          編輯
                        </button>
                        <button
                          onClick={() => handleToggleStatus(vendor)}
                          className={`font-medium ${
                            vendor.isActive
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {vendor.isActive ? '停用' : '啟用'}
                        </button>
                        <button
                          onClick={() => handleDelete(vendor)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          刪除
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVendor ? '編輯廠商' : '新增廠商'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  廠商名稱 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  地址
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  聯絡電話
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登入帳號 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!!editingVendor}
                />
                {editingVendor && (
                  <p className="text-xs text-gray-500 mt-1">
                    帳號建立後無法修改
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  密碼 {editingVendor ? '' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingVendor}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={editingVendor ? '留空表示不修改密碼' : ''}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingVendor ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Vendors;
