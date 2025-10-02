import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../services/api';

const ElementManagement = () => {
  const navigate = useNavigate();
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 載入元素列表
  const loadElements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API.elements.getAll();
      setElements(data);
    } catch (err) {
      setError('載入元素失敗');
      console.error('載入元素失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElements();
  }, []);

  // 上傳圖片元素
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadedElements = [];

      for (const file of files) {
        // 檢查文件類型
        if (!file.type.startsWith('image/')) {
          console.warn(`檔案 ${file.name} 不是圖片格式，已跳過`);
          continue;
        }

        try {
          // 使用 API 服務上傳圖片到伺服器
          const uploadResult = await API.elements.uploadImage(file);

          // 創建元素記錄
          const element = await API.elements.create({
            name: file.name.replace(/\.[^/.]+$/, ''), // 移除副檔名
            type: 'image',
            url: uploadResult.url, // 使用 API 返回的完整 URL
            fileName: uploadResult.filename,
            fileSize: file.size,
            mimeType: file.type
          });

          uploadedElements.push(element);
        } catch (fileError) {
          console.error(`上傳 ${file.name} 失敗:`, fileError);
          setError(`部分檔案上傳失敗: ${file.name}`);
        }
      }

      // 重新載入元素列表
      await loadElements();

      // 清空文件選擇
      event.target.value = '';

      if (uploadedElements.length > 0) {
        console.log(`成功上傳 ${uploadedElements.length} 個元素`);
      }

    } catch (err) {
      setError('上傳失敗');
      console.error('上傳失敗:', err);
    } finally {
      setUploading(false);
    }
  };

  // 刪除元素
  const handleDelete = async (elementId) => {
    if (!window.confirm('確定要刪除這個元素嗎？')) return;

    try {
      await API.elements.delete(elementId);
      await loadElements();
    } catch (err) {
      setError('刪除失敗');
      console.error('刪除失敗:', err);
    }
  };

  // 更新元素名稱
  const handleNameUpdate = async (elementId, newName) => {
    try {
      await API.elements.update(elementId, { name: newName });
      await loadElements();
    } catch (err) {
      setError('更新名稱失敗');
      console.error('更新名稱失敗:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                返回
              </button>
              <h1 className="text-2xl font-bold text-gray-900">🎨 元素管理</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 說明區域 */}
        <div className="mb-6">
          <p className="text-gray-600">管理設計元素，上傳圖片資源供編輯器使用</p>
        </div>

        {/* 錯誤提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 underline text-sm mt-1"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 上傳區域 */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">上傳圖片元素</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-gray-400 text-4xl mb-2">📁</div>
                <p className="text-gray-600 mb-2">
                  {uploading ? '上傳中...' : '點擊選擇圖片文件或拖拽到此處'}
                </p>
                <p className="text-sm text-gray-500">支援 JPG, PNG, GIF 等圖片格式</p>
              </label>
            </div>
          </div>
        </div>

        {/* 元素列表 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">元素列表 ({elements.length})</h2>
          </div>

          {elements.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-2">🎨</div>
              <p className="text-gray-500">還沒有上傳任何元素</p>
              <p className="text-sm text-gray-400 mt-1">上傳圖片來開始建立元素庫</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-6">
              {elements.map((element) => (
                <div key={element.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* 圖片預覽 */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <img
                      src={element.url}
                      alt={element.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* 元素資訊 */}
                  <div className="p-3">
                    <input
                      type="text"
                      value={element.name}
                      onChange={(e) => handleNameUpdate(element.id, e.target.value)}
                      className="w-full text-sm font-medium border-none outline-none bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded px-1 py-1"
                      onBlur={(e) => {
                        if (e.target.value !== element.name) {
                          handleNameUpdate(element.id, e.target.value);
                        }
                      }}
                    />

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>圖片</span>
                      <button
                        onClick={() => handleDelete(element.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="刪除元素"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 使用說明 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-medium mb-2">💡 使用說明</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 上傳的圖片將可在編輯器中作為圖片元素使用</li>
            <li>• 支援多選上傳，可同時選擇多個圖片文件</li>
            <li>• 點擊元素名稱可直接編輯重新命名</li>
            <li>• 刪除元素前請確認沒有版型正在使用該元素</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ElementManagement;