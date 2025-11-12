/**
 * ProductMaintenance 配置定義
 */

/**
 * Admin 模式配置（後台管理）
 */
export const adminConfig = {
  mode: 'admin',

  // 布局配置
  layout: {
    useLayout: true,           // 使用 Layout 組件包裝
    showProductList: false,    // 不顯示左側產品列表（使用下拉選單）
    showBackButton: false,     // 不顯示返回按鈕
    columns: 2,                // 兩欄布局
    backPath: null,           // 返回路徑
  },

  // 功能開關
  features: {
    bleedArea: true,          // 啟用出血區域功能
    designArea: true,         // 啟用設計區域編輯
    content3D: true,          // 啟用 3D 內容管理
    contentImages: true,      // 啟用內容圖片管理
    productSelector: 'dropdown', // 'dropdown' | 'list'
  },

  // API 配置
  api: {
    saveMethod: 'update',     // 使用通用 update API
    uploadEndpoint: 'server', // 使用伺服器上傳
  },

  // 權限控制
  permissions: {
    canEdit: true,            // 可以編輯
    canDelete: true,          // 可以刪除
    canToggleActive: true,    // 可以切換啟用狀態
    canAddProduct: true,      // 可以新增產品
    canUploadGLB: true,       // 可以上傳 GLB
    canEditUV: true,          // 可以編輯 UV 映射
  },

  // UI 配置
  ui: {
    showTitle: true,
    titleText: '商品維護',
    compactMode: false,
  },
};

/**
 * Customer 模式配置（前台管理）
 */
export const customerConfig = {
  mode: 'customer',

  // 布局配置
  layout: {
    useLayout: false,          // 不使用 Layout 包裝
    showProductList: true,     // 顯示左側產品列表
    showBackButton: true,      // 顯示返回按鈕
    columns: 3,                // 三欄布局
    backPath: '/admin',        // 返回管理頁面
  },

  // 功能開關
  features: {
    bleedArea: false,          // 不啟用出血區域功能
    designArea: true,
    content3D: true,
    contentImages: true,
    productSelector: 'list',   // 使用列表選擇器
  },

  // API 配置
  api: {
    saveMethod: 'update',      // 統一使用 update API
    uploadEndpoint: 'server',
  },

  // 權限控制
  permissions: {
    canEdit: true,
    canDelete: false,          // 前台通常不允許刪除
    canToggleActive: true,
    canAddProduct: true,
    canUploadGLB: true,
    canEditUV: true,
  },

  // UI 配置
  ui: {
    showTitle: true,
    titleText: '📦 商品維護 - 設計區管理',
    compactMode: false,
  },
};

/**
 * 深度合併配置
 */
export const mergeConfig = (baseConfig, customConfig) => {
  const result = { ...baseConfig };

  for (const key in customConfig) {
    if (customConfig[key] && typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key])) {
      result[key] = mergeConfig(baseConfig[key] || {}, customConfig[key]);
    } else {
      result[key] = customConfig[key];
    }
  }

  return result;
};

/**
 * 獲取配置
 */
export const getConfig = (mode = 'admin', customConfig = {}) => {
  const baseConfig = mode === 'admin' ? adminConfig : customerConfig;
  return mergeConfig(baseConfig, customConfig);
};
