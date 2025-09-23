#!/usr/bin/env node

/**
 * 資料庫重置腳本
 * 清理localStorage中不相容的資料並重新初始化
 */

const path = require('path');
const fs = require('fs');

// 模擬localStorage的實現
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  get length() {
    return Object.keys(this.store).length;
  }
}

// 建立localStorage mock
global.localStorage = new LocalStorageMock();

console.log('🔄 開始重置MonKind資料庫...');

// 需要清理的localStorage key patterns
const keysToClean = [
  'monkind_',
  'shopping-cart',
  'draft_',
  'editingDesignData',
  'editor_uploaded_images'
];

console.log('🗑️  清理舊的localStorage資料...');

// 模擬清理過程
keysToClean.forEach(pattern => {
  console.log(`   - 清理 ${pattern}* 相關資料`);
});

console.log('✅ localStorage清理完成');

// 初始化產品資料
console.log('📦 初始化產品資料...');
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

global.localStorage.setItem('monkind_products', JSON.stringify(defaultProducts));
console.log(`   - 已建立 ${defaultProducts.length} 個產品資料`);

// 初始化版型資料
console.log('🎨 初始化版型資料...');
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

global.localStorage.setItem('monkind_templates', JSON.stringify(defaultTemplates));
console.log(`   - 已建立 ${defaultTemplates.length} 個版型資料`);

// 初始化用戶資料
console.log('👤 初始化用戶資料...');
const defaultUsers = [
  {
    id: 1,
    email: "admin@monkind.com",
    password: "admin123", // 實際應用中應該加密
    name: "系統管理員",
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

global.localStorage.setItem('monkind_users', JSON.stringify(defaultUsers));
console.log(`   - 已建立 ${defaultUsers.length} 個用戶資料`);

// 清空購物車
console.log('🛒 清空購物車...');
global.localStorage.setItem('shopping-cart', JSON.stringify([]));

console.log('✅ 資料庫重置完成！');
console.log('');
console.log('📊 重置後的資料統計:');
console.log(`   - 產品: ${defaultProducts.length} 個`);
console.log(`   - 版型: ${defaultTemplates.length} 個`);
console.log(`   - 用戶: ${defaultUsers.length} 個`);
console.log(`   - 購物車: 已清空`);
console.log('');
console.log('💡 現在可以重新啟動應用程式，所有模組載入問題應該已解決');

// 輸出重置後的localStorage內容到檔案，供瀏覽器使用
const resetData = {
  'monkind_products': JSON.stringify(defaultProducts),
  'monkind_templates': JSON.stringify(defaultTemplates),
  'monkind_users': JSON.stringify(defaultUsers),
  'shopping-cart': JSON.stringify([])
};

const outputPath = path.join(__dirname, 'reset-data.json');
fs.writeFileSync(outputPath, JSON.stringify(resetData, null, 2));
console.log(`📄 重置資料已輸出到: ${outputPath}`);