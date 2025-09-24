/**
 * 元素管理服務
 * 處理設計元素的CRUD操作，包含圖片上傳與管理
 */

class ElementService {
  constructor() {
    this.storageKey = 'design_elements';
    this.elements = this.loadFromStorage();
    this.nextId = Math.max(...this.elements.map(e => e.id || 0), 0) + 1;
  }

  // 從本地儲存載入元素
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('載入元素資料失敗:', error);
      return [];
    }
  }

  // 儲存到本地儲存
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.elements));
    } catch (error) {
      console.error('儲存元素資料失敗:', error);
      throw error;
    }
  }

  // 將檔案轉換為 Data URL
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 獲取所有元素
  async getAll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.elements]);
      }, 100);
    });
  }

  // 根據ID獲取元素
  async getById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const element = this.elements.find(e => e.id === parseInt(id));
        if (element) {
          resolve({ ...element });
        } else {
          reject(new Error('元素不存在'));
        }
      }, 50);
    });
  }

  // 創建新元素
  async create(elementData) {
    return new Promise(async (resolve, reject) => {
      try {
        const newElement = {
          id: this.nextId++,
          name: elementData.name || '未命名元素',
          type: elementData.type || 'image',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // 處理檔案上傳
        if (elementData.file && elementData.file instanceof File) {
          // 驗證檔案類型
          if (!elementData.file.type.startsWith('image/')) {
            reject(new Error('檔案必須是圖片格式'));
            return;
          }

          // 檔案大小限制 (5MB)
          if (elementData.file.size > 5 * 1024 * 1024) {
            reject(new Error('檔案大小不能超過 5MB'));
            return;
          }

          // 轉換為 Data URL
          try {
            newElement.url = await this.fileToDataUrl(elementData.file);
            newElement.fileName = elementData.file.name;
            newElement.fileSize = elementData.file.size;
            newElement.mimeType = elementData.file.type;
          } catch (error) {
            reject(new Error('檔案處理失敗'));
            return;
          }
        } else if (elementData.url) {
          newElement.url = elementData.url;
        } else {
          reject(new Error('必須提供檔案或URL'));
          return;
        }

        // 添加到列表並儲存
        this.elements.push(newElement);
        this.saveToStorage();

        setTimeout(() => {
          resolve({ ...newElement });
        }, 200);

      } catch (error) {
        reject(error);
      }
    });
  }

  // 更新元素
  async update(id, updateData) {
    return new Promise(async (resolve, reject) => {
      try {
        const index = this.elements.findIndex(e => e.id === parseInt(id));
        if (index === -1) {
          reject(new Error('元素不存在'));
          return;
        }

        const element = this.elements[index];
        const updatedElement = {
          ...element,
          ...updateData,
          id: element.id, // 保持ID不變
          updatedAt: new Date().toISOString()
        };

        // 如果有新檔案，處理檔案上傳
        if (updateData.file && updateData.file instanceof File) {
          if (!updateData.file.type.startsWith('image/')) {
            reject(new Error('檔案必須是圖片格式'));
            return;
          }

          if (updateData.file.size > 5 * 1024 * 1024) {
            reject(new Error('檔案大小不能超過 5MB'));
            return;
          }

          try {
            updatedElement.url = await this.fileToDataUrl(updateData.file);
            updatedElement.fileName = updateData.file.name;
            updatedElement.fileSize = updateData.file.size;
            updatedElement.mimeType = updateData.file.type;
          } catch (error) {
            reject(new Error('檔案處理失敗'));
            return;
          }
        }

        this.elements[index] = updatedElement;
        this.saveToStorage();

        setTimeout(() => {
          resolve({ ...updatedElement });
        }, 100);

      } catch (error) {
        reject(error);
      }
    });
  }

  // 刪除元素
  async delete(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = this.elements.findIndex(e => e.id === parseInt(id));
        if (index === -1) {
          reject(new Error('元素不存在'));
          return;
        }

        const deletedElement = this.elements.splice(index, 1)[0];
        this.saveToStorage();
        resolve(deletedElement);
      }, 100);
    });
  }

  // 批量刪除
  async batchDelete(ids) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const deletedElements = [];
          const numericIds = ids.map(id => parseInt(id));

          this.elements = this.elements.filter(element => {
            if (numericIds.includes(element.id)) {
              deletedElements.push(element);
              return false;
            }
            return true;
          });

          this.saveToStorage();
          resolve(deletedElements);
        } catch (error) {
          reject(error);
        }
      }, 150);
    });
  }

  // 搜尋元素
  async search(criteria) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = [...this.elements];

        if (criteria.name) {
          filtered = filtered.filter(element =>
            element.name.toLowerCase().includes(criteria.name.toLowerCase())
          );
        }

        if (criteria.type) {
          filtered = filtered.filter(element => element.type === criteria.type);
        }

        resolve(filtered);
      }, 100);
    });
  }

  // 獲取元素統計
  async getStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stats = {
          total: this.elements.length,
          byType: {},
          totalSize: 0
        };

        this.elements.forEach(element => {
          // 按類型統計
          stats.byType[element.type] = (stats.byType[element.type] || 0) + 1;

          // 計算總大小
          if (element.fileSize) {
            stats.totalSize += element.fileSize;
          }
        });

        resolve(stats);
      }, 50);
    });
  }

  // 重置到預設狀態
  async resetToDefault() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.elements = [];
        this.nextId = 1;
        this.saveToStorage();
        resolve({ success: true });
      }, 100);
    });
  }

  // 匯出所有元素數據
  exportData() {
    return {
      elements: this.elements,
      exportedAt: new Date().toISOString()
    };
  }

  // 匯入元素數據
  async importData(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!data.elements || !Array.isArray(data.elements)) {
            reject(new Error('無效的匯入數據格式'));
            return;
          }

          this.elements = data.elements;
          this.nextId = Math.max(...this.elements.map(e => e.id || 0), 0) + 1;
          this.saveToStorage();

          resolve({
            success: true,
            imported: this.elements.length
          });
        } catch (error) {
          reject(error);
        }
      }, 200);
    });
  }
}

// 建立單一實例
const elementService = new ElementService();

export default elementService;