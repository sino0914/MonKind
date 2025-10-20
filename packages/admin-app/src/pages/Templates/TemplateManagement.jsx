import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '@monkind/shared/services/api';
import { TemplateThumbnail } from '@monkind/shared/components/Preview';
import { getTemplatesWithPreviews } from '../../utils/ProductDataManager';
import { testPreviewGeneration } from '../../test-preview';
import Layout from '../../components/Layout';

const TemplateManagement = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [generatingPreviews, setGeneratingPreviews] = useState(false);

  // 載入商品列表
  const loadProducts = async () => {
    try {
      const productList = await API.products.getAll();
      setProducts(productList);
    } catch (error) {
      setError('載入商品失敗');
    }
  };

  // 載入版型列表（含預覽圖）
  const loadTemplates = async (productId = null) => {
    try {
      setLoading(true);
      setGeneratingPreviews(true);
      setError(null);

      let templateList;
      if (productId) {
        // 使用新的預覽圖生成功能
        templateList = await getTemplatesWithPreviews(productId);
      } else {
        // 載入所有版型並生成預覽圖
        templateList = await getTemplatesWithPreviews();
      }

      setTemplates(templateList);

      // 載入統計
      const templateStats = await API.templates.getStats();
      setStats(templateStats);
    } catch (error) {
      setError('載入版型失敗');
    } finally {
      setLoading(false);
      setGeneratingPreviews(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadProducts();
    loadTemplates();
  }, []);

  // 選擇商品
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    loadTemplates(product ? product.id : null);
  };

  // 新增版型
  const handleCreateTemplate = () => {
    if (!selectedProduct) {
      alert('請先選擇商品');
      return;
    }

    navigate(`/admin/templates/editor/new?productId=${selectedProduct.id}`);
  };

  // 編輯版型
  const handleEditTemplate = (template) => {
    navigate(`/admin/templates/editor/${template.id}`);
  };

  // 切換版型啟用狀態
  const handleToggleActive = async (template) => {
    try {
      await API.templates.toggleActive(template.id);

      // 重新載入版型列表
      if (selectedProduct) {
        loadTemplates(selectedProduct.id);
      } else {
        loadTemplates();
      }
    } catch (error) {
      alert('操作失敗');
    }
  };

  // 刪除版型
  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`確定要刪除版型「${template.name}」嗎？`)) {
      return;
    }

    try {
      await API.templates.delete(template.id);

      // 重新載入版型列表
      if (selectedProduct) {
        loadTemplates(selectedProduct.id);
      } else {
        loadTemplates();
      }

      alert('版型已刪除');
    } catch (error) {
      alert('刪除失敗');
    }
  };

  // 複製版型
  const handleDuplicateTemplate = async (template) => {
    try {
      await API.templates.duplicate(template.id);

      // 重新載入版型列表
      if (selectedProduct) {
        loadTemplates(selectedProduct.id);
      } else {
        loadTemplates();
      }

      alert('版型複製成功');
    } catch (error) {
      alert('複製失敗');
    }
  };

  return (
    <Layout>
      <div>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">版型管理</h1>
          <p className="text-gray-600">管理商品版型設計</p>
        </div>

        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">版型總數</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">啟用中</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">停用中</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">商品數</p>
                <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 商品選擇區 */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">選擇商品</h2>
            <p className="text-sm text-gray-600">選擇要管理版型的商品，或查看所有版型</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* 商品選項 */}
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-16 h-16 mx-auto mb-2 rounded object-cover"
                    />
                    <h3 className="font-medium text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {selectedProduct ? `${selectedProduct.title} 的版型` : '所有版型'}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={async () => {
                try {
                  await testPreviewGeneration();
                } catch (error) {
                  alert('測試預覽圖生成失敗');
                }
              }}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              title="測試預覽圖生成功能"
            >
              🧪 測試預覽圖
            </button>
            <button
              onClick={handleCreateTemplate}
              disabled={!selectedProduct}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedProduct
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="mr-1">➕</span>
              新增版型
            </button>
          </div>
        </div>

        {/* 版型列表 - 圖片庫風格 */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {generatingPreviews ? '載入中...正在生成預覽圖' : '載入中...'}
              </p>
              {generatingPreviews && (
                <p className="text-xs text-gray-500 mt-2">
                  首次載入可能需要較長時間來生成預覽圖
                </p>
              )}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-500 mb-4">❌</div>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => loadTemplates(selectedProduct?.id)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                重新載入
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedProduct ? '此商品還沒有版型' : '還沒有任何版型'}
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedProduct ? '開始為此商品創建第一個版型' : '選擇商品後開始創建版型'}
              </p>
              {selectedProduct && (
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  創建版型
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {templates.map(template => (
                  <div key={template.id} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* 版型預覽圖 */}
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      <TemplateThumbnail
                        template={template}
                        width={200}
                        height={200}
                        showName={false}
                        showElementCount={true}
                        className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    {/* 版型資訊 */}
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {template.description || '無描述'}
                      </p>

                      {/* 版型狀態和資訊 */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>元素: {template.elements?.length || 0}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          template.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.isActive ? '啟用' : '停用'}
                        </span>
                      </div>

                      {/* 操作按鈕 */}
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          title="編輯版型"
                        >
                          ✏️ 編輯
                        </button>

                        <button
                          onClick={() => handleToggleActive(template)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            template.isActive
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                          title={template.isActive ? '停用版型' : '啟用版型'}
                        >
                          {template.isActive ? '⏸️ 停用' : '▶️ 啟用'}
                        </button>

                        <button
                          onClick={() => handleDuplicateTemplate(template)}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                          title="複製版型"
                        >
                          📋 複製
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(template)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="刪除版型"
                        >
                          🗑️ 刪除
                        </button>
                      </div>
                    </div>

                    {/* 更新時間 */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TemplateManagement;