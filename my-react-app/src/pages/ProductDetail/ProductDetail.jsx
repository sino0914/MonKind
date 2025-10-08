import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { API } from '../../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 新增：廠商選擇
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // 新增：數量選擇
  const [quantity, setQuantity] = useState(1);

  // 載入商品資料
  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('載入商品詳情 ID:', id);
      const foundProduct = await API.products.getById(parseInt(id));

      // 檢查商品是否存在
      if (!foundProduct) {
        setError('找不到此商品');
        return;
      }

      // 檢查商品是否啟用
      if (foundProduct.isActive === false) {
        setError('此商品目前無法購買');
        return;
      }

      console.log('載入的商品詳情:', foundProduct);
      setProduct(foundProduct);
    } catch (error) {
      console.error('載入商品詳情失敗:', error);

      if (error.message.includes('找不到')) {
        setError('商品不存在或已被移除');
      } else {
        setError('載入商品失敗，請重新嘗試');
      }
    } finally {
      setLoading(false);
    }
  };

  // 載入廠商資料
  const loadVendors = async () => {
    try {
      const activeVendors = await API.vendors.getActive();
      setVendors(activeVendors);

      // 預設選擇第一個廠商
      if (activeVendors.length > 0) {
        setSelectedVendor(activeVendors[0].id);
      }
    } catch (error) {
      console.error('載入廠商列表失敗:', error);
    }
  };

  useEffect(() => {
    if (id) {
      loadProduct();
      loadVendors();
    }
  }, [id]);

  const handleStartDesigning = () => {
    navigate(`/editor/${id}`);
  };

  const handleAddToCart = () => {
    if (product) {
      // 驗證廠商選擇
      if (!selectedVendor) {
        alert('請選擇廠商');
        return;
      }

      // 加入購物車時帶上廠商和數量資訊
      const productWithDetails = {
        ...product,
        vendorId: selectedVendor,
        quantity: quantity
      };

      addToCart(productWithDetails);
      alert(`已將 ${quantity} 件商品加入購物車！`);
    }
  };

  // 數量增減控制
  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 999) {
      setQuantity(newQuantity);
    }
  };

  // 載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入商品詳情中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">無法載入商品</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => navigate('/products')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              回到商品頁
            </button>
            <button
              onClick={loadProduct}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 商品不存在
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

  // 創建圖片陣列：主圖 + 內容圖片
  const productImages = [
    product.image, // 主圖永遠是第一張
    ...(product.contentImages || []) // 添加內容圖片
  ];

  // 確保 currentImageIndex 不超出範圍
  const validCurrentImageIndex = Math.min(currentImageIndex, productImages.length - 1);

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
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                <img
                  src={productImages[validCurrentImageIndex]}
                  alt={product.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    console.error('圖片載入失敗:', e.target.src);
                    e.target.src = product.image; // 失敗時回到主圖
                  }}
                />

                {/* 圖片導航箭頭 */}
                {productImages.length > 1 && (
                  <>
                    {validCurrentImageIndex > 0 && (
                      <button
                        onClick={() => setCurrentImageIndex(validCurrentImageIndex - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}

                    {validCurrentImageIndex < productImages.length - 1 && (
                      <button
                        onClick={() => setCurrentImageIndex(validCurrentImageIndex + 1)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}

                    {/* 圖片指示器 */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {productImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === validCurrentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* 圖片數量顯示 */}
                {productImages.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                    {validCurrentImageIndex + 1} / {productImages.length}
                  </div>
                )}
              </div>

              {/* 縮圖導航 */}
              {productImages.length > 1 && (
                <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${Math.min(productImages.length, 5)}, 1fr)`}}>
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`bg-gray-100 rounded overflow-hidden transition-all relative ${
                        validCurrentImageIndex === index ? 'ring-2 ring-blue-500' : 'hover:opacity-75'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          console.error('縮圖載入失敗:', e.target.src);
                          if (index === 0) {
                            e.target.src = product.image;
                          } else {
                            e.target.style.display = 'none';
                          }
                        }}
                      />
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          主圖
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 當只有主圖時的提示 */}
              {productImages.length === 1 && (
                <div className="text-center text-gray-500 text-sm mt-2">
                  查看更多圖片請點擊「開始設計」自訂您的商品
                </div>
              )}
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

              {/* 廠商選擇 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">選擇廠商</h3>
                {vendors.length > 0 ? (
                  <select
                    value={selectedVendor || ''}
                    onChange={(e) => setSelectedVendor(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-500 text-sm">載入廠商資料中...</div>
                )}
              </div>

              {/* 數量選擇 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">選擇數量</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.min(999, Math.max(1, val)));
                    }}
                    className="w-20 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 999}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
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