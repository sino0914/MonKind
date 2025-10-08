import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../services/api';
import { HttpAPI } from '../../services/HttpApiService';
import { useCart } from '../../context/CartContext';
import ProductThumbnail from '../../components/Preview/ProductThumbnail';

const MyWorks = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNameId, setEditingNameId] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // 載入草稿資料
  const loadDrafts = async () => {
    try {
      setLoading(true);

      // 獲取當前用戶（暫時使用 guest，未來整合登入系統）
      const currentUser = HttpAPI.users.getCurrentUser();
      const userId = currentUser?.id || 'guest';

      // 載入產品資料
      const allProducts = await API.products.getAll();
      const productMap = {};
      allProducts.forEach(product => {
        productMap[product.id] = product;
      });

      // 從伺服器載入草稿
      const serverDrafts = await HttpAPI.drafts.getAll(userId);

      // 將產品資料附加到草稿
      const draftList = serverDrafts.map(draft => ({
        ...draft,
        product: productMap[draft.productId]
      })).filter(draft => draft.product); // 過濾掉找不到產品的草稿

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
      workName: draft.name || '', // 傳遞作品名稱
      snapshot3D: draft.snapshot3D, // 傳遞 3D 快照
      timestamp: Date.now()
    };
    sessionStorage.setItem('editingDesignData', JSON.stringify(editData));
    navigate(`/editor/${draft.productId}`);
  };

  // 獲取草稿快照（優先使用對應類型的快照）
  const getDraftSnapshot = (draft) => {
    if (draft.product?.type === '3D') {
      return draft.snapshot3D;
    } else {
      return draft.snapshot2D;
    }
  };

  // 刪除草稿
  const handleDeleteDraft = async (draftId) => {
    if (window.confirm('確定要刪除這個草稿嗎？')) {
      try {
        const currentUser = HttpAPI.users.getCurrentUser();
        const userId = currentUser?.id || 'guest';

        await HttpAPI.drafts.delete(userId, draftId);
        setDrafts(prev => prev.filter(draft => draft.id !== draftId));
      } catch (error) {
        console.error('刪除草稿失敗:', error);
        alert('刪除草稿失敗，請稍後重試');
      }
    }
  };

  // 加入購物車
  const handleAddToCart = (draft) => {
    if (draft.elements && draft.elements.length > 0) {
      // 只複製必要的商品欄位，排除 GLB 等大型資料
      const { model3D, ...productWithoutModel } = draft.product;

      const customProduct = {
        ...productWithoutModel,
        id: `custom_${draft.product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalProductId: draft.product.id,
        title: `客製化 ${draft.product.title}`,
        price: draft.product.price + 50,
        isCustom: true,
        type: draft.product.type, // 保留類型（用於判斷是否為 3D）
        quantity: 1, // 從我的作品加入購物車，數量預設為 1
        designData: {
          elements: draft.elements, // 保留完整的設計元素（包括圖片）
          backgroundColor: draft.backgroundColor || '#ffffff'
        },
        // 保留快照用於顯示
        snapshot3D: draft.snapshot3D,
        snapshot2D: draft.snapshot2D
      };
      addToCart(customProduct);
      alert('已加入購物車！');
    } else {
      alert('此草稿沒有設計內容，無法加入購物車');
    }
  };

  // 開始重新命名
  const handleStartRename = (draft) => {
    setEditingNameId(draft.id);
    setEditingNameValue(draft.name || draft.product?.title || '');
  };

  // 儲存重新命名
  const handleSaveRename = async (draftId) => {
    if (editingNameValue.trim()) {
      try {
        const currentUser = HttpAPI.users.getCurrentUser();
        const userId = currentUser?.id || 'guest';

        const draft = drafts.find(d => d.id === draftId);
        if (!draft) return;

        // 更新草稿名稱
        const updatedDraft = {
          ...draft,
          name: editingNameValue.trim()
        };

        await HttpAPI.drafts.save(userId, updatedDraft);

        // 更新本地狀態
        setDrafts(prev => prev.map(d =>
          d.id === draftId ? { ...d, name: editingNameValue.trim() } : d
        ));

        setEditingNameId(null);
        setEditingNameValue('');
      } catch (error) {
        console.error('重新命名失敗:', error);
        alert('重新命名失敗');
      }
    }
  };

  // 取消重新命名
  const handleCancelRename = () => {
    setEditingNameId(null);
    setEditingNameValue('');
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
                    snapshot3D={draft.snapshot3D || null}
                    snapshot2D={draft.snapshot2D || null}
                  />
                </div>

                <div className="p-4">
                  {editingNameId === draft.id ? (
                    <div className="mb-2">
                      <input
                        type="text"
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveRename(draft.id);
                          } else if (e.key === 'Escape') {
                            handleCancelRename();
                          }
                        }}
                      />
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleSaveRename(draft.id)}
                          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          ✓ 確定
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          ✗ 取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate flex-1" title={draft.name || draft.product?.title || '未知商品'}>
                        {draft.name || draft.product?.title || '未知商品'}
                      </h3>
                      <button
                        onClick={() => handleStartRename(draft)}
                        className="ml-2 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="重新命名"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                  <p className="text-gray-500 text-xs mb-2">
                    商品: {draft.product?.title || '未知商品'}
                  </p>
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