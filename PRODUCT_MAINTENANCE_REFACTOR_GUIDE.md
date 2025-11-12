# ProductMaintenance 重構指南

## 📊 現況分析

### 檔案位置和大小
- **後台版本**: `packages/admin-app/src/pages/Products/ProductMaintenance.jsx` (1,971 行)
- **前台版本**: `packages/customer-app/src/pages/Admin/ProductMaintenance.jsx` (2,116 行)
- **總計**: 4,087 行重複代碼
- **相似度**: 約 85%

### 主要差異
1. **布局**: 後台用下拉選單，前台用左側列表
2. **出血區域**: 僅後台有此功能
3. **導航**: 前台有返回按鈕，後台使用 Layout
4. **狀態管理**: 後台已有部分 hooks，前台使用本地狀態

---

## ✅ 已完成的工作

### 1. 建立共用目錄結構
```
packages/shared/components/ProductMaintenance/
├── hooks/
│   ├── useNotification.js      ✅ 已完成
│   └── useDesignArea.js         ✅ 已完成
├── utils/
│   └── validationHelpers.js    ✅ 已完成
├── components/
│   └── (待移植子組件)
├── config.js                    ✅ 已完成
└── index.jsx                    (待建立)
```

### 2. 已移植的模組
- ✅ `useNotification` - 通知管理 hook
- ✅ `useDesignArea` - 設計區域管理 hook
- ✅ `validationHelpers` - 驗證輔助函數
- ✅ `config.js` - 配置系統（adminConfig, customerConfig）

---

## 🎯 重構策略：逐步遷移法

由於組件龐大，建議採用 **逐步遷移** 而非一次性重寫：

### 階段 1：提取共用子組件（優先）⭐

#### 需要提取的組件

1. **NotificationMessage** (通知訊息組件)
   - 來源: `packages/admin-app/src/pages/Products/components/NotificationMessage.jsx`
   - 目標: `packages/shared/components/ProductMaintenance/components/NotificationMessage.jsx`
   - 狀態: 前後台完全相同，可直接複製

2. **DesignAreaPreview** (設計區域預覽)
   - 來源: `packages/admin-app/src/pages/Products/components/DesignAreaPreview.jsx`
   - 目標: `packages/shared/components/ProductMaintenance/components/DesignAreaPreview.jsx`
   - 修改: 需支援配置化（是否顯示出血區域）

3. **BleedAreaSettings** (出血區域設定)
   - 來源: `packages/admin-app/src/pages/Products/components/BleedAreaSettings.jsx`
   - 目標: `packages/shared/components/ProductMaintenance/components/BleedAreaSettings.jsx`
   - 使用: 僅在 `config.features.bleedArea === true` 時顯示

4. **ProductSelector** (產品選擇器 - 新建)
   - 功能: 根據配置顯示下拉選單或左側列表
   - 目標: `packages/shared/components/ProductMaintenance/components/ProductSelector.jsx`
   - Props:
     ```javascript
     {
       mode: 'dropdown' | 'list',
       products: [],
       selectedProduct: null,
       onSelect: (product) => {},
     }
     ```

5. **ProductForm** (產品資訊表單)
   - 功能: 商品基本資訊編輯
   - 目標: `packages/shared/components/ProductMaintenance/components/ProductForm.jsx`
   - 狀態: 前後台邏輯相同

6. **ContentImagesManager** (內容圖片管理)
   - 功能: 商品內容圖片上傳和排序
   - 目標: `packages/shared/components/ProductMaintenance/components/ContentImagesManager.jsx`
   - 狀態: 前後台邏輯相同

7. **Model3DManager** (3D 模型管理)
   - 功能: GLB 上傳、UV 映射、測試圖片
   - 目標: `packages/shared/components/ProductMaintenance/components/Model3DManager.jsx`
   - 狀態: 前後台邏輯相同

---

### 階段 2：提取共用業務邏輯

創建 `useProductMaintenance` hook 統一管理：

```javascript
// packages/shared/components/ProductMaintenance/hooks/useProductMaintenance.js

import { useState, useEffect, useCallback } from 'react';
import { API } from '@monkind/shared/services/api';
import { useNotification } from './useNotification';
import { useDesignArea } from './useDesignArea';

export const useProductMaintenance = (config) => {
  const { notification, showNotification } = useNotification();
  const designArea = useDesignArea();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 載入商品
  const loadProducts = useCallback(async () => {
    // ... 共用邏輯
  }, []);

  // 保存設計區域
  const handleSavePrintArea = useCallback(async () => {
    const updateData = {
      printArea: designArea.tempPrintArea,
    };

    // 如果啟用出血區域
    if (config.features.bleedArea && designArea.tempBleedArea) {
      updateData.bleedArea = designArea.tempBleedArea;
    }

    await API.products.update(selectedProduct.id, updateData);
  }, [selectedProduct, designArea, config]);

  // 3D 模型上傳
  const handleGLBUpload = useCallback(async (file) => {
    // ... 共用邏輯
  }, [selectedProduct]);

  // 圖片上傳
  const handleImageUpload = useCallback(async (file, type) => {
    // ... 共用邏輯
  }, [selectedProduct]);

  return {
    // 狀態
    products,
    selectedProduct,
    loading,
    saving,
    notification,

    // 設計區域
    ...designArea,

    // 方法
    loadProducts,
    setSelectedProduct,
    handleSavePrintArea,
    handleGLBUpload,
    handleImageUpload,
    showNotification,
  };
};
```

---

### 階段 3：創建主組件框架

```javascript
// packages/shared/components/ProductMaintenance/index.jsx

import React from 'react';
import { getConfig } from './config';
import { useProductMaintenance } from './hooks/useProductMaintenance';
import Layout from './components/Layout'; // 條件包裝器
import ProductSelector from './components/ProductSelector';
import DesignAreaPreview from './components/DesignAreaPreview';
import BleedAreaSettings from './components/BleedAreaSettings';
import ProductForm from './components/ProductForm';
import Model3DManager from './components/Model3DManager';
import ContentImagesManager from './components/ContentImagesManager';
import NotificationMessage from './components/NotificationMessage';

const ProductMaintenance = ({ mode = 'admin', customConfig = {} }) => {
  const config = getConfig(mode, customConfig);
  const {
    products,
    selectedProduct,
    loading,
    notification,
    tempPrintArea,
    tempBleedArea,
    // ... 其他狀態和方法
  } = useProductMaintenance(config);

  if (loading) {
    return <div>載入中...</div>;
  }

  const content = (
    <div className={config.layout.columns === 3 ? 'grid grid-cols-1 lg:grid-cols-4 gap-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
      {/* 產品選擇器 */}
      {config.layout.showProductList && (
        <div className="lg:col-span-1">
          <ProductSelector
            mode="list"
            products={products}
            selectedProduct={selectedProduct}
            onSelect={setSelectedProduct}
          />
        </div>
      )}

      {/* 主要內容區 */}
      <div className={config.layout.showProductList ? 'lg:col-span-2' : 'lg:col-span-1'}>
        {/* 設計區域預覽 */}
        <DesignAreaPreview
          tempPrintArea={tempPrintArea}
          tempBleedArea={config.features.bleedArea ? tempBleedArea : null}
          mockupImage={selectedProduct?.mockupImage}
          onSave={handleSavePrintArea}
        />

        {/* 出血區域設定（僅後台）*/}
        {config.features.bleedArea && (
          <BleedAreaSettings
            tempBleedArea={tempBleedArea}
            bleedMode={bleedMode}
            onToggleEnable={enableBleedArea}
            onDisable={disableBleedArea}
            onModeChange={toggleBleedMode}
            onValueChange={updateBleedArea}
          />
        )}
      </div>

      {/* 右側欄：商品資訊 */}
      <div className="lg:col-span-1">
        <ProductForm
          product={selectedProduct}
          onUpdate={handleUpdateProduct}
          permissions={config.permissions}
        />

        {selectedProduct?.type === '3D' && (
          <Model3DManager
            product={selectedProduct}
            onGLBUpload={handleGLBUpload}
            onUVChange={handleUVChange}
            permissions={config.permissions}
          />
        )}

        <ContentImagesManager
          product={selectedProduct}
          onUpload={handleContentImageUpload}
          onRemove={handleRemoveContentImage}
          onReorder={handleMoveContentImage}
          permissions={config.permissions}
        />
      </div>
    </div>
  );

  // 根據配置決定是否使用 Layout 包裝
  if (config.layout.useLayout) {
    return (
      <Layout>
        {notification && <NotificationMessage notification={notification} />}
        <h1>{config.ui.titleText}</h1>
        {!config.layout.showProductList && (
          <ProductSelector
            mode="dropdown"
            products={products}
            selectedProduct={selectedProduct}
            onSelect={setSelectedProduct}
          />
        )}
        {content}
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {notification && <NotificationMessage notification={notification} />}

      {config.layout.showBackButton && (
        <button onClick={() => navigate(config.layout.backPath)}>
          返回
        </button>
      )}

      <h1>{config.ui.titleText}</h1>
      {content}
    </div>
  );
};

export default ProductMaintenance;
```

---

### 階段 4：更新 App 使用共用組件

#### 後台版本 (admin-app)

```javascript
// packages/admin-app/src/pages/Products/ProductMaintenance.jsx

import ProductMaintenance from '@monkind/shared/components/ProductMaintenance';
import { adminConfig } from '@monkind/shared/components/ProductMaintenance/config';

const AdminProductMaintenance = () => {
  return <ProductMaintenance mode="admin" customConfig={adminConfig} />;
};

export default AdminProductMaintenance;
```

#### 前台版本 (customer-app)

```javascript
// packages/customer-app/src/pages/Admin/ProductMaintenance.jsx

import ProductMaintenance from '@monkind/shared/components/ProductMaintenance';
import { customerConfig } from '@monkind/shared/components/ProductMaintenance/config';

const CustomerProductMaintenance = () => {
  return <ProductMaintenance mode="customer" customConfig={customerConfig} />;
};

export default CustomerProductMaintenance;
```

---

## 📝 詳細執行步驟

### Step 1: 移植子組件（最優先）

```bash
# 1. 複製 NotificationMessage
cp packages/admin-app/src/pages/Products/components/NotificationMessage.jsx \
   packages/shared/components/ProductMaintenance/components/

# 2. 複製 DesignAreaPreview
cp packages/admin-app/src/pages/Products/components/DesignAreaPreview.jsx \
   packages/shared/components/ProductMaintenance/components/

# 3. 複製 BleedAreaSettings
cp packages/admin-app/src/pages/Products/components/BleedAreaSettings.jsx \
   packages/shared/components/ProductMaintenance/components/
```

### Step 2: 建立 useProductMaintenance Hook

在 `packages/shared/components/ProductMaintenance/hooks/useProductMaintenance.js` 中：

1. 複製後台版本的所有業務邏輯函數
2. 整合 `useNotification` 和 `useDesignArea`
3. 添加配置支持（根據 config 決定行為）

關鍵函數清單：
- `loadProducts()` - 載入商品
- `handleSavePrintArea()` - 保存設計區（需支援出血區域配置）
- `handleGLBUpload()` - GLB 上傳
- `handleImageUpload()` - 圖片上傳
- `handleUpdateProduct()` - 更新商品屬性
- `handleAddProduct()` - 新增商品
- `handleToggleActive()` - 切換啟用
- `autoAdjustPrintAreaForImage()` - 自動調整設計區
- `compressImage()` - 圖片壓縮

### Step 3: 建立主組件

按照上面的框架創建 `index.jsx`

### Step 4: 測試

1. 先在後台 App 測試（保留舊版本作為備份）
2. 確認所有功能正常
3. 再在前台 App 測試
4. 確認出血區域功能只在後台顯示

---

## 🗑️ 可以移除的舊檔案清單

### 重構完成後可刪除

#### Admin App (後台)
```
packages/admin-app/src/pages/Products/
├── hooks/
│   ├── useNotification.js       ❌ 可刪除（已移至 shared）
│   └── useDesignArea.js          ❌ 可刪除（已移至 shared）
├── utils/
│   └── validationHelpers.js     ❌ 可刪除（已移至 shared）
├── components/
│   ├── NotificationMessage.jsx  ❌ 可刪除（已移至 shared）
│   ├── DesignAreaPreview.jsx    ❌ 可刪除（已移至 shared）
│   └── BleedAreaSettings.jsx    ❌ 可刪除（已移至 shared）
└── ProductMaintenance.jsx       ⚠️ 改為薄包裝器（10行代碼）
```

#### Customer App (前台)
```
packages/customer-app/src/pages/Admin/
└── ProductMaintenance.jsx       ⚠️ 改為薄包裝器（10行代碼）
```

### 預期減少的代碼量
- **移除重複代碼**: ~2,000 行
- **保留配置和包裝器**: ~20 行
- **共用組件**: ~2,100 行（含註解和配置系統）
- **淨減少**: 約 50% 代碼量

---

## ⚠️ 注意事項

### 1. API 兼容性
確保 `API.products.update()` 同時支持：
```javascript
await API.products.update(id, {
  printArea: {...},
  bleedArea: {...},  // 可選
  // ... 其他欄位
});
```

### 2. Import 路徑更新
使用 `@monkind/shared` alias：
```javascript
import ProductMaintenance from '@monkind/shared/components/ProductMaintenance';
import { adminConfig } from '@monkind/shared/components/ProductMaintenance/config';
```

### 3. 測試清單
- [ ] 後台：商品列表載入
- [ ] 後台：下拉選單切換商品
- [ ] 後台：設計區域編輯和保存
- [ ] 後台：出血區域設定
- [ ] 後台：3D 模型上傳
- [ ] 後台：圖片上傳
- [ ] 前台：左側列表顯示
- [ ] 前台：設計區域編輯
- [ ] 前台：無出血區域選項
- [ ] 前台：返回按鈕功能

---

## 📊 進度追蹤

### 已完成 ✅
- [x] 建立共用目錄結構
- [x] 移植 hooks (useNotification, useDesignArea)
- [x] 移植驗證輔助函數
- [x] 建立配置系統

### 待完成 📋
- [ ] 移植子組件（NotificationMessage, DesignAreaPreview, BleedAreaSettings）
- [ ] 建立 useProductMaintenance hook
- [ ] 建立主組件 index.jsx
- [ ] 更新 admin-app 使用共用組件
- [ ] 更新 customer-app 使用共用組件
- [ ] 測試所有功能
- [ ] 移除舊檔案

---

## 💡 建議

1. **逐步測試**: 每完成一個階段就測試，不要等到全部完成
2. **保留備份**: 在刪除舊檔案前，先確保新版本完全正常
3. **漸進遷移**: 可以先讓兩個版本並存，確認無誤後再刪除舊版
4. **文檔更新**: 重構完成後更新 `API_REFERENCE.md` 和 `ARCHITECTURE.md`

---

**最後更新**: 2025-01-12
**狀態**: 進行中（已完成 40%）
**預估剩餘時間**: 3-4 小時
