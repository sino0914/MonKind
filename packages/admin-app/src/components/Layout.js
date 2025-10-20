import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.isAdmin === true;

  const navigation = [
    { name: '訂單管理', path: '/dashboard', icon: '📦', adminOnly: false },
    { name: '廠商管理', path: '/vendors', icon: '🏪', adminOnly: true },
    { name: '商品維護', path: '/products', icon: '📦', adminOnly: true },
    { name: '版型管理', path: '/templates', icon: '📐', adminOnly: true },
    { name: '元素管理', path: '/elements', icon: '🎨', adminOnly: true },
  ];

  // 根據角色過濾導航項目
  const filteredNavigation = navigation.filter((item) =>
    !item.adminOnly || isAdmin
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">
                  小怪禮
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {isAdmin ? '後台管理' : '廠商後台'}
                </span>
              </Link>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || user?.username}
                </div>
                <div className="text-xs text-gray-500">
                  {isAdmin ? '管理員' : '廠商'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
