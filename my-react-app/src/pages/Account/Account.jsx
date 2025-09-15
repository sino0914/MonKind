import React from 'react';

const Account = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">我的帳號</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">👤</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">張小明</h2>
                <p className="text-gray-600">ming.zhang@example.com</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    defaultValue="張小明"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
                  <input
                    type="email"
                    defaultValue="ming.zhang@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                  <input
                    type="tel"
                    defaultValue="0912-345-678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                  更新資料
                </button>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-6">訂單歷史</h3>

              <div className="space-y-4">
                {/* Order Item */}
                {[
                  { id: 'ORD-2024-001', date: '2024-03-01', status: '已送達', total: 1198, items: 2 },
                  { id: 'ORD-2024-002', date: '2024-02-15', status: '運送中', total: 599, items: 1 },
                  { id: 'ORD-2024-003', date: '2024-01-20', status: '處理中', total: 799, items: 1 },
                ].map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">訂單 {order.id}</h4>
                        <p className="text-sm text-gray-600">下單日期: {order.date}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === '已送達' ? 'bg-green-100 text-green-800' :
                          order.status === '運送中' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{order.items} 件商品</span>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">NT$ {order.total}</span>
                        <button className="text-blue-600 text-sm hover:underline">
                          查看詳情
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;