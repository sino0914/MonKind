import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '@monkind/shared/services/api';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('熱銷');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { key: 'featured', label: '熱銷' },
    { key: 'mug', label: '馬克杯' },
    { key: 'tshirt', label: 'T恤' },
    { key: 'bag', label: '帆布袋' },
    { key: 'bottle', label: '水瓶' },
    { key: 'pillow', label: '抱枕' },
    { key: 'notebook', label: '筆記本' },
    { key: 'other', label: '其他' }
  ];

  // 載入商品資料（只顯示啟用的商品）
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const allProducts = await API.products.getAll();
      console.log('載入的所有商品:', allProducts);

      // 只顯示啟用的商品
      const activeProducts = allProducts.filter(product => product.isActive !== false);
      console.log('啟用的商品:', activeProducts);

      setProducts(activeProducts);
      filterProducts('featured', activeProducts);
    } catch (error) {
      console.error('載入商品失敗:', error);
      setError('載入商品失敗，請重新整理頁面');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filterProducts = (categoryKey, productsList = products) => {
    let filtered;

    switch (categoryKey) {
      case 'featured':
        filtered = productsList.filter(product => product.featured);
        break;
      case 'mug':
        filtered = productsList.filter(product => product.category === 'mug');
        break;
      case 'tshirt':
        filtered = productsList.filter(product => product.category === 'tshirt');
        break;
      case 'bag':
        filtered = productsList.filter(product => product.category === 'bag');
        break;
      case 'bottle':
        filtered = productsList.filter(product => product.category === 'bottle');
        break;
      case 'pillow':
        filtered = productsList.filter(product => product.category === 'pillow');
        break;
      case 'notebook':
        filtered = productsList.filter(product => product.category === 'notebook');
        break;
      case 'other':
        filtered = productsList.filter(product =>
          !['mug', 'tshirt', 'bag', 'bottle', 'pillow', 'notebook'].includes(product.category)
        );
        break;
      default:
        filtered = productsList;
    }

    setFilteredProducts(filtered);
  };

  const handleCategoryChange = (categoryKey, categoryLabel) => {
    setActiveCategory(categoryLabel);
    filterProducts(categoryKey);
  };

  const handleStartDesigning = (productId) => {
    // 清除任何現有的編輯資料，確保是全新設計
    sessionStorage.removeItem('editingDesignData');

    // 創建新的設計ID
    const newDesignId = `design_${Date.now()}`;

    // 跳轉到編輯器，帶上新設計參數
    navigate(`/editor/${productId}?new=${newDesignId}`);
  };

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  // 載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">逛產品</h1>
            <p className="text-gray-600">探索我們的客製化商品，讓您的創意變成現實</p>
          </div>

          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">載入商品中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">逛產品</h1>
            <p className="text-gray-600">探索我們的客製化商品，讓您的創意變成現實</p>
          </div>

          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md mx-auto">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">載入失敗</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadProducts}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                重新載入
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">逛產品</h1>
          <p className="text-gray-600">探索我們的客製化商品，讓您的創意變成現實</p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => handleCategoryChange(category.key, category.label)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeCategory === category.label
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Products Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            找到 <span className="font-semibold text-gray-900">{filteredProducts.length}</span> 個商品
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                {/* Product Image */}
                <div className="relative">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => handleViewDetails(product.id)}
                  />
                  {product.featured && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      熱銷
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                    {product.category === 'mug' ? '馬克杯' :
                     product.category === 'tshirt' ? 'T恤' :
                     product.category === 'bag' ? '帆布袋' :
                     product.category === 'bottle' ? '水瓶' :
                     product.category === 'pillow' ? '抱枕' :
                     product.category === 'notebook' ? '筆記本' : '商品'}
                  </div>
                  {/* 圖片數量提示 */}
                  {product.contentImages && product.contentImages.length > 0 && (
                    <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {product.contentImages.length + 1}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3
                    className="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleViewDetails(product.id)}
                  >
                    {product.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      NT$ {product.price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(product.id)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      查看詳情
                    </button>
                    <button
                      onClick={() => handleStartDesigning(product.id)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      開始製作
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暫無商品</h3>
            <p className="text-gray-600">此分類目前沒有可用的商品</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;