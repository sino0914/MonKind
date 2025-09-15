import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const Header = () => {
  const { getCartItemsCount } = useCart();
  const location = useLocation();
  const cartItemsCount = getCartItemsCount();

  const navItems = [
    { path: '/', label: '首頁', icon: '🏠' },
    { path: '/works', label: '我的作品', icon: '🎨' },
    { path: '/products', label: '逛產品', icon: '🛍️' },
    { path: '/cart', label: '購物車', icon: '🛒', badge: cartItemsCount },
    { path: '/account', label: '帳號', icon: '👤' },
  ];

  return (
    <header className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MonKind</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
            <span className="sr-only">Open main menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t bg-gray-50">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === item.path
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;