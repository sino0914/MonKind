import React from 'react';

const MyWorks = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">我的作品</h1>

        {/* Works Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Work placeholders */}
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-gray-200 h-48 flex items-center justify-center">
                <span className="text-gray-500">作品預覽</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">作品標題 {i + 1}</h3>
                <p className="text-gray-600 text-sm mb-2">建立日期: 2024-03-{i + 1 < 10 ? '0' : ''}{i + 1}</p>
                <p className="text-gray-600 text-sm mb-4">類型: 馬克杯</p>

                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                    編輯
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-50 transition-colors">
                    複製
                  </button>
                  {Math.random() > 0.5 ? (
                    <span className="flex-1 text-center py-2 px-3 bg-green-100 text-green-800 rounded text-sm">
                      已購買
                    </span>
                  ) : (
                    <button className="flex-1 bg-orange-600 text-white py-2 px-3 rounded text-sm hover:bg-orange-700 transition-colors">
                      購買
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyWorks;