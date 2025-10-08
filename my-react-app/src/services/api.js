/**
 * API 統一入口點
 * 已替換為真實的 HTTP API 服務
 */

import { HttpAPI } from './HttpApiService';

// 匯出所有服務
export const API = {
  // 商品相關 API
  products: {
    // 基礎 CRUD - 使用 HttpAPI
    getAll: () => HttpAPI.products.getAll(),
    getById: (id) => HttpAPI.products.getById(id),
    create: (data) => HttpAPI.products.create(data),
    update: (id, data) => HttpAPI.products.update(id, data),
    delete: (id) => HttpAPI.products.delete(id),

    // 商品特定功能 - 使用 HttpAPI
    getByCategory: (category) => HttpAPI.products.getByCategory(category),
    getFeatured: () => HttpAPI.products.getFeatured(),
    getStats: () => HttpAPI.products.getStats(),

    // 尚未實作的功能（將來可擴展）
    search: (criteria) => Promise.resolve([]),
    getCategories: () => Promise.resolve(['T恤', '帽子', '包包', '其他']),
    getPriceRange: () => Promise.resolve({ min: 0, max: 2000 }),

    // 設計區相關（保持現有邏輯）
    updatePrintArea: async (productId, printArea) => {
      const product = await HttpAPI.products.getById(productId);
      const updatedProduct = { ...product, printArea };
      return HttpAPI.products.update(productId, updatedProduct);
    },
    batchUpdatePrintAreas: async (updates) => {
      const results = [];
      for (const { productId, printArea } of updates) {
        const result = await API.products.updatePrintArea(productId, printArea);
        results.push(result);
      }
      return results;
    },

    // GLB 文件上傳
    uploadGLB: (productId, file) => HttpAPI.products.uploadGLB(productId, file),

    // 工具功能（暫時保持簡單實現）
    validate: (data) => Promise.resolve(true),
    resetToDefault: () => Promise.resolve(true)
  },

  // 用戶相關 API
  users: {
    // 認證功能 - 使用 HttpAPI
    register: (userData) => HttpAPI.users.register(userData),
    login: (email, password) => HttpAPI.users.login(email, password),
    logout: () => HttpAPI.users.logout(),

    // 用戶狀態 - 使用 HttpAPI
    getCurrentUser: () => HttpAPI.users.getCurrentUser(),
    isLoggedIn: () => HttpAPI.users.isLoggedIn(),
    isAdmin: () => HttpAPI.users.isAdmin(),

    // 基礎 CRUD - 使用 HttpAPI
    getAll: () => HttpAPI.users.getAll(),
    getById: (id) => HttpAPI.users.getById(id),

    // 尚未實作的功能（將來可擴展）
    update: (id, data) => Promise.resolve(data),
    delete: (id) => Promise.resolve(true),
    findByEmail: (email) => Promise.resolve(null),
    updateProfile: (userId, profileData) => Promise.resolve(profileData),
    changePassword: (userId, oldPassword, newPassword) => Promise.resolve(true),
    search: (criteria) => Promise.resolve([]),
    getStats: () => Promise.resolve({ total: 0 }),

    // 工具功能（暫時保持簡單實現）
    validate: (data) => Promise.resolve(true),
    resetToDefault: () => Promise.resolve(true)
  },

  // 版型相關 API
  templates: {
    // 基礎 CRUD - 使用 HttpAPI
    getAll: () => HttpAPI.templates.getAll(),
    getById: (id) => HttpAPI.templates.getById(id),
    create: (data) => HttpAPI.templates.create(data),
    update: (id, data) => HttpAPI.templates.update(id, data),
    delete: (id) => HttpAPI.templates.delete(id),

    // 版型特定功能 - 使用 HttpAPI
    getByProductId: (productId) => HttpAPI.templates.getByProductId(productId),

    // 尚未實作的功能（將來可擴展）
    getByCategory: (category) => Promise.resolve([]),
    duplicate: async (id, newName) => {
      const template = await HttpAPI.templates.getById(id);
      const duplicatedTemplate = { ...template, name: newName, id: undefined };
      return HttpAPI.templates.create(duplicatedTemplate);
    },
    toggleActive: async (id) => {
      const template = await HttpAPI.templates.getById(id);
      const updatedTemplate = { ...template, isActive: !template.isActive };
      return HttpAPI.templates.update(id, updatedTemplate);
    },
    generateThumbnail: (templateId, canvasElement) => Promise.resolve(''),

    // 搜尋和統計
    search: (criteria) => Promise.resolve([]),
    getStats: () => Promise.resolve({ total: 0 }),

    // 工具功能（暫時保持簡單實現）
    validate: (data) => Promise.resolve(true),
    resetToDefault: () => Promise.resolve(true)
  },

  // 元素相關 API
  elements: {
    // 基礎 CRUD - 使用 HttpAPI
    getAll: () => HttpAPI.elements.getAll(),
    getById: (id) => HttpAPI.elements.getById(id),
    create: (data) => HttpAPI.elements.create(data),
    update: (id, data) => HttpAPI.elements.update(id, data),
    delete: (id) => HttpAPI.elements.delete(id),

    // 圖片上傳
    uploadImage: (file) => HttpAPI.elements.uploadImage(file),

    // 批量操作（暫時使用簡單實現）
    batchDelete: async (ids) => {
      const results = [];
      for (const id of ids) {
        try {
          const result = await HttpAPI.elements.delete(id);
          results.push(result);
        } catch (error) {
          console.error(`刪除元素 ${id} 失敗:`, error);
        }
      }
      return results;
    },

    // 搜尋和統計
    search: async (criteria) => {
      const allElements = await HttpAPI.elements.getAll();
      let filtered = allElements;

      if (criteria.name) {
        filtered = filtered.filter(element =>
          element.name.toLowerCase().includes(criteria.name.toLowerCase())
        );
      }

      if (criteria.type) {
        filtered = filtered.filter(element => element.type === criteria.type);
      }

      return filtered;
    },
    getStats: () => HttpAPI.elements.getStats(),

    // 工具功能（暫時保持簡單實現）
    resetToDefault: () => Promise.resolve({ success: true }),
    exportData: async () => {
      const elements = await HttpAPI.elements.getAll();
      return {
        elements,
        exportedAt: new Date().toISOString()
      };
    },
    importData: (data) => Promise.resolve({ success: true, imported: 0 })
  },

  // 購物車相關 API
  cart: {
    // 獲取購物車
    get: () => HttpAPI.cart.get(),
    // 更新整個購物車
    update: (cart) => HttpAPI.cart.update(cart),
    // 添加商品
    add: (product) => HttpAPI.cart.add(product),
    // 移除商品
    remove: (productId) => HttpAPI.cart.remove(productId),
    // 更新數量
    updateQuantity: (productId, quantity) => HttpAPI.cart.updateQuantity(productId, quantity),
    // 清空購物車
    clear: () => HttpAPI.cart.clear(),
  },

  // 訂單相關 API
  orders: {
    // 建立訂單
    create: (orderData) => HttpAPI.orders.create(orderData),
    // 獲取訂單詳情
    getById: (orderId) => HttpAPI.orders.getById(orderId),
    // 獲取用戶所有訂單
    getUserOrders: (userId) => HttpAPI.orders.getUserOrders(userId),
    // 更新訂單狀態
    updateStatus: (orderId, status) => HttpAPI.orders.updateStatus(orderId, status),
  },

  // 文件上傳相關 API
  upload: {
    // GLB 文件上傳
    glb: (file) => HttpAPI.upload.glb(file),
    // 圖片上傳
    image: (file) => HttpAPI.upload.image(file),
    // 編輯器圖片上傳
    editorImage: (file) => HttpAPI.upload.editorImage(file),
    // 3D 快照上傳
    snapshot: (base64Image, productId) => HttpAPI.upload.snapshot(base64Image, productId),
    // 列印檔案上傳
    printFile: (blob, productId) => HttpAPI.upload.printFile(blob, productId),
    // 獲取已上傳的文件列表
    getFiles: (type) => HttpAPI.upload.getFiles(type),
    // 刪除文件
    deleteFile: (type, filename) => HttpAPI.upload.deleteFile(type, filename),
    // 獲取存儲信息
    getStorageInfo: () => HttpAPI.upload.getStorageInfo(),
  }
};

// 系統工具
export const SystemAPI = {
  // 健康檢查
  checkHealth: () => HttpAPI.system.health(),

  // 獲取系統統計
  getSystemStats: async () => {
    try {
      const [productStats] = await Promise.all([
        HttpAPI.products.getStats()
      ]);

      return {
        products: productStats,
        users: { total: 0 }, // 暫時
        templates: { total: 0 }, // 暫時
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system stats:', error);
      return {
        products: { total: 0 },
        users: { total: 0 },
        templates: { total: 0 },
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // 獲取存儲資訊
  getStorageInfo: () => HttpAPI.upload.getStorageInfo(),

  // 清空所有資料（暫時簡化）
  clearAllData: async () => {
    try {
      localStorage.removeItem('monkind_current_user');
      console.log('本地用戶資料已清空');
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('清空資料失敗');
    }
  },

  // 重置所有資料為預設值（暫時簡化）
  resetAllData: async () => {
    try {
      console.log('重置功能尚未完全實作');
      return true;
    } catch (error) {
      console.error('Error resetting all data:', error);
      throw new Error('重置資料失敗');
    }
  },

  // 匯出資料（用於備份）
  exportData: async () => {
    try {
      const [products, users, templates] = await Promise.all([
        HttpAPI.products.getAll(),
        HttpAPI.users.getAll(),
        HttpAPI.templates.getAll()
      ]);

      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          products,
          users,
          templates
        }
      };

      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('匯出資料失敗');
    }
  },

  // 匯入資料（暫時簡化）
  importData: async (importData) => {
    try {
      console.log('匯入功能尚未完全實作');
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