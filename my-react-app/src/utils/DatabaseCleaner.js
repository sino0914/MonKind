/**
 * 資料庫清理工具
 * 用於清理和重置 localStorage 中的資料
 */

class DatabaseCleaner {
  // 清理所有 MonKind 相關的 localStorage 資料
  static clearAll() {
    const keys = Object.keys(localStorage);
    const monkindKeys = keys.filter(key =>
      key.startsWith('monkind_') ||
      key.startsWith('shopping-cart') ||
      key.startsWith('draft_') ||
      key.startsWith('editingDesignData') ||
      key.startsWith('editor_uploaded_images')
    );

    console.log('🗑️ 清理以下 localStorage 資料:', monkindKeys);

    monkindKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('✅ 資料庫清理完成');
    return monkindKeys.length;
  }

  // 重置為預設資料
  static async resetToDefault() {
    console.log('🔄 開始重置資料庫...');

    // 1. 清理舊資料
    this.clearAll();

    // 2. 設定正確的預設資料結構
    const defaultProducts = [
      {
        id: 1,
        title: "經典白色馬克杯",
        category: "mug",
        price: 299,
        imageUrl: "/images/mug-white.jpg",
        description: "經典白色陶瓷馬克杯，適合各種設計",
        isActive: true,
        printArea: {
          width: 200,
          height: 150,
          offsetX: 100,
          offsetY: 75
        }
      },
      {
        id: 2,
        title: "黑色經典馬克杯",
        category: "mug",
        price: 329,
        imageUrl: "/images/mug-black.jpg",
        description: "黑色陶瓷馬克杯，打造個性風格",
        isActive: true,
        printArea: {
          width: 200,
          height: 150,
          offsetX: 100,
          offsetY: 75
        }
      },
      {
        id: 3,
        title: "經典白色T恤",
        category: "tshirt",
        price: 399,
        imageUrl: "/images/tshirt-white.jpg",
        description: "100%純棉白色T恤，舒適透氣",
        isActive: true,
        printArea: {
          width: 250,
          height: 300,
          offsetX: 125,
          offsetY: 100
        }
      }
    ];

    const defaultTemplates = [
      {
        id: 1,
        name: "簡約文字範本",
        description: "基本文字設計範本",
        productId: 1,
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
        thumbnail: null,
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

    const defaultUsers = [
      {
        id: 1,
        email: "admin@monkind.com",
        password: "admin123",
        name: "系統管理員",
        role: "admin",
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    // 3. 直接設定正確的localStorage資料
    localStorage.setItem('monkind_products', JSON.stringify(defaultProducts));
    localStorage.setItem('monkind_templates', JSON.stringify(defaultTemplates));
    localStorage.setItem('monkind_users', JSON.stringify(defaultUsers));
    localStorage.setItem('shopping-cart', JSON.stringify([]));

    console.log('✅ 資料庫重置完成');
    console.log(`📊 已重置: ${defaultProducts.length}個產品, ${defaultTemplates.length}個版型, ${defaultUsers.length}個用戶`);

    // 4. 重新載入頁面
    window.location.reload();
  }

  // 檢查資料完整性
  static checkDataIntegrity() {
    const issues = [];

    try {
      // 檢查商品資料
      const products = JSON.parse(localStorage.getItem('monkind_products') || '[]');
      if (!Array.isArray(products)) {
        issues.push('商品資料格式錯誤');
      }

      // 檢查版型資料
      const templates = JSON.parse(localStorage.getItem('monkind_templates') || '[]');
      if (!Array.isArray(templates)) {
        issues.push('版型資料格式錯誤');
      }

      // 檢查購物車資料
      const cart = JSON.parse(localStorage.getItem('shopping-cart') || '[]');
      if (!Array.isArray(cart)) {
        issues.push('購物車資料格式錯誤');
      }

      console.log('🔍 資料完整性檢查結果:', issues.length === 0 ? '正常' : issues);
      return issues;
    } catch (error) {
      console.error('❌ 資料完整性檢查失敗:', error);
      return ['資料解析錯誤'];
    }
  }

  // 匯出資料備份
  static exportBackup() {
    const keys = Object.keys(localStorage);
    const monkindKeys = keys.filter(key =>
      key.startsWith('monkind_') ||
      key.startsWith('shopping-cart') ||
      key.startsWith('draft_')
    );

    const backup = {};
    monkindKeys.forEach(key => {
      backup[key] = localStorage.getItem(key);
    });

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monkind_backup_${new Date().getTime()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    console.log('💾 資料備份完成');
  }

  // 匯入資料備份
  static importBackup(fileContent) {
    try {
      const backup = JSON.parse(fileContent);

      Object.entries(backup).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      console.log('📥 資料匯入完成');
      window.location.reload();
    } catch (error) {
      console.error('❌ 資料匯入失敗:', error);
      throw new Error('備份檔案格式錯誤');
    }
  }
}

// 開發模式下全域暴露
if (process.env.NODE_ENV === 'development') {
  window.DatabaseCleaner = DatabaseCleaner;
}

export default DatabaseCleaner;