import React, { useState, useEffect } from 'react';
import { API } from '../services/api';
import TemplateEditor from './Admin/TemplateEditor';

/**
 * 版型編輯器測試頁面
 * 用於診斷版型編輯器的問題
 */
const TestTemplateEditor = () => {
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 載入測試資料
  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        console.log('🔄 載入測試資料...');

        // 載入產品
        const productsData = await API.products.getAll();
        console.log('📦 載入產品:', productsData);
        setProducts(productsData);

        // 載入版型
        const templatesData = await API.templates.getAll();
        console.log('🎨 載入版型:', templatesData);
        setTemplates(templatesData);

        if (productsData.length > 0) {
          setSelectedProduct(productsData[0]);
        }

        console.log('✅ 測試資料載入完成');
      } catch (err) {
        console.error('❌ 載入測試資料失敗:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, []);

  const handleTestNewTemplate = () => {
    console.log('🆕 測試建立新版型:', selectedProduct);
    if (!selectedProduct) {
      alert('請選擇一個產品');
      return;
    }
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleTestEditTemplate = (template) => {
    console.log('✏️ 測試編輯版型:', template);
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    console.log('🔙 關閉編輯器');
    setShowEditor(false);
    setSelectedTemplate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入測試資料中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">載入失敗</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (showEditor) {
    // 模擬TemplateEditor的props
    const editorProps = {
      // 如果是編輯現有版型
      ...(selectedTemplate && {
        template: selectedTemplate,
        productId: selectedTemplate.productId
      }),
      // 如果是建立新版型
      ...(!selectedTemplate && selectedProduct && {
        productId: selectedProduct.id
      }),
      onNavigateBack: handleCloseEditor
    };

    return (
      <div className="min-h-screen">
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-lg font-semibold text-yellow-800 mb-1">
              🧪 版型編輯器測試模式
            </h2>
            <p className="text-yellow-700 text-sm">
              {selectedTemplate
                ? `編輯版型: ${selectedTemplate.name} (ID: ${selectedTemplate.id})`
                : `建立新版型 - 產品: ${selectedProduct?.title} (ID: ${selectedProduct?.id})`
              }
            </p>
            <button
              onClick={handleCloseEditor}
              className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              關閉測試
            </button>
          </div>
        </div>

        {/* 這裡會顯示實際的TemplateEditor */}
        <TemplateEditor />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 版型編輯器測試工具
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 產品選擇 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 選擇產品</h3>
              <div className="space-y-2">
                {products.map(product => (
                  <label key={product.id} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="product"
                      checked={selectedProduct?.id === product.id}
                      onChange={() => setSelectedProduct(product)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">
                      {product.title} (ID: {product.id}, 類型: {product.category})
                    </span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleTestNewTemplate}
                disabled={!selectedProduct}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🆕 測試建立新版型
              </button>
            </div>

            {/* 版型列表 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎨 現有版型 ({templates.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {templates.length === 0 ? (
                  <p className="text-gray-500 text-sm">沒有找到版型</p>
                ) : (
                  templates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                      <div>
                        <p className="font-medium text-gray-900">{template.name}</p>
                        <p className="text-sm text-gray-500">
                          ID: {template.id} | 產品ID: {template.productId} |
                          元素: {template.elements?.length || 0} |
                          {template.isActive ? '✅' : '❌'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleTestEditTemplate(template)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        編輯
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 除錯資訊 */}
          <div className="mt-8 p-4 bg-gray-50 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">🔍 除錯資訊</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>產品數量: {products.length}</p>
              <p>版型數量: {templates.length}</p>
              <p>選中產品: {selectedProduct ? `${selectedProduct.title} (ID: ${selectedProduct.id})` : '無'}</p>
              <p>LocalStorage 檢查:</p>
              <ul className="ml-4 space-y-1">
                <li>monkind_products: {localStorage.getItem('monkind_products') ? '✅' : '❌'}</li>
                <li>monkind_templates: {localStorage.getItem('monkind_templates') ? '✅' : '❌'}</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={() => window.location.href = '/admin/templates'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              🔙 回到版型管理
            </button>
            <button
              onClick={() => window.location.href = '/database-reset.html'}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              🗑️ 資料庫重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTemplateEditor;