/**
 * 商品資料管理器
 * 提供商品資料的進階處理功能，特別是與版型相關的操作
 */

import { API } from '@monkind/shared/services/api';
import { generateTemplateThumbnail } from '@monkind/shared/utils';

class ProductDataManager {
  constructor() {
    this.cache = {
      products: new Map(),
      templates: new Map(),
      thumbnails: new Map()
    };
    this.cacheTimeout = 5 * 60 * 1000; // 5分鐘快取
  }

  /**
   * 獲取商品資料（帶快取）
   * @param {number|string} productId - 商品ID
   * @returns {Promise<Object>} 商品資料
   */
  async getProduct(productId) {
    const cacheKey = `product_${productId}`;
    const cached = this.cache.products.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const product = await API.products.getById(parseInt(productId));

      // 確保商品有設計區設定
      if (product && !product.printArea) {
        console.warn(`商品 ${productId} 尚未設定設計區範圍，使用預設值`);
        product.printArea = { x: 50, y: 50, width: 200, height: 150 };
      }

      // 儲存到快取
      this.cache.products.set(cacheKey, {
        data: product,
        timestamp: Date.now()
      });

      return product;
    } catch (error) {
      console.error('獲取商品資料失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有商品列表（帶快取）
   * @returns {Promise<Array>} 商品列表
   */
  async getAllProducts() {
    const cacheKey = 'all_products';
    const cached = this.cache.products.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const products = await API.products.getAll();

      // 確保所有商品都有設計區設定
      const processedProducts = products.map(product => ({
        ...product,
        printArea: product.printArea || { x: 50, y: 50, width: 200, height: 150 }
      }));

      // 儲存到快取
      this.cache.products.set(cacheKey, {
        data: processedProducts,
        timestamp: Date.now()
      });

      return processedProducts;
    } catch (error) {
      console.error('獲取商品列表失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取版型資料（帶快取）
   * @param {number|string} templateId - 版型ID
   * @returns {Promise<Object>} 版型資料
   */
  async getTemplate(templateId) {
    const cacheKey = `template_${templateId}`;
    const cached = this.cache.templates.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const template = await API.templates.getById(parseInt(templateId));

      // 儲存到快取
      this.cache.templates.set(cacheKey, {
        data: template,
        timestamp: Date.now()
      });

      return template;
    } catch (error) {
      console.error('獲取版型資料失敗:', error);
      throw error;
    }
  }

  /**
   * 為版型生成預覽圖
   * @param {Object} template - 版型資料
   * @param {Object} product - 商品資料（可選，如果未提供會自動獲取）
   * @returns {Promise<string>} 預覽圖 base64 資料
   */
  async generateTemplatePreview(template, product = null) {
    try {
      // 如果沒有提供商品資料，嘗試獲取
      if (!product && template.productId) {
        product = await this.getProduct(template.productId);
      }

      // 檢查快取
      const cacheKey = `thumbnail_${template.id}_${product?.id || 'no_product'}`;
      const cached = this.cache.thumbnails.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // 生成預覽圖
      const thumbnailData = await generateTemplateThumbnail(template, product);

      // 儲存到快取
      if (thumbnailData) {
        this.cache.thumbnails.set(cacheKey, {
          data: thumbnailData,
          timestamp: Date.now()
        });
      }

      return thumbnailData;
    } catch (error) {
      console.error('生成版型預覽圖失敗:', error);
      return null;
    }
  }

  /**
   * 批次為版型生成預覽圖
   * @param {Array} templates - 版型列表
   * @returns {Promise<Array>} 包含預覽圖的版型列表
   */
  async batchGenerateTemplatePreviews(templates) {
    const results = [];

    // 獲取所有需要的商品資料
    const productIds = [...new Set(templates.map(t => t.productId).filter(Boolean))];
    const productMap = new Map();

    for (const productId of productIds) {
      try {
        const product = await this.getProduct(productId);
        if (product) {
          productMap.set(productId, product);
        }
      } catch (error) {
        console.warn(`無法獲取商品 ${productId}:`, error);
      }
    }

    // 為每個版型生成預覽圖
    for (const template of templates) {
      const product = productMap.get(template.productId);
      const thumbnail = await this.generateTemplatePreview(template, product);

      results.push({
        ...template,
        thumbnail: thumbnail,
        product: product // 附加商品資料供後續使用
      });
    }

    return results;
  }

  /**
   * 獲取商品的所有版型（含預覽圖）
   * @param {number|string} productId - 商品ID
   * @returns {Promise<Array>} 版型列表（含預覽圖）
   */
  async getProductTemplatesWithPreviews(productId) {
    try {
      const [product, templates] = await Promise.all([
        this.getProduct(productId),
        API.templates.getByProductId(productId)
      ]);

      if (!product) {
        throw new Error(`找不到商品 ${productId}`);
      }

      const templatesWithPreviews = [];

      for (const template of templates) {
        const thumbnail = await this.generateTemplatePreview(template, product);
        templatesWithPreviews.push({
          ...template,
          thumbnail: thumbnail,
          product: product
        });
      }

      return templatesWithPreviews;
    } catch (error) {
      console.error('獲取商品版型失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有版型（含預覽圖）
   * @returns {Promise<Array>} 版型列表（含預覽圖）
   */
  async getAllTemplatesWithPreviews() {
    try {
      const templates = await API.templates.getAll();
      return await this.batchGenerateTemplatePreviews(templates);
    } catch (error) {
      console.error('獲取所有版型失敗:', error);
      throw error;
    }
  }

  /**
   * 更新版型的預覽圖
   * @param {number|string} templateId - 版型ID
   * @returns {Promise<string>} 新的預覽圖 base64 資料
   */
  async updateTemplatePreview(templateId) {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`找不到版型 ${templateId}`);
      }

      const product = await this.getProduct(template.productId);

      // 清除快取
      const cacheKey = `thumbnail_${template.id}_${product?.id || 'no_product'}`;
      this.cache.thumbnails.delete(cacheKey);

      // 重新生成預覽圖
      return await this.generateTemplatePreview(template, product);
    } catch (error) {
      console.error('更新版型預覽圖失敗:', error);
      throw error;
    }
  }

  /**
   * 清除快取
   * @param {string} type - 快取類型 ('products', 'templates', 'thumbnails', 'all')
   */
  clearCache(type = 'all') {
    if (type === 'all') {
      this.cache.products.clear();
      this.cache.templates.clear();
      this.cache.thumbnails.clear();
    } else if (this.cache[type]) {
      this.cache[type].clear();
    }
  }

  /**
   * 獲取快取統計
   * @returns {Object} 快取統計資訊
   */
  getCacheStats() {
    return {
      products: this.cache.products.size,
      templates: this.cache.templates.size,
      thumbnails: this.cache.thumbnails.size,
      totalMemoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * 估算快取記憶體使用量（粗略估算）
   * @returns {string} 記憶體使用量描述
   */
  estimateMemoryUsage() {
    const thumbnailCount = this.cache.thumbnails.size;
    const avgThumbnailSize = 20; // KB (估算)
    const estimatedMB = (thumbnailCount * avgThumbnailSize) / 1024;
    return `約 ${estimatedMB.toFixed(1)} MB`;
  }
}

// 創建單例實例
const productDataManager = new ProductDataManager();

export default productDataManager;

// 便捷方法導出
export const getProductWithCache = (productId) => {
  return productDataManager.getProduct(productId);
};

export const getTemplatesWithPreviews = (productId = null) => {
  return productId
    ? productDataManager.getProductTemplatesWithPreviews(productId)
    : productDataManager.getAllTemplatesWithPreviews();
};

export const updateTemplatePreview = (templateId) => {
  return productDataManager.updateTemplatePreview(templateId);
};