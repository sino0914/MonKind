/**
 * 版型服務
 * 處理版型的 CRUD 操作和相關業務邏輯
 */

class TemplateService {
  constructor() {
    this.storageKey = 'monkind_templates';
    this.initializeData();
  }

  // 初始化資料
  initializeData() {
    if (!localStorage.getItem(this.storageKey)) {
      const defaultTemplates = [
        {
          id: 1,
          name: "簡約文字範本",
          description: "基本文字設計範本",
          productId: 1, // 對應的商品ID
          productCategory: "mug",
          elements: [
            {
              id: "text-1",
              type: "text",
              content: "MonKind",
              x: 200,
              y: 150,
              fontSize: 32,
              color: "#000000",
              fontFamily: "Arial",
              fontWeight: "bold",
              fontStyle: "normal"
            }
          ],
          backgroundColor: "#ffffff",
          thumbnail: null, // 縮圖URL
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "可愛圖案範本",
          description: "適合個人使用的可愛設計",
          productId: 1,
          productCategory: "mug",
          elements: [
            {
              id: "text-1",
              type: "text",
              content: "Hello ☕",
              x: 200,
              y: 180,
              fontSize: 24,
              color: "#8B4513",
              fontFamily: "Arial",
              fontWeight: "normal",
              fontStyle: "normal"
            }
          ],
          backgroundColor: "#FFF8DC",
          thumbnail: null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      localStorage.setItem(this.storageKey, JSON.stringify(defaultTemplates));
    }
  }

  // 獲取所有版型
  async getAll() {
    try {
      const templates = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      return templates.filter(template => !template.isDeleted);
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  // 根據ID獲取版型
  async getById(id) {
    try {
      const templates = await this.getAll();
      const template = templates.find(t => t.id === parseInt(id));

      if (!template) {
        throw new Error(`找不到ID為 ${id} 的版型`);
      }

      return template;
    } catch (error) {
      console.error('Error getting template by ID:', error);
      throw error;
    }
  }

  // 根據商品ID獲取版型
  async getByProductId(productId) {
    try {
      const templates = await this.getAll();
      return templates.filter(t => t.productId === parseInt(productId));
    } catch (error) {
      console.error('Error getting templates by product ID:', error);
      return [];
    }
  }

  // 根據商品類別獲取版型
  async getByCategory(category) {
    try {
      const templates = await this.getAll();
      return templates.filter(t => t.productCategory === category);
    } catch (error) {
      console.error('Error getting templates by category:', error);
      return [];
    }
  }

  // 創建新版型
  async create(templateData) {
    try {
      const templates = JSON.parse(localStorage.getItem(this.storageKey) || '[]');

      // 生成新ID
      const newId = templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1;

      const newTemplate = {
        id: newId,
        name: templateData.name || '新版型',
        description: templateData.description || '',
        productId: templateData.productId,
        productCategory: templateData.productCategory,
        elements: templateData.elements || [],
        backgroundColor: templateData.backgroundColor || '#ffffff',
        thumbnail: templateData.thumbnail || null,
        isActive: templateData.isActive !== false, // 預設為true
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDeleted: false
      };

      templates.push(newTemplate);
      localStorage.setItem(this.storageKey, JSON.stringify(templates));

      console.log('版型創建成功:', newTemplate);
      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error('創建版型失敗');
    }
  }

  // 更新版型
  async update(id, updateData) {
    try {
      const templates = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      const index = templates.findIndex(t => t.id === parseInt(id));

      if (index === -1) {
        throw new Error(`找不到ID為 ${id} 的版型`);
      }

      // 更新版型資料
      templates[index] = {
        ...templates[index],
        ...updateData,
        id: parseInt(id), // 確保ID不會被更改
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(templates));

      console.log('版型更新成功:', templates[index]);
      return templates[index];
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  // 刪除版型（軟刪除）
  async delete(id) {
    try {
      const templates = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      const index = templates.findIndex(t => t.id === parseInt(id));

      if (index === -1) {
        throw new Error(`找不到ID為 ${id} 的版型`);
      }

      // 軟刪除
      templates[index].isDeleted = true;
      templates[index].deletedAt = new Date().toISOString();

      localStorage.setItem(this.storageKey, JSON.stringify(templates));

      console.log('版型刪除成功');
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  // 複製版型
  async duplicate(id, newName = null) {
    try {
      const originalTemplate = await this.getById(id);

      const duplicatedTemplate = {
        ...originalTemplate,
        name: newName || `${originalTemplate.name} (副本)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 移除原始ID讓create方法生成新ID
      delete duplicatedTemplate.id;

      return await this.create(duplicatedTemplate);
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw new Error('複製版型失敗');
    }
  }

  // 啟用/停用版型
  async toggleActive(id) {
    try {
      const template = await this.getById(id);
      return await this.update(id, { isActive: !template.isActive });
    } catch (error) {
      console.error('Error toggling template active state:', error);
      throw error;
    }
  }

  // 生成版型縮圖
  async generateThumbnail(templateId, canvasElement) {
    try {
      if (!canvasElement) {
        throw new Error('Canvas element is required for thumbnail generation');
      }

      // 創建縮圖canvas
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailCtx = thumbnailCanvas.getContext('2d');

      // 設定縮圖尺寸
      const thumbnailSize = 200;
      thumbnailCanvas.width = thumbnailSize;
      thumbnailCanvas.height = thumbnailSize;

      // 縮放繪製原始canvas
      thumbnailCtx.drawImage(canvasElement, 0, 0, thumbnailSize, thumbnailSize);

      // 轉換為DataURL
      const thumbnailDataUrl = thumbnailCanvas.toDataURL('image/jpeg', 0.8);

      // 更新版型縮圖
      await this.update(templateId, { thumbnail: thumbnailDataUrl });

      return thumbnailDataUrl;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error('生成縮圖失敗');
    }
  }

  // 搜尋版型
  async search(criteria) {
    try {
      const templates = await this.getAll();

      return templates.filter(template => {
        const matchesName = !criteria.name ||
          template.name.toLowerCase().includes(criteria.name.toLowerCase());

        const matchesCategory = !criteria.category ||
          template.productCategory === criteria.category;

        const matchesProductId = !criteria.productId ||
          template.productId === parseInt(criteria.productId);

        const matchesActive = criteria.isActive === undefined ||
          template.isActive === criteria.isActive;

        return matchesName && matchesCategory && matchesProductId && matchesActive;
      });
    } catch (error) {
      console.error('Error searching templates:', error);
      return [];
    }
  }

  // 獲取版型統計
  async getStats() {
    try {
      const templates = await this.getAll();
      const allTemplates = JSON.parse(localStorage.getItem(this.storageKey) || '[]');

      return {
        total: templates.length,
        active: templates.filter(t => t.isActive).length,
        inactive: templates.filter(t => !t.isActive).length,
        deleted: allTemplates.filter(t => t.isDeleted).length,
        byCategory: templates.reduce((acc, template) => {
          acc[template.productCategory] = (acc[template.productCategory] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting template stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        deleted: 0,
        byCategory: {}
      };
    }
  }

  // 驗證版型資料
  validateTemplate(templateData) {
    const errors = [];

    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('版型名稱不能為空');
    }

    if (!templateData.productId) {
      errors.push('必須指定關聯的商品');
    }

    if (!templateData.productCategory) {
      errors.push('必須指定商品類別');
    }

    if (!Array.isArray(templateData.elements)) {
      errors.push('設計元素必須是陣列格式');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 清空所有版型
  async clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('所有版型已清空');
      return true;
    } catch (error) {
      console.error('Error clearing all templates:', error);
      throw new Error('清空版型失敗');
    }
  }

  // 重置為預設版型
  async resetToDefault() {
    try {
      await this.clearAll();
      this.initializeData();
      console.log('版型已重置為預設值');
      return true;
    } catch (error) {
      console.error('Error resetting templates:', error);
      throw new Error('重置版型失敗');
    }
  }
}

// 創建單例實例
const templateService = new TemplateService();

export default templateService;