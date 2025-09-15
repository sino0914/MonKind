import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productsData from '../../data/products.json';

const Home = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    // 取得標記為熱門的商品，最多顯示 4 個
    const featured = productsData.filter(product => product.featured).slice(0, 4);
    setFeaturedProducts(featured);
  }, []);

  const handleStartDesigning = (productId) => {
    navigate(`/editor/${productId}`);
  };

  const handleViewDetails = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleExploreProducts = () => {
    navigate('/products');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            讓創意成為現實
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            設計專屬於你的商品，馬克杯、T恤、帆布袋等各種客製化商品。
            用我們的設計工具，讓您的想法變成獨一無二的實體商品。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleExploreProducts}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              開始探索
            </button>
            <button
              onClick={() => navigate('/works')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              查看作品
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">為什麼選擇 MonKind？</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              我們提供專業的客製化服務，讓您輕鬆創造獨特的商品
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">簡單設計工具</h3>
              <p className="text-gray-600">直觀的設計介面，讓任何人都能輕鬆創作</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">高品質保證</h3>
              <p className="text-gray-600">精選材料，專業印刷，確保最佳品質</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">快速交付</h3>
              <p className="text-gray-600">高效製作流程，快速將您的設計變成實物</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">熱門商品</h2>
            <p className="text-gray-600">探索我們最受歡迎的客製化商品</p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => handleViewDetails(product.id)}
                    />
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      熱銷
                    </div>
                  </div>
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
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        NT$ {product.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleStartDesigning(product.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        開始製作
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">載入商品中...</p>
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={handleExploreProducts}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              查看所有商品
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">準備開始創作了嗎？</h2>
          <p className="text-xl text-blue-100 mb-8">
            加入數千位用戶的行列，創造屬於您的獨特商品
          </p>
          <button
            onClick={handleExploreProducts}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            立即開始設計
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;