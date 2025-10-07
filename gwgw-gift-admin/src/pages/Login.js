import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    userType: 'admin', // 預設為管理員登入
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.auth.login(
        formData.username,
        formData.password,
        formData.userType
      );

      if (response.success) {
        login(response.data);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || '登入失敗，請檢查帳號密碼');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MonKind 後台管理系統
          </h1>
          <p className="text-gray-600">請登入以繼續</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 用戶類型選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              登入身份
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, userType: 'admin' })
                }
                className={`py-3 px-4 rounded-lg border-2 transition-all ${
                  formData.userType === 'admin'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">👨‍💼</div>
                <div className="text-sm font-medium">管理員</div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, userType: 'vendor' })
                }
                className={`py-3 px-4 rounded-lg border-2 transition-all ${
                  formData.userType === 'vendor'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">🏪</div>
                <div className="text-sm font-medium">廠商</div>
              </button>
            </div>
          </div>

          {/* 帳號 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              帳號
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="請輸入帳號"
              required
            />
          </div>

          {/* 密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密碼
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="請輸入密碼"
              required
            />
          </div>

          {/* 登入按鈕 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        {/* 提示訊息 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>預設管理員帳號：admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
