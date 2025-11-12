# ProductMaintenance 回滾通知

## 📌 回滾原因

**日期**: 2025-11-12

由於新版本的 ProductMaintenance 組件**過於簡化**，缺少了許多重要的商品管理功能，已**回滾到舊版本**。

---

## ❌ 新版本缺少的功能

新版本（簡化版）缺少以下重要功能：

### 1. 商品資訊編輯
- ❌ 商品標題編輯
- ❌ 商品價格編輯
- ❌ 商品描述編輯
- ❌ 商品類別選擇
- ❌ 精選商品標記
- ❌ 啟用/停用切換

### 2. 圖片管理
- ❌ 商品主圖上傳
- ❌ 商品底圖 (mockup) 上傳/更換/刪除
- ❌ 內容圖片管理 (contentImages)
- ❌ 內容圖片排序

### 3. 設計區域自動調整
- ❌ 根據圖片比例自動調整設計區域
- ❌ 自動居中設計區域

### 4. 其他功能
- ❌ 商品刪除功能
- ❌ 完整的表單驗證
- ❌ 內容圖片展示

---

## ✅ 已執行的操作

### 1. 回滾到舊版本 ✅

```bash
# Admin App
packages/admin-app/src/pages/Products/ProductMaintenance.jsx
→ 已回滾到 OLD 版本

# Customer App
packages/customer-app/src/pages/Admin/ProductMaintenance.jsx
→ 已回滾到 OLD 版本
```

### 2. 保留共享組件庫 ✅

雖然回滾了主組件，但共享組件庫仍然保留：
```
packages/shared/components/ProductMaintenance/
├── hooks/
│   ├── useNotification.js
│   ├── useDesignArea.js
│   └── useProductMaintenance.js
├── components/
│   ├── NotificationMessage.jsx
│   ├── DesignAreaPreview.jsx
│   └── BleedAreaSettings.jsx
└── utils/
    ├── validationHelpers.js
    └── bleedAreaUtils.js
```

**這些組件依然可以在未來的重構中使用！**

---

## 🔄 未來改進方向

### 方案 1: 漸進式遷移（推薦）

**策略**: 保留舊版本的所有功能，逐步抽取部分邏輯到共享庫

**步驟**:
1. 先抽取純展示組件（NotificationMessage, DesignAreaPreview 等）
2. 再抽取獨立的 hooks（useNotification, useDesignArea）
3. 最後才考慮抽取整體業務邏輯

**優點**:
- ✅ 不會丟失任何功能
- ✅ 可以逐步測試每個部分
- ✅ 降低風險

### 方案 2: 完善 useProductMaintenance hook

**策略**: 將所有缺失的功能都添加到 `useProductMaintenance` hook 中

**需要添加的功能**:
```javascript
export const useProductMaintenance = (config) => {
  // ... 現有功能 ...

  // ➕ 需要添加的功能:

  // 商品圖片管理
  const handleImageUpload = async (file) => { /* ... */ };
  const handleRemoveImage = async () => { /* ... */ };

  // 底圖管理
  const handleMockupImageUpload = async (file) => { /* ... */ };
  const handleRemoveMockupImage = async () => { /* ... */ };

  // 內容圖片管理
  const handleContentImageUpload = async (files) => { /* ... */ };
  const handleRemoveContentImage = async (index) => { /* ... */ };
  const handleMoveContentImage = async (fromIndex, toIndex) => { /* ... */ };

  // 設計區域自動調整
  const autoAdjustPrintAreaForImage = async (file) => { /* ... */ };

  // 商品資訊編輯
  const handleUpdateTitle = async (title) => { /* ... */ };
  const handleUpdatePrice = async (price) => { /* ... */ };
  const handleUpdateDescription = async (description) => { /* ... */ };
  const handleUpdateCategory = async (category) => { /* ... */ };
  const handleToggleFeatured = async () => { /* ... */ };

  return {
    // ... 所有功能 ...
  };
};
```

### 方案 3: 分階段功能模組化

**策略**: 將不同功能分別建立獨立 hooks

```
hooks/
├── useProductMaintenance.js       # 核心業務邏輯
├── useProductImages.js            # 圖片管理
├── useMockupImage.js              # 底圖管理
├── useContentImages.js            # 內容圖片
├── useDesignArea.js               # 設計區域
└── useProductInfo.js              # 商品資訊編輯
```

---

## 📊 代碼行數對比

| 版本 | Admin App | Customer App | 功能完整度 |
|------|-----------|--------------|-----------|
| **舊版 (現行)** | 1,971 行 | 2,116 行 | ✅ 100% |
| **新版 (已回滾)** | 384 行 | 478 行 | ❌ ~30% |

**結論**: 新版本雖然代碼少了 80%，但功能只剩 30%，不符合實際需求。

---

## 💡 重構建議

### 短期（1-2週）

1. **不要急於重構整個組件**
   - 目前的舊版本運作良好
   - 重構應該是漸進的，而非激進的

2. **優先抽取可重用的部分**
   - ✅ 已完成：NotificationMessage, DesignAreaPreview, BleedAreaSettings
   - 下一步：MockupImageUploader, ContentImagesManager

3. **建立完整的需求文檔**
   - 列出所有必需的功能
   - 確保重構版本不會遺漏任何功能

### 中期（1個月）

1. **建立完整的測試清單**
   - 單元測試
   - 整合測試
   - E2E 測試

2. **逐步抽取功能模組**
   - 一次抽取一個功能
   - 每次抽取後都要完整測試

### 長期（2-3個月）

1. **考慮使用 TypeScript**
   - 提高類型安全
   - 減少 runtime 錯誤

2. **建立 Storybook**
   - 展示所有共享組件
   - 提供使用範例

---

## 🚀 目前狀態

### ✅ 已完成
- 共享組件庫架構建立
- 核心 hooks 抽取（useNotification, useDesignArea）
- 基礎組件抽取（3個組件）
- 配置系統建立（adminConfig, customerConfig）

### ❌ 需要改進
- useProductMaintenance 功能不完整
- 缺少圖片管理相關功能
- 缺少商品資訊編輯功能
- 沒有完整的測試覆蓋

### 📋 下一步
1. 使用舊版本正常開發
2. 等待需求穩定後再考慮重構
3. 或者採用漸進式遷移策略

---

## 📂 檔案狀態

### 保留的檔案

```
packages/admin-app/src/pages/Products/
├── ProductMaintenance.jsx         # ✅ 舊版本（運作中）
├── ProductMaintenance.OLD.jsx     # 🔄 備份
├── ProductMaintenance.NEW.jsx     # ⚠️  簡化版（已棄用）
├── hooks/                          # ✅ 本地 hooks（運作中）
├── components/                     # ✅ 本地組件（運作中）
└── utils/                          # ✅ 本地工具（運作中）

packages/shared/components/ProductMaintenance/
├── hooks/                          # ✅ 共享 hooks（可用但未使用）
├── components/                     # ✅ 共享組件（可用但未使用）
├── utils/                          # ✅ 共享工具（可用但未使用）
└── config.js                       # ✅ 配置系統（可用）
```

### 可刪除的檔案（暫不刪除）

建議保留 `.NEW.jsx` 檔案作為參考，未來重構時可以借鑑。

---

## ⚠️ 重要提醒

### 給開發者

1. **目前使用舊版本開發**
   - `ProductMaintenance.jsx` = 舊版本（完整功能）
   - 不要引用 `@monkind/shared/components/ProductMaintenance`

2. **共享組件庫依然可用**
   - 可以單獨導入使用 `useNotification`, `useDesignArea` 等
   - 不需要使用完整的 `useProductMaintenance`

3. **未來重構時的注意事項**
   - 確保所有現有功能都被保留
   - 進行充分的測試
   - 考慮使用 feature flag 進行漸進式遷移

---

## 📚 相關文檔

- **Token 優化報告**: `TOKEN_OPTIMIZATION_COMPLETE.md`
- **重構指南**: `PRODUCT_MAINTENANCE_REFACTOR_GUIDE.md`
- **共享組件使用**: `packages/shared/components/ProductMaintenance/USAGE.md`
- **故障排查**: `TROUBLESHOOTING_FIXES.md`

---

**文檔建立時間**: 2025-11-12
**回滾原因**: 新版本功能不完整
**當前狀態**: 使用舊版本（功能完整）
**未來計畫**: 漸進式遷移或等待需求穩定
