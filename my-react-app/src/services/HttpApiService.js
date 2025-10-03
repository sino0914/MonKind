/**
 * HTTP API 服務 - 連接後端伺服器
 * 替代 localStorage 的解決方案
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class HttpApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // 通用 HTTP 請求方法
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // 如果是 FormData，移除 Content-Type (讓瀏覽器自動設置)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API 請求失敗 [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET 請求
  async get(endpoint, params = {}) {
    const queryString = Object.keys(params).length > 0
      ? '?' + new URLSearchParams(params).toString()
      : '';

    return this.request(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  // POST 請求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  // PUT 請求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE 請求
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // 文件上傳
  async uploadFile(endpoint, file, fieldName = 'file') {
    const formData = new FormData();
    formData.append(fieldName, file);

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
    });
  }

  // GLB 文件上傳
  async uploadGLB(file) {
    return this.uploadFile('/upload/glb', file, 'glb');
  }

  // 圖片文件上傳
  async uploadImage(file) {
    return this.uploadFile('/upload/image', file, 'image');
  }

  // 檢查服務器狀態
  async checkHealth() {
    try {
      return await this.get('/health');
    } catch (error) {
      throw new Error('無法連接到服務器');
    }
  }

  // 獲取存儲使用情況
  async getStorageInfo() {
    return this.get('/upload/storage');
  }

  // 獲取上傳的文件列表
  async getUploadedFiles(type = 'all') {
    return this.get('/upload/files', { type });
  }

  // 刪除文件
  async deleteFile(type, filename) {
    return this.delete(`/upload/file/${type}/${filename}`);
  }
}

// 產品服務
class HttpProductService {
  constructor(apiService) {
    this.api = apiService;
  }

  async getAll() {
    const response = await this.api.get('/products');
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/products/${id}`);
    return response.data;
  }

  async create(productData) {
    const response = await this.api.post('/products', productData);
    return response.data;
  }

  async update(id, productData) {
    const response = await this.api.put(`/products/${id}`, productData);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/products/${id}`);
    return response.data;
  }

  async getByCategory(category) {
    const response = await this.api.get('/products', { category });
    return response.data;
  }

  async getFeatured() {
    const response = await this.api.get('/products', { featured: true });
    return response.data;
  }

  async getStats() {
    const response = await this.api.get('/products/stats');
    return response.data;
  }

  // 上傳產品的 3D 模型
  async uploadProductGLB(productId, file) {
    const uploadResponse = await this.api.uploadGLB(file);

    // 更新產品的 3D 模型信息
    const product = await this.getById(productId);
    const updatedProduct = {
      ...product,
      model3D: {
        ...product.model3D,
        glbUrl: `${this.api.baseURL.replace('/api', '')}${uploadResponse.data.url}`,
        fileName: uploadResponse.data.originalName,
        fileSize: uploadResponse.data.size,
        fileSizeMB: uploadResponse.data.sizeMB,
        uploadedAt: uploadResponse.data.uploadedAt
      }
    };

    return this.update(productId, updatedProduct);
  }
}

// 用戶服務
class HttpUserService {
  constructor(apiService) {
    this.api = apiService;
  }

  async getAll() {
    const response = await this.api.get('/users');
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async register(userData) {
    const response = await this.api.post('/users/register', userData);
    return response.data;
  }

  async login(email, password) {
    const response = await this.api.post('/users/login', { email, password });

    // 將用戶信息保存到 localStorage (僅用於會話管理)
    if (response.data) {
      localStorage.setItem('monkind_current_user', JSON.stringify(response.data));
    }

    return response.data;
  }

  async logout() {
    localStorage.removeItem('monkind_current_user');
    return true;
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('monkind_current_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.isAdmin === true;
  }
}

// 模板服務
class HttpTemplateService {
  constructor(apiService) {
    this.api = apiService;
  }

  async getAll() {
    const response = await this.api.get('/templates');
    return response.data;
  }

  async getById(id) {
    const response = await this.api.get(`/templates/${id}`);
    return response.data;
  }

  async create(templateData) {
    const response = await this.api.post('/templates', templateData);
    return response.data;
  }

  async update(id, templateData) {
    const response = await this.api.put(`/templates/${id}`, templateData);
    return response.data;
  }

  async delete(id) {
    const response = await this.api.delete(`/templates/${id}`);
    return response.data;
  }

  async getByProductId(productId) {
    const response = await this.api.get('/templates', { productId });
    return response.data;
  }
}

// 創建服務實例
const httpApiService = new HttpApiService();
const httpProductService = new HttpProductService(httpApiService);
const httpUserService = new HttpUserService(httpApiService);
const httpTemplateService = new HttpTemplateService(httpApiService);

// 匯出新的 HTTP API
export const HttpAPI = {
  // 基礎 API 服務
  api: httpApiService,

  // 產品相關 API
  products: {
    getAll: () => httpProductService.getAll(),
    getById: (id) => httpProductService.getById(id),
    create: (data) => httpProductService.create(data),
    update: (id, data) => httpProductService.update(id, data),
    delete: (id) => httpProductService.delete(id),
    getByCategory: (category) => httpProductService.getByCategory(category),
    getFeatured: () => httpProductService.getFeatured(),
    getStats: () => httpProductService.getStats(),
    uploadGLB: (productId, file) => httpProductService.uploadProductGLB(productId, file),
  },

  // 用戶相關 API
  users: {
    getAll: () => httpUserService.getAll(),
    getById: (id) => httpUserService.getById(id),
    register: (userData) => httpUserService.register(userData),
    login: (email, password) => httpUserService.login(email, password),
    logout: () => httpUserService.logout(),
    getCurrentUser: () => httpUserService.getCurrentUser(),
    isLoggedIn: () => httpUserService.isLoggedIn(),
    isAdmin: () => httpUserService.isAdmin(),
  },

  // 模板相關 API
  templates: {
    getAll: () => httpTemplateService.getAll(),
    getById: (id) => httpTemplateService.getById(id),
    create: (data) => httpTemplateService.create(data),
    update: (id, data) => httpTemplateService.update(id, data),
    delete: (id) => httpTemplateService.delete(id),
    getByProductId: (productId) => httpTemplateService.getByProductId(productId),
  },

  // 文件上傳相關 API
  upload: {
    glb: (file) => httpApiService.uploadGLB(file),
    image: (file) => httpApiService.uploadImage(file),
    editorImage: async (file) => {
      const response = await httpApiService.uploadFile('/upload/editor-image', file, 'editorImage');
      return response.data; // 返回 { url: '伺服器圖片 URL', filename: '檔名' }
    },
    snapshot: async (base64Image, productId) => {
      const response = await httpApiService.post('/upload/snapshot', {
        base64Image,
        productId
      });
      return response.data; // 返回 { url: '伺服器圖片 URL', filename: '檔名', sizeKB: '檔案大小' }
    },
    getFiles: (type) => httpApiService.getUploadedFiles(type),
    deleteFile: (type, filename) => httpApiService.deleteFile(type, filename),
    getStorageInfo: () => httpApiService.getStorageInfo(),
  },

  // 元素相關 API
  elements: {
    getAll: async () => {
      const response = await httpApiService.get('/elements');
      return response.data;
    },
    getById: async (id) => {
      const response = await httpApiService.get(`/elements/${id}`);
      return response.data;
    },
    create: async (data) => {
      const response = await httpApiService.post('/elements', data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await httpApiService.put(`/elements/${id}`, data);
      return response.data;
    },
    delete: async (id) => {
      const response = await httpApiService.delete(`/elements/${id}`);
      return response.data;
    },
    getStats: async () => {
      const response = await httpApiService.get('/elements/stats');
      return response.data;
    },
    // 上傳元素圖片
    uploadImage: async (file) => {
      const response = await httpApiService.uploadFile('/upload/element', file, 'element');
      return response.data; // 返回 { url: '伺服器圖片 URL', filename: '檔名' }
    },
  },

  // 購物車相關 API
  cart: {
    // 獲取購物車
    get: async () => {
      const response = await httpApiService.get('/cart');
      return response.cart || [];
    },
    // 更新整個購物車
    update: async (cart) => {
      const response = await httpApiService.post('/cart', { cart });
      return response.cart || [];
    },
    // 添加商品
    add: async (product) => {
      const response = await httpApiService.post('/cart/add', { product });
      return response.cart || [];
    },
    // 移除商品
    remove: async (productId) => {
      const response = await httpApiService.delete(`/cart/${productId}`);
      return response.cart || [];
    },
    // 更新數量
    updateQuantity: async (productId, quantity) => {
      const response = await httpApiService.put(`/cart/${productId}`, { quantity });
      return response.cart || [];
    },
    // 清空購物車
    clear: async () => {
      const response = await httpApiService.delete('/cart');
      return response.cart || [];
    },
  },

  // 系統相關 API
  system: {
    health: () => httpApiService.checkHealth(),
  }
};

export default HttpAPI;