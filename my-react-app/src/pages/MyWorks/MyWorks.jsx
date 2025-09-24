import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../services/api';
import { useCart } from '../../context/CartContext';
import ProductThumbnail from '../../components/Preview/ProductThumbnail';
import DatabaseCleaner from '../../utils/DatabaseCleaner';

const MyWorks = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 載入草稿資料
  const loadDrafts = async () => {
    try {
      setLoading(true);
      const allProducts = await API.products.getAll();
      const productMap = {};
      allProducts.forEach(product => {
        productMap[product.id] = product;
      });

      // 從 localStorage 中載入所有草稿
      const draftList = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('draft_')) {
          try {
            const draftData = JSON.parse(localStorage.getItem(key));

            // 處理新舊格式的草稿ID
            let extractedProductId;
            if (key.includes('_') && key.split('_').length > 2) {
              // 新格式: draft_productId_timestamp
              extractedProductId = key.split('_')[1];
            } else {
              // 舊格式: draft_productId
              extractedProductId = key.replace('draft_', '');
            }

            const product = productMap[extractedProductId];

            if (product && draftData) {
              draftList.push({
                id: key,
                productId: parseInt(extractedProductId),
                product: product,
                ...draftData
              });
            }
          } catch (error) {
            console.error('解析草稿失敗:', key, error);
          }
        }
      }

      // 按時間排序，最新的在前面
      draftList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setDrafts(draftList);
    } catch (error) {
      console.error('載入草稿失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  // 編輯草稿
  const handleEditDraft = (draft) => {
    // 將草稿資料載入到 sessionStorage 供編輯器使用
    const editData = {
      cartItemId: null, // 不是從購物車編輯
      originalProductId: draft.productId,
      draftId: draft.id, // 新增：傳遞草稿ID
      designData: {
        elements: draft.elements || [],
        backgroundColor: draft.backgroundColor || '#ffffff'
      },
      timestamp: Date.now()
    };
    sessionStorage.setItem('editingDesignData', JSON.stringify(editData));
    navigate(`/editor/${draft.productId}`);
  };

  // 刪除草稿
  const handleDeleteDraft = (draftId) => {
    if (window.confirm('確定要刪除這個草稿嗎？')) {
      localStorage.removeItem(draftId);
      setDrafts(prev => prev.filter(draft => draft.id !== draftId));
    }
  };

  // 加入購物車
  const handleAddToCart = (draft) => {
    if (draft.elements && draft.elements.length > 0) {
      const customProduct = {
        ...draft.product,
        id: `custom_${Date.now()}`,
        originalProductId: draft.product.id,
        title: `客製化 ${draft.product.title}`,
        price: draft.product.price + 50,
        isCustom: true,
        designData: {
          elements: draft.elements,
          backgroundColor: draft.backgroundColor || '#ffffff'
        }
      };
      addToCart(customProduct);
      alert('已加入購物車！');
    } else {
      alert('此草稿沒有設計內容，無法加入購物車');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">載入作品中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">我的作品</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              共 {drafts.length} 個草稿
            </div>
            {/* 開發工具 */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => DatabaseCleaner.resetToDefault()}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                title="重置資料庫（開發工具）"
              >
                🗑️ 重置DB
              </button>
            )}
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">還沒有作品</h3>
            <p className="text-gray-600 mb-6">
              開始設計你的第一個作品吧！<br />
              在編輯器中點擊「儲存」按鈕即可保存草稿
            </p>
            <button
              onClick={() => navigate('/products')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              開始設計
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* 預覽區域 */}
                <div className="h-48 flex items-center justify-center relative p-4">
                  <ProductThumbnail
                    product={draft.product}
                    designElements={draft.elements || []}
                    backgroundColor={draft.backgroundColor || '#ffffff'}
                    width={160}
                    height={160}
                    showElementCount={true}
                    className="shadow-sm"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">
                    {draft.product?.title || '未知商品'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    儲存時間: {new Date(draft.timestamp).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    商品類型: {draft.product?.category || '未知'}
                  </p>

                  <div className="space-y-2">
                    {/* 編輯和刪除按鈕 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditDraft(draft)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        繼續編輯
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition-colors"
                        title="刪除草稿"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* 加入購物車按鈕 */}
                    <button
                      onClick={() => handleAddToCart(draft)}
                      disabled={!draft.elements || draft.elements.length === 0}
                      className={`w-full py-2 px-3 rounded text-sm transition-colors ${
                        draft.elements && draft.elements.length > 0
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {draft.elements && draft.elements.length > 0 ? '加入購物車' : '空白草稿'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWorks;