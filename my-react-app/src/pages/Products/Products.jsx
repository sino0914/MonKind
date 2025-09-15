import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import productsData from '../../data/products.json';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('熱銷');

  const categories = [
    { key: 'featured', label: '熱銷' },
    { key: 'mug', label: '馬克杯' },
    { key: 'tshirt', label: 'T恤' },
    { key: 'bag', label: '帆布袋' },
    { key: 'other', label: '其他' }
  ];

  useEffect(() => {
    setProducts(productsData);
    filterProducts('featured', productsData);
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
      case 'other':
        filtered = productsList.filter(product =>
          !['mug', 'tshirt', 'bag'].includes(product.category)
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
    navigate(`/editor/${productId}`);
  };

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

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
                     product.category === 'bottle' ? '保溫瓶' :
                     product.category === 'pillow' ? '抱枕套' : '商品'}
                  </div>
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