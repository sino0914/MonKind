import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold">MonKind</span>
            </div>
            <p className="text-gray-300 mb-4">
              專業的客製化商品製作平台，讓您的創意變成實體商品。
            </p>
            <div className="flex space-x-4">
              <button className="text-gray-300 hover:text-white">Facebook</button>
              <button className="text-gray-300 hover:text-white">Instagram</button>
              <button className="text-gray-300 hover:text-white">Twitter</button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速連結</h3>
            <ul className="space-y-2 text-gray-300">
              <li><button className="hover:text-white">關於我們</button></li>
              <li><button className="hover:text-white">服務條款</button></li>
              <li><button className="hover:text-white">隱私政策</button></li>
              <li><button className="hover:text-white">常見問題</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">聯絡我們</h3>
            <ul className="space-y-2 text-gray-300">
              <li>📧 support@monkind.com</li>
              <li>📞 0800-123-456</li>
              <li>📍 台北市信義區信義路五段7號</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 MonKind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;