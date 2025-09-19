/**
 * API 統一入口點
 * 提供所有資料服務的統一介面，方便之後替換為真實 API
 */

import productService from './ProductService';
import userService from './UserService';

// 匯出所有服務
export const API = {
  // 商品相關 API
  products: {
    // 基礎 CRUD
    getAll: () => productService.getAll(),
    getById: (id) => productService.getById(id),
    create: (data) => productService.create(data),
    update: (id, data) => productService.update(id, data),
    delete: (id) => productService.delete(id),

    // 商品特定功能
    getByCategory: (category) => productService.getByCategory(category),
    getFeatured: () => productService.getFeatured(),
    search: (criteria) => productService.searchProducts(criteria),
    getCategories: () => productService.getCategories(),
    getPriceRange: () => productService.getPriceRange(),
    getStats: () => productService.getProductStats(),

    // 設計區相關
    updatePrintArea: (productId, printArea) => productService.updatePrintArea(productId, printArea),
    batchUpdatePrintAreas: (updates) => productService.batchUpdatePrintAreas(updates),

    // 工具功能
    validate: (data) => productService.validateProduct(data),
    resetToDefault: () => productService.resetToDefault()
  },

  // 用戶相關 API
  users: {
    // 認證功能
    register: (userData) => userService.register(userData),
    login: (email, password) => userService.login(email, password),
    logout: () => userService.logout(),

    // 用戶狀態
    getCurrentUser: () => userService.getCurrentUser(),
    isLoggedIn: () => userService.isLoggedIn(),
    isAdmin: () => userService.isAdmin(),

    // 基礎 CRUD
    getAll: () => userService.getAll(),
    getById: (id) => userService.getById(id),
    update: (id, data) => userService.update(id, data),
    delete: (id) => userService.delete(id),

    // 用戶特定功能
    findByEmail: (email) => userService.findByEmail(email),
    updateProfile: (userId, profileData) => userService.updateProfile(userId, profileData),
    changePassword: (userId, oldPassword, newPassword) => userService.changePassword(userId, oldPassword, newPassword),
    search: (criteria) => userService.searchUsers(criteria),
    getStats: () => userService.getUserStats(),

    // 工具功能
    validate: (data) => userService.validateUserData(data),
    resetToDefault: () => userService.resetToDefault()
  }
};

// 系統工具
export const SystemAPI = {
  // 清空所有資料
  clearAllData: async () => {
    try {
      await productService.clearAll();
      await userService.clearAll();
      localStorage.removeItem('monkind_current_user');
      console.log('所有資料已清空');
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('清空資料失敗');
    }
  },

  // 重置所有資料為預設值
  resetAllData: async () => {
    try {
      await productService.resetToDefault();
      await userService.resetToDefault();
      console.log('所有資料已重置為預設值');
      return true;
    } catch (error) {
      console.error('Error resetting all data:', error);
      throw new Error('重置資料失敗');
    }
  },

  // 獲取系統統計
  getSystemStats: async () => {
    try {
      const [productStats, userStats] = await Promise.all([
        productService.getProductStats(),
        userService.getUserStats()
      ]);

      return {
        products: productStats,
        users: userStats,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        products: { total: 0 },
        users: { total: 0 },
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // 匯出資料（用於備份）
  exportData: async () => {
    try {
      const [products, users] = await Promise.all([
        productService.getAll(),
        userService.getAll()
      ]);

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          products,
          users: users.map(user => {
            // 移除密碼
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
          })
        }
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('匯出資料失敗');
    }
  },

  // 匯入資料
  importData: async (importData) => {
    try {
      if (!importData.data || !importData.data.products || !importData.data.users) {
        throw new Error('匯入資料格式錯誤');
      }

      // 清空現有資料
      await SystemAPI.clearAllData();

      // 匯入新資料
      const products = importData.data.products;
      const users = importData.data.users;

      // 重新初始化服務
      localStorage.setItem('monkind_products', JSON.stringify(products));
      localStorage.setItem('monkind_users', JSON.stringify(users));

      console.log('資料匯入成功');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
};

// 錯誤處理工具
export const ErrorHandler = {
  // 統一錯誤處理
  handleError: (error, context = '') => {
    console.error(`Error in ${context}:`, error);

    // 可以在這裡加入錯誤報告服務
    // 例如：Sentry, LogRocket 等

    return {
      success: false,
      message: error.message || '發生未知錯誤',
      timestamp: new Date().toISOString()
    };
  },

  // 成功回應格式
  handleSuccess: (data, message = '操作成功') => {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }
};

// 開發工具（僅在開發環境使用）
export const DevTools = {
  // 在瀏覽器控制台暴露 API（開發用）
  exposeToConsole: () => {
    if (process.env.NODE_ENV === 'development') {
      window.MonKindAPI = API;
      window.MonKindSystem = SystemAPI;
      console.log('🛠️ MonKind API 已暴露到 window.MonKindAPI');
      console.log('🛠️ 系統工具已暴露到 window.MonKindSystem');
    }
  },

  // 生成測試資料
  generateTestData: async () => {
    try {
      // 可以在這裡加入生成測試資料的邏輯
      console.log('測試資料生成功能尚未實作');
      return false;
    } catch (error) {
      console.error('Error generating test data:', error);
      throw new Error('生成測試資料失敗');
    }
  }
};

// 在開發環境自動暴露 API
if (process.env.NODE_ENV === 'development') {
  DevTools.exposeToConsole();
}

// 預設匯出主要 API
export default API;