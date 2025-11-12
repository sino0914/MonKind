# ✅ ProductMaintenance 遷移完成

## 遷移狀態

**執行時間**: 2025-11-12
**狀態**: ✅ 已完成檔案替換

### 已替換的檔案

#### Admin App
- **舊版**: `ProductMaintenance.OLD.jsx` (1,971 行, 73KB)
- **新版**: `ProductMaintenance.jsx` (384 行, 17KB)
- **節省**: **1,587 行 (-80%)**

#### Customer App
- **舊版**: `ProductMaintenance.OLD.jsx` (2,116 行, 78KB)
- **新版**: `ProductMaintenance.jsx` (478 行, 21KB)
- **節省**: **1,638 行 (-77%)**

### 總計節省
- **代碼行數**: 3,225 行 (-79%)
- **檔案大小**: 133KB → 38KB (-71%)
- **預估 Token 節省**: ~3,100 tokens (當這些檔案被讀取時)

---

## 🧪 測試檢查清單

在刪除舊檔案之前，請測試以下功能：

### Admin App 測試

啟動 Admin App:
```bash
pnpm dev:admin
```

測試項目:
- [ ] 頁面正常載入，無控制台錯誤
- [ ] 下拉選單顯示商品列表
- [ ] 可以選擇不同商品
- [ ] 設計區域預覽正常顯示
- [ ] 可以拖曳移動設計區域
- [ ] 可以調整設計區域大小
- [ ] **出血區域設定正常顯示** (Admin 專屬功能)
- [ ] 可以啟用/停用出血區域
- [ ] 可以切換出血區域模式（統一/分別）
- [ ] 儲存設計區域功能正常
- [ ] 切換產品類型 (2D/3D) 功能正常
- [ ] 新增商品 Modal 正常運作
- [ ] 通知訊息正常顯示
- [ ] 3D 模型上傳/預覽功能正常（如果有 3D 產品）

### Customer App 測試

啟動 Customer App:
```bash
pnpm dev:customer
```

測試項目:
- [ ] 頁面正常載入，無控制台錯誤
- [ ] 左側商品列表正常顯示
- [ ] 可以點擊列表選擇商品
- [ ] 設計區域預覽正常顯示
- [ ] 可以拖曳移動設計區域
- [ ] 可以調整設計區域大小
- [ ] **不顯示出血區域** (Customer 不應有此功能)
- [ ] 儲存設計區域功能正常
- [ ] 返回按鈕功能正常
- [ ] 商品資訊編輯功能正常
- [ ] 啟用/停用商品切換正常
- [ ] 新增商品 Modal 正常運作
- [ ] 通知訊息正常顯示
- [ ] 3D 模型上傳/預覽功能正常（如果有 3D 產品）

---

## 🔍 驗證共享組件

確認兩個 App 都正確使用共享組件：

### Admin App 導入檢查
```javascript
import {
  useProductMaintenance,
  adminConfig,
  NotificationMessage,
  DesignAreaPreview,
  BleedAreaSettings,
} from "@monkind/shared/components/ProductMaintenance";

const pm = useProductMaintenance(adminConfig);
```

### Customer App 導入檢查
```javascript
import {
  useProductMaintenance,
  customerConfig,
  NotificationMessage,
  DesignAreaPreview,
} from "@monkind/shared/components/ProductMaintenance";

const pm = useProductMaintenance(customerConfig);
```

---

## 📌 已知差異（這是正常的）

### Admin vs Customer 功能差異

| 功能 | Admin | Customer | 原因 |
|-----|-------|----------|------|
| 產品選擇器 | 下拉選單 | 左側列表 | UI 設計差異 |
| 出血區域設定 | ✅ 有 | ❌ 無 | Admin 專屬功能 |
| 返回按鈕 | ❌ 無 | ✅ 有 | Customer 需要返回 |
| Layout 包裝 | ✅ 有 | ❌ 無 | 架構差異 |
| 刪除商品 | ✅ 可以 | ❌ 不可 | 權限差異 |

這些差異是由配置 (`adminConfig` vs `customerConfig`) 控制的，屬於預期行為。

---

## ⚠️ 常見問題排查

### 問題 1: 導入錯誤 "Module not found"

**症狀**: `Cannot find module '@monkind/shared/components/ProductMaintenance'`

**解決方案**:
```bash
# 重新安裝依賴
pnpm install

# 或者重新 build shared package
cd packages/shared
pnpm build
```

### 問題 2: 出血區域在 Admin 沒有顯示

**檢查**:
1. 確認使用 `adminConfig`（不是 `customerConfig`）
2. 檢查 `adminConfig.features.bleedArea` 是否為 `true`

### 問題 3: Customer App 顯示了出血區域

**檢查**:
1. 確認使用 `customerConfig`（不是 `adminConfig`）
2. 檢查 `DesignAreaPreview` 的 `showBleedArea` prop 是否為 `false`

### 問題 4: 樣式顯示異常

**可能原因**: Tailwind CSS 類名未被正確編譯

**解決方案**:
```bash
# 重啟開發伺服器
pnpm dev:admin
# 或
pnpm dev:customer
```

---

## ✅ 測試通過後的下一步

當所有測試都通過後，執行清理腳本刪除舊檔案：

### 使用清理腳本（推薦）

```powershell
# 會詢問確認，並刪除所有舊檔案
.\cleanup.ps1
```

### 或手動刪除

```powershell
# Admin App - 刪除舊的 hooks 和 components
Remove-Item -Path "packages\admin-app\src\pages\Products\hooks" -Recurse -Force
Remove-Item -Path "packages\admin-app\src\pages\Products\components" -Recurse -Force
Remove-Item -Path "packages\admin-app\src\utils\bleedAreaUtils.js" -Force

# 刪除備份檔案（確認測試通過後）
Remove-Item -Path "packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx" -Force
Remove-Item -Path "packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx" -Force

# 刪除暫存檔案
Remove-Item -Path "packages\admin-app\src\pages\Products\ProductMaintenance.NEW.jsx" -Force
Remove-Item -Path "packages\customer-app\src\pages\Admin\ProductMaintenance.NEW.jsx" -Force
```

---

## 🔄 如需回滾

如果發現問題需要回滾：

```powershell
# 使用回滾腳本
.\rollback.ps1

# 或手動回滾
Copy-Item -Path "packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx" `
          -Destination "packages\admin-app\src\pages\Products\ProductMaintenance.jsx" -Force

Copy-Item -Path "packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx" `
          -Destination "packages\customer-app\src\pages\Admin\ProductMaintenance.jsx" -Force
```

---

## 📊 遷移成果

### 代碼簡化

**之前**:
- Admin: 1,971 行獨立代碼
- Customer: 2,116 行獨立代碼
- 共享: 0 行
- **總計: 4,087 行**

**之後**:
- Admin: 384 行（使用共享庫）
- Customer: 478 行（使用共享庫）
- 共享: 642 行（被兩個 App 重用）
- **總計: 1,504 行**

**節省**: **2,583 行 (63%)**

### 維護成本降低

- ✅ Bug 修復只需改一處
- ✅ 新功能只需實作一次
- ✅ 測試範圍縮小 63%
- ✅ 代碼審查更快速

---

**測試人員**: __________
**測試日期**: __________
**測試結果**: ☐ 通過 ☐ 失敗
**備註**: ______________________________
