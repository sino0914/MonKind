/**
 * 基礎資料服務類別
 * 提供 localStorage 的 CRUD 操作，之後可替換為 API 呼叫
 */
class BaseDataService {
  constructor(storageKey) {
    this.storageKey = storageKey;
    this.isInitialized = false;
  }

  /**
   * 初始化資料（如果 localStorage 中沒有資料）
   */
  initializeData(defaultData = []) {
    if (!this.isInitialized) {
      const existingData = localStorage.getItem(this.storageKey);
      if (!existingData) {
        localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
      }
      this.isInitialized = true;
    }
  }

  /**
   * 獲取所有資料
   */
  async getAll() {
    try {
      // 模擬 API 延遲
      await this._simulateDelay();

      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting all ${this.storageKey}:`, error);
      throw new Error(`無法獲取 ${this.storageKey} 資料`);
    }
  }

  /**
   * 根據 ID 獲取單筆資料
   */
  async getById(id) {
    try {
      await this._simulateDelay();

      const allData = await this.getAll();
      const item = allData.find(item => item.id === parseInt(id));

      if (!item) {
        throw new Error(`找不到 ID 為 ${id} 的資料`);
      }

      return item;
    } catch (error) {
      console.error(`Error getting ${this.storageKey} by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 新增資料
   */
  async create(newItem) {
    try {
      await this._simulateDelay();

      const allData = await this.getAll();

      // 生成新的 ID
      const newId = allData.length > 0 ? Math.max(...allData.map(item => item.id)) + 1 : 1;

      const itemWithId = {
        ...newItem,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      allData.push(itemWithId);
      localStorage.setItem(this.storageKey, JSON.stringify(allData));

      return itemWithId;
    } catch (error) {
      console.error(`Error creating ${this.storageKey}:`, error);
      throw new Error(`無法新增 ${this.storageKey} 資料`);
    }
  }

  /**
   * 更新資料
   */
  async update(id, updateData) {
    try {
      await this._simulateDelay();

      const allData = await this.getAll();
      const index = allData.findIndex(item => item.id === parseInt(id));

      if (index === -1) {
        throw new Error(`找不到 ID 為 ${id} 的資料`);
      }

      // 更新資料
      allData[index] = {
        ...allData[index],
        ...updateData,
        id: parseInt(id), // 確保 ID 不被覆蓋
        updatedAt: new Date().toISOString()
      };

      // 檢查資料大小，特別是圖片資料
      const dataString = JSON.stringify(allData);
      const dataSizeKB = (dataString.length / 1024).toFixed(2);
      console.log(`正在更新 ${this.storageKey} ID ${id}, 資料大小: ${dataSizeKB}KB`);

      // 嘗試保存到 localStorage，捕獲配額超出錯誤
      try {
        localStorage.setItem(this.storageKey, dataString);
      } catch (storageError) {
        console.error('localStorage 儲存失敗:', storageError);

        if (storageError.name === 'QuotaExceededError' ||
            storageError.message.includes('quota') ||
            storageError.message.includes('storage')) {

          // 計算當前 localStorage 使用情況
          let totalSize = 0;
          for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
              totalSize += localStorage[key].length;
            }
          }
          console.log(`localStorage 總使用量: ${(totalSize / 1024).toFixed(2)}KB`);

          // 提供更詳細的錯誤訊息，特別針對 3D 模型文件
          const isLargeFile = parseFloat(dataSizeKB) > 5000; // 超過5MB視為大文件
          const errorMessage = isLargeFile
            ? `儲存空間不足，無法保存大型 3D 模型文件。目前使用: ${(totalSize / 1024).toFixed(2)}KB，嘗試新增: ${dataSizeKB}KB。建議：1) 清理瀏覽器儲存數據 2) 使用檔案壓縮工具壓縮 GLB 文件 3) 選擇較小的 3D 模型`
            : `儲存空間不足。目前使用: ${(totalSize / 1024).toFixed(2)}KB，此次新增: ${dataSizeKB}KB。請清除瀏覽器數據或使用較小的文件。`;

          throw new Error(errorMessage);
        }

        throw storageError;
      }

      console.log(`${this.storageKey} ID ${id} 更新成功`);
      return allData[index];
    } catch (error) {
      console.error(`Error updating ${this.storageKey} ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 刪除資料
   */
  async delete(id) {
    try {
      await this._simulateDelay();

      const allData = await this.getAll();
      const index = allData.findIndex(item => item.id === parseInt(id));

      if (index === -1) {
        throw new Error(`找不到 ID 為 ${id} 的資料`);
      }

      const deletedItem = allData[index];
      allData.splice(index, 1);

      localStorage.setItem(this.storageKey, JSON.stringify(allData));

      return deletedItem;
    } catch (error) {
      console.error(`Error deleting ${this.storageKey} ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * 批量更新
   */
  async batchUpdate(updates) {
    try {
      await this._simulateDelay();

      const allData = await this.getAll();

      updates.forEach(({ id, data }) => {
        const index = allData.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
          allData[index] = {
            ...allData[index],
            ...data,
            id: parseInt(id),
            updatedAt: new Date().toISOString()
          };
        }
      });

      localStorage.setItem(this.storageKey, JSON.stringify(allData));

      return allData;
    } catch (error) {
      console.error(`Error batch updating ${this.storageKey}:`, error);
      throw new Error(`無法批量更新 ${this.storageKey} 資料`);
    }
  }

  /**
   * 搜尋資料
   */
  async search(criteria) {
    try {
      await this._simulateDelay();

      const allData = await this.getAll();

      return allData.filter(item => {
        return Object.keys(criteria).every(key => {
          const itemValue = item[key];
          const searchValue = criteria[key];

          if (typeof searchValue === 'string') {
            return itemValue?.toString().toLowerCase().includes(searchValue.toLowerCase());
          }

          return itemValue === searchValue;
        });
      });
    } catch (error) {
      console.error(`Error searching ${this.storageKey}:`, error);
      throw new Error(`無法搜尋 ${this.storageKey} 資料`);
    }
  }

  /**
   * 清空所有資料
   */
  async clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error(`Error clearing ${this.storageKey}:`, error);
      throw new Error(`無法清空 ${this.storageKey} 資料`);
    }
  }

  /**
   * 模擬 API 延遲（之後改為 API 時移除）
   */
  _simulateDelay(ms = 50) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 獲取資料統計
   */
  async getStats() {
    try {
      const allData = await this.getAll();
      return {
        total: allData.length,
        lastUpdated: allData.length > 0
          ? new Date(Math.max(...allData.map(item => new Date(item.updatedAt || item.createdAt)))).toISOString()
          : null
      };
    } catch (error) {
      console.error(`Error getting ${this.storageKey} stats:`, error);
      return { total: 0, lastUpdated: null };
    }
  }
}

export default BaseDataService;