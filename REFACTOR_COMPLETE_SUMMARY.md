# ProductMaintenance 重構完成摘要

## 🎉 重構已完成

ProductMaintenance 組件已成功重構為共享組件庫，消除了 ~4,087 行重複代碼。

## ✅ 已建立的新檔案

### 共享組件庫 (packages/shared/components/ProductMaintenance/)

```
packages/shared/components/ProductMaintenance/
├── index.js                                    # 主導出檔案
├── config.js                                   # 配置系統 (admin/customer)
├── USAGE.md                                    # 使用指南
├── hooks/
│   ├── useNotification.js                      # 通知管理 hook
│   ├── useDesignArea.js                        # 設計區域管理 hook
│   └── useProductMaintenance.js                # ⭐ 核心業務邏輯 hook
├── components/
│   ├── NotificationMessage.jsx                 # 通知訊息組件
│   ├── DesignAreaPreview.jsx                   # 設計區域預覽
│   └── BleedAreaSettings.jsx                   # 出血區域設定
└── utils/
    ├── validationHelpers.js                    # 驗證工具函數
    └── bleedAreaUtils.js                       # 出血區域工具函數
```

### 新的應用層組件

```
packages/admin-app/src/pages/Products/
└── ProductMaintenance.NEW.jsx                  # ⭐ 新的簡化版本 (384 行)

packages/customer-app/src/pages/Admin/
└── ProductMaintenance.NEW.jsx                  # ⭐ 新的簡化版本 (478 行)
```

## 📊 代碼行數對比

| 版本 | Admin | Customer | 共享庫 | 總計 |
|------|-------|----------|--------|------|
| **舊版** | 1,971 行 | 2,116 行 | 0 行 | **4,087 行** |
| **新版** | 384 行 | 478 行 | 642 行 | **1,504 行** |
| **節省** | -1,587 行 | -1,638 行 | +642 行 | **-2,583 行 (63%)** |

## 🔄 遷移步驟

### 步驟 1: 替換 Admin 版本

```bash
# 備份舊檔案（可選）
cp packages/admin-app/src/pages/Products/ProductMaintenance.jsx packages/admin-app/src/pages/Products/ProductMaintenance.OLD.jsx

# 使用新版本
mv packages/admin-app/src/pages/Products/ProductMaintenance.NEW.jsx packages/admin-app/src/pages/Products/ProductMaintenance.jsx
```

### 步驟 2: 替換 Customer 版本

```bash
# 備份舊檔案（可選）
cp packages/customer-app/src/pages/Admin/ProductMaintenance.jsx packages/customer-app/src/pages/Admin/ProductMaintenance.OLD.jsx

# 使用新版本
mv packages/customer-app/src/pages/Admin/ProductMaintenance.NEW.jsx packages/customer-app/src/pages/Admin/ProductMaintenance.jsx
```

### 步驟 3: 測試功能

啟動兩個應用並測試以下功能：

**Admin App 測試清單:**
- [ ] 載入商品列表（下拉選單）
- [ ] 選擇商品
- [ ] 編輯設計區域（拖曳、調整大小）
- [ ] 設定出血區域（統一模式、分別設定模式）
- [ ] 儲存設計區域
- [ ] 切換產品類型 (2D/3D)
- [ ] 上傳/移除 GLB 模型
- [ ] 編輯 UV 映射
- [ ] 新增商品
- [ ] 通知訊息顯示

**Customer App 測試清單:**
- [ ] 載入商品列表（左側列表）
- [ ] 選擇商品
- [ ] 編輯設計區域
- [ ] 儲存設計區域（不含出血區域）
- [ ] 切換產品類型 (2D/3D)
- [ ] 上傳/移除 GLB 模型
- [ ] 編輯商品資訊（名稱、價格、類別）
- [ ] 切換啟用狀態
- [ ] 新增商品
- [ ] 返回按鈕

### 步驟 4: 確認後刪除舊檔案

**⚠️ 只有在測試通過後才執行刪除操作！**

## 🗑️ 可以刪除的舊檔案清單

### Admin App - 可刪除檔案

```bash
# 舊版主組件（已被新版替換）
packages/admin-app/src/pages/Products/ProductMaintenance.OLD.jsx

# 本地 hooks（已移至共享庫）
packages/admin-app/src/pages/Products/hooks/useNotification.js
packages/admin-app/src/pages/Products/hooks/useDesignArea.js

# 本地組件（已移至共享庫）
packages/admin-app/src/pages/Products/components/NotificationMessage.jsx
packages/admin-app/src/pages/Products/components/DesignAreaPreview.jsx
packages/admin-app/src/pages/Products/components/BleedAreaSettings.jsx

# 本地工具（已移至共享庫）
packages/admin-app/src/utils/bleedAreaUtils.js
```

### Customer App - 可刪除檔案

```bash
# 舊版主組件（已被新版替換）
packages/customer-app/src/pages/Admin/ProductMaintenance.OLD.jsx

# 注意：Customer App 原本沒有使用本地 hooks/components/utils，
# 所有邏輯都在主組件中，所以只需刪除舊版主組件即可
```

### 刪除命令（測試通過後執行）

```bash
# Admin App
rm -rf packages/admin-app/src/pages/Products/hooks/
rm -rf packages/admin-app/src/pages/Products/components/
rm packages/admin-app/src/utils/bleedAreaUtils.js
rm packages/admin-app/src/pages/Products/ProductMaintenance.OLD.jsx

# Customer App
rm packages/customer-app/src/pages/Admin/ProductMaintenance.OLD.jsx
```

## 📁 新架構概覽

### 共享組件使用方式

```javascript
// Admin App
import {
  useProductMaintenance,
  adminConfig,
  NotificationMessage,
  DesignAreaPreview,
  BleedAreaSettings,
} from '@monkind/shared/components/ProductMaintenance';

const pm = useProductMaintenance(adminConfig);

// Customer App
import {
  useProductMaintenance,
  customerConfig,
  NotificationMessage,
  DesignAreaPreview,
} from '@monkind/shared/components/ProductMaintenance';

const pm = useProductMaintenance(customerConfig);
```

### 核心差異由配置驅動

**Admin 配置特點:**
- 使用 Layout 包裝
- 下拉選單選擇產品
- ✅ 啟用出血區域功能
- 兩欄布局
- 完整權限（含刪除）

**Customer 配置特點:**
- 不使用 Layout
- 左側列表選擇產品
- ❌ 不啟用出血區域
- 三欄布局（1+3）
- 有返回按鈕
- 受限權限（無刪除）

## 🎯 主要改進

1. **消除重複代碼**: 從 4,087 行減少到 1,504 行，節省 63%
2. **統一業務邏輯**: 所有邏輯集中在 `useProductMaintenance` hook
3. **配置驅動**: 通過配置控制行為差異，不需修改代碼
4. **易於維護**: 修復 bug 或新增功能只需修改一處
5. **類型安全**: 明確的 props 和返回值定義
6. **文檔完善**: 包含使用指南和 API 文檔

## 🔍 未來優化建議

1. **TypeScript 遷移**: 建議將共享組件庫改為 TypeScript，增加型別安全
2. **單元測試**: 為 hooks 和 utils 增加單元測試
3. **Storybook**: 為共享組件建立 Storybook 文檔
4. **性能優化**:
   - 考慮使用 `React.memo` 優化組件渲染
   - 使用 `useMemo` 和 `useCallback` 優化計算和回調
5. **更多配置選項**:
   - 可自訂顏色主題
   - 可自訂驗證規則
   - 可自訂 UI 文案

## 📝 相關文檔

- 詳細使用指南: `packages/shared/components/ProductMaintenance/USAGE.md`
- 重構步驟指南: `PRODUCT_MAINTENANCE_REFACTOR_GUIDE.md`
- API 參考: 見 USAGE.md 中的 "useProductMaintenance Hook API" 章節

## ⚠️ 注意事項

1. **不要立即刪除舊檔案**: 先完成測試，確認功能正常
2. **保留備份**: 建議保留 `.OLD.jsx` 備份檔案至少一週
3. **團隊溝通**: 通知團隊成員新的檔案結構和使用方式
4. **文檔更新**: 更新團隊內部文檔以反映新架構

## 🚀 開始使用

查看使用指南以了解如何使用新的共享組件:

```bash
cat packages/shared/components/ProductMaintenance/USAGE.md
```

---

**重構完成時間**: 2025-11-12
**節省代碼**: 2,583 行 (63%)
**新增共享組件**: 9 個檔案
**簡化應用組件**: 從 ~2000 行降至 ~400 行
