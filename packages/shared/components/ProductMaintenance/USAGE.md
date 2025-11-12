# ProductMaintenance 使用指南

## 概述

ProductMaintenance 是一個共享組件庫，提供了完整的商品維護功能，包括：
- 設計區域編輯
- 出血區域設定（可選）
- 3D 模型管理
- 內容圖片管理
- 商品基本資訊編輯

## 快速開始

### 1. Admin 模式（後台管理）

```jsx
import React from 'react';
import Layout from '../../components/Layout';
import {
  useProductMaintenance,
  adminConfig,
  NotificationMessage,
  DesignAreaPreview,
  BleedAreaSettings,
} from '@monkind/shared/components/ProductMaintenance';

const AdminProductMaintenance = () => {
  const pm = useProductMaintenance(adminConfig);

  if (pm.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">商品維護</h1>

        {/* 產品選擇下拉選單 */}
        <select
          value={pm.selectedProduct?.id || ''}
          onChange={(e) => {
            const product = pm.products.find(p => p.id === parseInt(e.target.value));
            if (product) pm.handleProductSelect(product);
          }}
          className="w-full px-4 py-2 border rounded mb-6"
        >
          {pm.products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.title} - NT$ {product.price}
            </option>
          ))}
        </select>

        {/* 設計區域編輯 */}
        {pm.selectedProduct && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <DesignAreaPreview
                mockupImage={pm.selectedProduct.mockupImage}
                printArea={pm.tempPrintArea}
                bleedArea={pm.tempBleedArea}
                onPrintAreaChange={pm.updatePrintArea}
                showBleedArea={adminConfig.features.bleedArea}
              />
            </div>

            <div>
              {/* 出血區域設定（Admin 專屬） */}
              <BleedAreaSettings
                bleedArea={pm.tempBleedArea}
                bleedMode={pm.bleedMode}
                onEnableBleed={pm.enableBleedArea}
                onDisableBleed={pm.disableBleedArea}
                onModeChange={pm.toggleBleedMode}
                onValueChange={pm.updateBleedArea}
              />

              <button
                onClick={pm.handleSavePrintArea}
                disabled={pm.saving}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
              >
                {pm.saving ? '儲存中...' : '儲存設計區域'}
              </button>
            </div>
          </div>
        )}

        {/* 通知訊息 */}
        <NotificationMessage notification={pm.notification} />
      </div>
    </Layout>
  );
};

export default AdminProductMaintenance;
```

### 2. Customer 模式（前台管理）

```jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useProductMaintenance,
  customerConfig,
  NotificationMessage,
  DesignAreaPreview,
} from '@monkind/shared/components/ProductMaintenance';

const CustomerProductMaintenance = () => {
  const navigate = useNavigate();
  const pm = useProductMaintenance(customerConfig);

  if (pm.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with back button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/admin')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
          <h1 className="text-xl font-bold mt-2">商品維護 - 設計區管理</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* 左側產品列表 */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-4">商品列表</h3>
              {pm.products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => pm.handleProductSelect(product)}
                  className={`p-3 mb-2 rounded cursor-pointer ${
                    pm.selectedProduct?.id === product.id
                      ? 'bg-blue-50 border-blue-200 border-2'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-gray-600">NT$ {product.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 右側編輯區域（3欄） */}
          <div className="col-span-3">
            {pm.selectedProduct && (
              <div className="bg-white rounded-lg shadow p-6">
                <DesignAreaPreview
                  mockupImage={pm.selectedProduct.mockupImage}
                  printArea={pm.tempPrintArea}
                  bleedArea={null} // Customer 模式不顯示出血區域
                  onPrintAreaChange={pm.updatePrintArea}
                  showBleedArea={false}
                />

                <button
                  onClick={pm.handleSavePrintArea}
                  disabled={pm.saving}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {pm.saving ? '儲存中...' : '儲存設計區域'}
                </button>
              </div>
            )}
          </div>
        </div>

        <NotificationMessage notification={pm.notification} />
      </div>
    </div>
  );
};

export default CustomerProductMaintenance;
```

## 配置說明

### Admin 配置

```javascript
{
  mode: 'admin',
  layout: {
    useLayout: true,           // 使用 Layout 組件
    showProductList: false,    // 不顯示左側列表（使用下拉選單）
    showBackButton: false,     // 不顯示返回按鈕
    columns: 2,                // 兩欄布局
  },
  features: {
    bleedArea: true,           // 啟用出血區域功能
    designArea: true,
    content3D: true,
    contentImages: true,
    productSelector: 'dropdown', // 使用下拉選單
  },
  permissions: {
    canEdit: true,
    canDelete: true,
    canToggleActive: true,
    canAddProduct: true,
    canUploadGLB: true,
    canEditUV: true,
  }
}
```

### Customer 配置

```javascript
{
  mode: 'customer',
  layout: {
    useLayout: false,          // 不使用 Layout
    showProductList: true,     // 顯示左側產品列表
    showBackButton: true,      // 顯示返回按鈕
    columns: 3,                // 三欄布局（1欄列表 + 3欄內容 = 4欄總計）
    backPath: '/admin',
  },
  features: {
    bleedArea: false,          // 不啟用出血區域
    designArea: true,
    content3D: true,
    contentImages: true,
    productSelector: 'list',   // 使用列表選擇
  },
  permissions: {
    canEdit: true,
    canDelete: false,          // 前台不允許刪除
    canToggleActive: true,
    canAddProduct: true,
    canUploadGLB: true,
    canEditUV: true,
  }
}
```

## useProductMaintenance Hook API

### 返回的狀態

```javascript
const {
  // === 商品狀態 ===
  products,              // 所有商品列表
  selectedProduct,       // 當前選中的商品
  loading,               // 載入狀態
  saving,                // 儲存狀態
  error,                 // 錯誤訊息

  // === UI 狀態 ===
  editingProduct,        // 是否正在編輯
  showAddModal,          // 是否顯示新增 Modal
  newProduct,            // 新增商品的表單資料
  uvTestImage,           // UV 測試圖片

  // === 通知 ===
  notification,          // 當前通知訊息

  // === 設計區域狀態 ===
  tempPrintArea,         // 臨時設計區域數據
  tempBleedArea,         // 臨時出血區域數據
  bleedMode,             // 出血區域模式 ('uniform' | 'separate')
  isDragging,            // 是否正在拖曳

  // === 商品操作方法 ===
  loadProducts,          // 載入商品列表
  handleProductSelect,   // 選擇商品
  handleUpdateProduct,   // 更新商品屬性
  handleSavePrintArea,   // 儲存設計區域
  handleProductTypeChange, // 切換產品類型 (2D/3D)
  handleToggleActive,    // 切換啟用狀態
  handleAddProduct,      // 新增商品
  handleDeleteProduct,   // 刪除商品

  // === 3D 模型操作 ===
  handleUploadGLB,       // 上傳 GLB 模型
  handleRemoveGLB,       // 移除 GLB 模型
  handleUpdateUVMapping, // 更新 UV 映射

  // === 設計區域操作 ===
  updatePrintArea,       // 更新設計區域
  resetPrintArea,        // 重置設計區域
  enableBleedArea,       // 啟用出血區域
  disableBleedArea,      // 停用出血區域
  toggleBleedMode,       // 切換出血模式
  updateBleedArea,       // 更新出血區域
  resetBleedArea,        // 重置出血區域
  startDrag,             // 開始拖曳
  stopDrag,              // 停止拖曳
  handleDragMove,        // 處理拖曳移動
  validateDesignArea,    // 驗證設計區域

  // === 通知方法 ===
  showNotification,      // 顯示通知
  showSuccess,           // 顯示成功訊息
  showError,             // 顯示錯誤訊息

  // === Setters ===
  setError,              // 設定錯誤訊息
  setEditingProduct,     // 設定編輯狀態
  setShowAddModal,       // 設定新增 Modal 狀態
  setNewProduct,         // 設定新增商品資料
  setUvTestImage,        // 設定 UV 測試圖片
  setTempPrintArea,      // 設定臨時設計區域
} = useProductMaintenance(config);
```

## 組件 API

### NotificationMessage

```jsx
<NotificationMessage
  notification={{ message: '成功', type: 'success' }}
  onClose={() => {}}
/>
```

**Props:**
- `notification`: `{ message: string, type: 'success' | 'error' | 'warning' | 'info' } | null`
- `onClose`: `() => void` (可選)

### DesignAreaPreview

```jsx
<DesignAreaPreview
  mockupImage="/path/to/image.jpg"
  printArea={{ x: 50, y: 50, width: 200, height: 150 }}
  bleedArea={{ mode: 'uniform', value: 3 }}
  onPrintAreaChange={(newArea) => {}}
  onDragStart={(type, pos) => {}}
  onDragEnd={() => {}}
  isDragging={false}
  canvasSize={400}
  showBleedArea={true}
/>
```

**Props:**
- `mockupImage`: string (圖片 URL)
- `printArea`: `{ x, y, width, height }`
- `bleedArea`: `{ mode: 'uniform', value: number } | { mode: 'separate', top, right, bottom, left } | null`
- `onPrintAreaChange`: `(area) => void`
- `onDragStart`: `(type, position) => void` (可選)
- `onDragEnd`: `() => void` (可選)
- `isDragging`: boolean (可選)
- `canvasSize`: number (預設 400)
- `showBleedArea`: boolean (預設 true)

### BleedAreaSettings

```jsx
<BleedAreaSettings
  bleedArea={{ mode: 'uniform', value: 3 }}
  bleedMode="uniform"
  onEnableBleed={() => {}}
  onDisableBleed={() => {}}
  onModeChange={(mode) => {}}
  onValueChange={(updates) => {}}
  disabled={false}
/>
```

**Props:**
- `bleedArea`: 出血區域數據
- `bleedMode`: `'uniform' | 'separate'`
- `onEnableBleed`: `() => void`
- `onDisableBleed`: `() => void`
- `onModeChange`: `(mode) => void`
- `onValueChange`: `(updates) => void`
- `disabled`: boolean (可選)

## 自訂配置

如果需要自訂配置，可以使用 `mergeConfig` 或 `getConfig`：

```javascript
import { getConfig, mergeConfig, adminConfig } from '@monkind/shared/components/ProductMaintenance';

// 方式1: 使用 getConfig
const customConfig = getConfig('admin', {
  ui: {
    titleText: '我的自訂標題'
  }
});

// 方式2: 使用 mergeConfig
const customConfig = mergeConfig(adminConfig, {
  permissions: {
    canDelete: false  // 覆寫權限
  }
});

const pm = useProductMaintenance(customConfig);
```

## 注意事項

1. **出血區域功能**: 只在 admin 模式下啟用，customer 模式下應設為 `false`
2. **權限控制**: 根據配置的 permissions 來決定是否顯示/啟用某些功能
3. **布局差異**: Admin 使用 Layout 包裝，Customer 自行管理布局
4. **產品選擇器**: Admin 使用下拉選單，Customer 使用左側列表

## 遷移指南

從舊版本遷移到新的共享組件：

1. 移除本地的 hooks 和 components
2. 導入共享組件和 hooks
3. 使用 `useProductMaintenance` 替代所有本地狀態管理
4. 根據模式選擇適當的配置

詳細步驟請參考 `PRODUCT_MAINTENANCE_REFACTOR_GUIDE.md`
