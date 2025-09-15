import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import productsData from '../../data/products.json';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundProduct = productsData.find(p => p.id === parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
    }
    setLoading(false);
  }, [id]);

  const handleStartDesigning = () => {
    navigate(`/editor/${id}`);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      alert('商品已加入購物車！');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">找不到商品</h2>
          <p className="text-gray-600 mb-6">抱歉，您要找的商品不存在。</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            回到商品列表
          </button>
        </div>
      </div>
    );
  }

  // 創建多個圖片變化 (模擬不同角度)
  const productImages = [
    product.image,
    product.image.replace('cccccc', 'dddddd'),
    product.image.replace('cccccc', 'eeeeee'),
    product.image.replace('cccccc', 'bbbbbb')
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按鈕 */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div>
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={productImages[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-96 object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`bg-gray-100 rounded overflow-hidden transition-all ${
                      currentImageIndex === index ? 'ring-2 ring-blue-500' : 'hover:opacity-75'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-semibold mb-2">
                  {product.category === 'mug' ? '馬克杯' :
                   product.category === 'tshirt' ? 'T恤' :
                   product.category === 'bag' ? '帆布袋' :
                   product.category === 'bottle' ? '保溫瓶' :
                   product.category === 'pillow' ? '抱枕套' : '商品'}
                </span>
                {product.featured && (
                  <span className="ml-2 inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full uppercase tracking-wide font-semibold">
                    熱銷
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.title}
              </h1>

              <div className="text-3xl font-bold text-blue-600 mb-6">
                NT$ {product.price.toLocaleString()}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">商品描述</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">商品特色</h3>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    高品質材料製作
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    支援客製化設計
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    耐用且實用
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    快速出貨服務
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleStartDesigning}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  開始製作
                </button>

                <button
                  onClick={handleAddToCart}
                  className="w-full border-2 border-gray-300 text-gray-700 py-4 px-6 rounded-lg text-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L9 21h10a2 2 0 002-2v-1M7 13v6a2 2 0 002 2h2M9 9h6v2H9z" />
                  </svg>
                  加入購物車 (標準版)
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💡 製作說明</h4>
                <p className="text-blue-800 text-sm">
                  點擊「開始製作」進入設計工具，您可以添加文字、圖片，創造獨一無二的商品！
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;