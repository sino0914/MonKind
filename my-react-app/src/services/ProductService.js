import BaseDataService from './BaseDataService';
import productsData from '../data/products.json';

/**
 * 商品資料服務
 * 專門處理商品相關的 CRUD 操作
 */
class ProductService extends BaseDataService {
  constructor() {
    super('monkind_products'); // localStorage key
    this.initializeData(productsData);
  }

  /**
   * 根據類別獲取商品
   */
  async getByCategory(category) {
    try {
      const allProducts = await this.getAll();
      return allProducts.filter(product => product.category === category);
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw new Error(`無法獲取類別 ${category} 的商品`);
    }
  }

  /**
   * 獲取精選商品
   */
  async getFeatured() {
    try {
      const allProducts = await this.getAll();
      return allProducts.filter(product => product.featured === true);
    } catch (error) {
      console.error('Error getting featured products:', error);
      throw new Error('無法獲取精選商品');
    }
  }

  /**
   * 更新商品的設計區範圍
   */
  async updatePrintArea(productId, printArea) {
    try {
      // 驗證設計區資料
      this._validatePrintArea(printArea);

      const updatedProduct = await this.update(productId, { printArea });

      console.log(`商品 ${productId} 設計區已更新:`, printArea);
      return updatedProduct;
    } catch (error) {
      console.error('Error updating print area:', error);
      throw error;
    }
  }

  /**
   * 批量更新商品設計區
   */
  async batchUpdatePrintAreas(updates) {
    try {
      const validatedUpdates = updates.map(({ id, printArea }) => {
        this._validatePrintArea(printArea);
        return { id, data: { printArea } };
      });

      const result = await this.batchUpdate(validatedUpdates);
      console.log('批量更新設計區完成');
      return result;
    } catch (error) {
      console.error('Error batch updating print areas:', error);
      throw new Error('批量更新設計區失敗');
    }
  }

  /**
   * 搜尋商品（支援多條件）
   */
  async searchProducts({ title, category, priceMin, priceMax, featured }) {
    try {
      const allProducts = await this.getAll();

      return allProducts.filter(product => {
        // 標題搜尋
        if (title && !product.title.toLowerCase().includes(title.toLowerCase())) {
          return false;
        }

        // 類別篩選
        if (category && product.category !== category) {
          return false;
        }

        // 價格範圍
        if (priceMin !== undefined && product.price < priceMin) {
          return false;
        }
        if (priceMax !== undefined && product.price > priceMax) {
          return false;
        }

        // 精選篩選
        if (featured !== undefined && product.featured !== featured) {
          return false;
        }

        return true;
      });
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('商品搜尋失敗');
    }
  }

  /**
   * 獲取商品類別列表
   */
  async getCategories() {
    try {
      const allProducts = await this.getAll();
      const categories = [...new Set(allProducts.map(product => product.category))];

      return categories.map(category => ({
        id: category,
        name: this._getCategoryDisplayName(category),
        count: allProducts.filter(p => p.category === category).length
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('無法獲取商品類別');
    }
  }

  /**
   * 獲取價格範圍
   */
  async getPriceRange() {
    try {
      const allProducts = await this.getAll();
      if (allProducts.length === 0) {
        return { min: 0, max: 0 };
      }

      const prices = allProducts.map(product => product.price);
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    } catch (error) {
      console.error('Error getting price range:', error);
      throw new Error('無法獲取價格範圍');
    }
  }

  /**
   * 獲取商品統計資訊
   */
  async getProductStats() {
    try {
      const allProducts = await this.getAll();
      const categories = await this.getCategories();

      return {
        total: allProducts.length,
        featured: allProducts.filter(p => p.featured).length,
        categories: categories.length,
        withPrintArea: allProducts.filter(p => p.printArea).length,
        averagePrice: allProducts.length > 0
          ? Math.round(allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length)
          : 0,
        categoryBreakdown: categories
      };
    } catch (error) {
      console.error('Error getting product stats:', error);
      return {
        total: 0,
        featured: 0,
        categories: 0,
        withPrintArea: 0,
        averagePrice: 0,
        categoryBreakdown: []
      };
    }
  }

  /**
   * 驗證商品資料
   */
  async validateProduct(productData) {
    const errors = [];

    if (!productData.title || productData.title.trim() === '') {
      errors.push('商品名稱不能為空');
    }

    if (!productData.price || productData.price <= 0) {
      errors.push('商品價格必須大於 0');
    }

    if (!productData.category || productData.category.trim() === '') {
      errors.push('商品類別不能為空');
    }

    if (productData.printArea) {
      try {
        this._validatePrintArea(productData.printArea);
      } catch (error) {
        errors.push(error.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 重置為預設商品資料
   */
  async resetToDefault() {
    try {
      localStorage.removeItem(this.storageKey);
      this.isInitialized = false;
      this.initializeData(productsData);

      console.log('商品資料已重置為預設值');
      return await this.getAll();
    } catch (error) {
      console.error('Error resetting products to default:', error);
      throw new Error('重置商品資料失敗');
    }
  }

  /**
   * 驗證設計區資料
   */
  _validatePrintArea(printArea) {
    if (!printArea) {
      throw new Error('設計區資料不能為空');
    }

    const { x, y, width, height } = printArea;

    if (typeof x !== 'number' || x < 0) {
      throw new Error('設計區 X 座標必須為非負數');
    }

    if (typeof y !== 'number' || y < 0) {
      throw new Error('設計區 Y 座標必須為非負數');
    }

    if (typeof width !== 'number' || width <= 0) {
      throw new Error('設計區寬度必須大於 0');
    }

    if (typeof height !== 'number' || height <= 0) {
      throw new Error('設計區高度必須大於 0');
    }

    // 檢查是否超出 400x400 畫布範圍
    if (x + width > 400) {
      throw new Error('設計區超出畫布右邊界');
    }

    if (y + height > 400) {
      throw new Error('設計區超出畫布下邊界');
    }

    // 最小尺寸限制
    if (width < 50 || height < 50) {
      throw new Error('設計區最小尺寸為 50x50 像素');
    }
  }

  /**
   * 獲取類別顯示名稱
   */
  _getCategoryDisplayName(category) {
    const categoryNames = {
      'mug': '馬克杯',
      'tshirt': 'T恤',
      'bag': '袋子',
      'bottle': '水瓶',
      'pillow': '抱枕',
      'notebook': '筆記本'
    };

    return categoryNames[category] || category;
  }
}

// 建立單例實例
const productService = new ProductService();

export default productService;