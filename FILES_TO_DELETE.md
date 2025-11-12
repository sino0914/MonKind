# 可刪除的舊檔案清單

## ⚠️ 重要提醒

**只有在完成測試並確認新版本運作正常後，才執行刪除操作！**

建議先保留備份至少一週，確保沒有遺漏的功能。

---

## 📋 Admin App - 可刪除檔案

### 路徑: `packages/admin-app/src/pages/Products/`

```
✓ hooks/useNotification.js                      → 已移至共享庫
✓ hooks/useDesignArea.js                         → 已移至共享庫
✓ components/NotificationMessage.jsx             → 已移至共享庫
✓ components/DesignAreaPreview.jsx               → 已移至共享庫
✓ components/BleedAreaSettings.jsx               → 已移至共享庫
```

### 路徑: `packages/admin-app/src/utils/`

```
✓ bleedAreaUtils.js                              → 已移至共享庫
```

### 路徑: `packages/admin-app/src/pages/Products/`

```
✓ ProductMaintenance.OLD.jsx                     → 舊版主組件（1,971 行）
```

---

## 📋 Customer App - 可刪除檔案

### 路徑: `packages/customer-app/src/pages/Admin/`

```
✓ ProductMaintenance.OLD.jsx                     → 舊版主組件（2,116 行）
```

**注意**: Customer App 原本沒有獨立的 hooks/components/utils，所有邏輯都在主組件中，因此只需刪除舊版主組件。

---

## 🗑️ 刪除命令

### Windows (PowerShell)

```powershell
# Admin App - 刪除本地 hooks
Remove-Item -Path "C:\WorkShop\ClaudeCode\MonKind\packages\admin-app\src\pages\Products\hooks" -Recurse -Force

# Admin App - 刪除本地 components
Remove-Item -Path "C:\WorkShop\ClaudeCode\MonKind\packages\admin-app\src\pages\Products\components" -Recurse -Force

# Admin App - 刪除本地 utils
Remove-Item -Path "C:\WorkShop\ClaudeCode\MonKind\packages\admin-app\src\utils\bleedAreaUtils.js" -Force

# Admin App - 刪除舊版主組件（如果已建立備份）
Remove-Item -Path "C:\WorkShop\ClaudeCode\MonKind\packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx" -Force

# Customer App - 刪除舊版主組件（如果已建立備份）
Remove-Item -Path "C:\WorkShop\ClaudeCode\MonKind\packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx" -Force
```

### Linux / macOS (Bash)

```bash
# Admin App - 刪除本地 hooks
rm -rf packages/admin-app/src/pages/Products/hooks/

# Admin App - 刪除本地 components
rm -rf packages/admin-app/src/pages/Products/components/

# Admin App - 刪除本地 utils
rm packages/admin-app/src/utils/bleedAreaUtils.js

# Admin App - 刪除舊版主組件（如果已建立備份）
rm packages/admin-app/src/pages/Products/ProductMaintenance.OLD.jsx

# Customer App - 刪除舊版主組件（如果已建立備份）
rm packages/customer-app/src/pages/Admin/ProductMaintenance.OLD.jsx
```

---

## ✅ 刪除前檢查清單

在執行刪除之前，請確認：

- [ ] 已完成功能測試（參考 REFACTOR_COMPLETE_SUMMARY.md 中的測試清單）
- [ ] 新版本在 Admin App 中運作正常
- [ ] 新版本在 Customer App 中運作正常
- [ ] 所有團隊成員已了解新架構
- [ ] 已建立舊版本備份（.OLD.jsx 檔案）
- [ ] 已在開發環境測試至少 2-3 天
- [ ] 已確認沒有其他檔案引用這些即將刪除的檔案

---

## 🔍 確認沒有其他引用

在刪除前，建議搜尋是否有其他檔案引用這些即將刪除的檔案：

```powershell
# 搜尋是否有檔案引用本地 hooks
Get-ChildItem -Path "C:\WorkShop\ClaudeCode\MonKind\packages" -Recurse -Include *.jsx,*.js,*.ts,*.tsx | Select-String -Pattern "from ['\"].*\/hooks\/useNotification" | Select-Object -ExpandProperty Path -Unique

Get-ChildItem -Path "C:\WorkShop\ClaudeCode\MonKind\packages" -Recurse -Include *.jsx,*.js,*.ts,*.tsx | Select-String -Pattern "from ['\"].*\/hooks\/useDesignArea" | Select-Object -ExpandProperty Path -Unique

# 搜尋是否有檔案引用本地 components
Get-ChildItem -Path "C:\WorkShop\ClaudeCode\MonKind\packages" -Recurse -Include *.jsx,*.js,*.ts,*.tsx | Select-String -Pattern "from ['\"].*\/components\/NotificationMessage" | Select-Object -ExpandProperty Path -Unique

# 搜尋是否有檔案引用 bleedAreaUtils
Get-ChildItem -Path "C:\WorkShop\ClaudeCode\MonKind\packages" -Recurse -Include *.jsx,*.js,*.ts,*.tsx | Select-String -Pattern "from ['\"].*bleedAreaUtils" | Select-Object -ExpandProperty Path -Unique
```

---

## 📊 刪除後節省的空間

```
舊版檔案總計:
- Admin App (主組件): 1,971 行
- Admin App (hooks): ~260 行
- Admin App (components): ~370 行
- Admin App (utils): ~220 行
- Customer App (主組件): 2,116 行

總計刪除: ~4,937 行

新版檔案總計:
- Admin App: 384 行
- Customer App: 478 行
- 共享庫: 642 行

總計保留: 1,504 行

淨節省: 3,433 行 (約 70%)
```

---

## 🎯 刪除後的檔案結構

### Admin App

```
packages/admin-app/src/pages/Products/
└── ProductMaintenance.jsx                       ← 新版（384 行）
```

### Customer App

```
packages/customer-app/src/pages/Admin/
└── ProductMaintenance.jsx                       ← 新版（478 行）
```

### 共享庫

```
packages/shared/components/ProductMaintenance/
├── index.js
├── config.js
├── USAGE.md
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

---

## 🔄 如果需要回滾

如果發現問題需要回滾到舊版本：

```powershell
# 恢復 Admin App 舊版本
Copy-Item -Path "C:\WorkShop\ClaudeCode\MonKind\packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx" -Destination "C:\WorkShop\ClaudeCode\MonKind\packages\admin-app\src\pages\Products\ProductMaintenance.jsx" -Force

# 恢復 Customer App 舊版本
Copy-Item -Path "C:\WorkShop\ClaudeCode\MonKind\packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx" -Destination "C:\WorkShop\ClaudeCode\MonKind\packages\customer-app\src\pages\Admin\ProductMaintenance.jsx" -Force
```

---

**建立時間**: 2025-11-12
**用途**: ProductMaintenance 重構專案 - 舊檔案清理指南
