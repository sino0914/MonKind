import React, { useState } from 'react';
import DatabaseCleaner from '../utils/DatabaseCleaner';

const DatabaseReset = () => {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (message) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleReset = async () => {
    if (!window.confirm('確定要重置所有資料嗎？這會清除所有草稿、購物車和設定。')) {
      return;
    }

    setProcessing(true);
    setResults([]);

    try {
      addResult('開始檢查資料完整性...');
      const issues = DatabaseCleaner.checkDataIntegrity();

      if (issues.length > 0) {
        addResult(`發現 ${issues.length} 個資料問題: ${issues.join(', ')}`);
      } else {
        addResult('資料完整性檢查通過');
      }

      addResult('開始重置資料庫...');
      await DatabaseCleaner.resetToDefault();
      addResult('資料庫重置完成');
    } catch (error) {
      addResult(`錯誤: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearOnly = () => {
    if (!window.confirm('確定要清除所有資料嗎？')) {
      return;
    }

    const count = DatabaseCleaner.clearAll();
    addResult(`已清除 ${count} 個 localStorage 項目`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🗑️ 資料庫重置工具</h1>

          <div className="space-y-4 mb-6">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h3>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• 這會清除所有草稿、購物車、版型等資料</li>
                <li>• 重置後會重新載入頁面</li>
                <li>• 建議在重置前先匯出備份</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleReset}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? '處理中...' : '🔄 完整重置'}
              </button>

              <button
                onClick={handleClearOnly}
                disabled={processing}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                🗑️ 僅清除資料
              </button>

              <button
                onClick={() => DatabaseCleaner.exportBackup()}
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                💾 匯出備份
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                🏠 回首頁
              </button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">執行日誌</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="text-sm text-gray-700 font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseReset;