import React, { useState } from 'react';
import GLBViewer from '../components/GLBViewer';
import UVMapper from '../components/UVMapper';

const GLBTestPage = () => {
  const [glbUrl, setGlbUrl] = useState('');
  const [uvMapping, setUvMapping] = useState({
    defaultUV: {
      u: 0.5,
      v: 0.5,
      width: 0.4,
      height: 0.3
    }
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // 建立FormData進行文件上傳
      const formData = new FormData();
      formData.append('glb', file);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${API_URL}/upload/glb`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const fullUrl = `${API_URL.replace('/api', '')}${result.data.url}`;
        setGlbUrl(fullUrl);
        console.log('GLB上傳成功:', fullUrl);
      } else {
        console.error('上傳失敗:', result.message);
      }
    } catch (error) {
      console.error('上傳錯誤:', error);
    }
  };

  const handleUVChange = (uvType, property, value) => {
    setUvMapping(prev => ({
      ...prev,
      [uvType]: {
        ...prev[uvType],
        [property]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">GLB 預覽測試頁面</h1>

        {/* 文件上傳區 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">上傳 GLB 文件</h2>
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {glbUrl && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">✅ GLB 文件已上傳</p>
              <p className="text-green-700 text-xs mt-1">URL: {glbUrl}</p>
            </div>
          )}
        </div>

        {/* GLB 預覽區 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D 預覽器 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">3D 模型預覽</h2>
            <div className="aspect-video rounded-lg overflow-hidden border border-gray-300">
              <GLBViewer
                glbUrl={glbUrl}
                className="w-full h-full"
                showControls={true}
                autoRotate={true}
              />
            </div>
            <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
              <span>🎯 檢查模型是否正確載入與顯示</span>
              <span>💡 使用滑鼠拖拽旋轉視角</span>
            </div>
          </div>

          {/* UV 貼圖控制器 */}
          <div>
            <UVMapper
              uvMapping={uvMapping}
              onUVChange={handleUVChange}
              showPreview={true}
            />
          </div>
        </div>

        {/* 測試說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">測試說明</h3>
          <div className="text-blue-800 space-y-2">
            <p>1. 選擇一個 GLB 或 GLTF 文件進行上傳</p>
            <p>2. 上傳成功後，3D 模型會在左側預覽器中顯示</p>
            <p>3. 使用右側的 UV 貼圖控制器調整貼圖參數</p>
            <p>4. 在 3D 預覽器中可以：</p>
            <ul className="ml-6 list-disc">
              <li>拖拽滑鼠旋轉模型</li>
              <li>使用滾輪縮放</li>
              <li>右鍵拖拽平移視角</li>
              <li>使用控制面板切換線框模式和網格顯示</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GLBTestPage;