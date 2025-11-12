# 問題排查與修復記錄

## 2025-11-12 修復記錄

### ❌ 問題: Module not found - ProductMaintenance

**錯誤訊息**:
```
ERROR in ./src/pages/Admin/ProductMaintenance.jsx 9:0-142

Module not found: Error: Package path ./components/ProductMaintenance is not exported from package
C:\\WorkShop\\ClaudeCode\\MonKind\\packages\\customer-app\\node_modules\\@monkind\\shared
(see exports field in package.json)
```

**原因分析**:
`@monkind/shared` 的 `package.json` 中缺少 `ProductMaintenance` 組件的導出配置。

**解決方案**:

1. **修改 `packages/shared/package.json`**

   在 `exports` 欄位中添加:
   ```json
   "./components/ProductMaintenance": "./components/ProductMaintenance/index.js"
   ```

   完整的 exports 應為:
   ```json
   "exports": {
     "./components/GLBViewer": "./components/GLBViewer/index.js",
     "./components/UVMapper": "./components/UVMapper/index.js",
     "./components/Editor": "./components/Editor/index.js",
     "./components/Editor/utils": "./components/Editor/utils/index.js",
     "./components/Preview": "./components/Preview/index.js",
     "./components/Preview/ProductThumbnail": "./components/Preview/ProductThumbnail.jsx",
     "./components/ProductMaintenance": "./components/ProductMaintenance/index.js",  // ← 新增
     "./services/api": "./services/index.js",
     "./utils": "./utils/index.js"
   }
   ```

2. **重新安裝依賴**

   ```bash
   pnpm install
   ```

3. **重啟開發伺服器**

   ```bash
   # 如果正在運行，先停止再重啟
   pnpm dev:admin
   # 或
   pnpm dev:customer
   ```

**狀態**: ✅ 已修復

---

### ❌ 問題 2: Conflicting star exports for 'validateBleedArea'

**錯誤訊息**:
```
ERROR in ../shared/components/ProductMaintenance/index.js 41:0-39
The requested module './utils/bleedAreaUtils' contains conflicting star exports
for the name 'validateBleedArea' with the previous requested module './utils/validationHelpers'
```

**原因分析**:
`validationHelpers.js` 和 `bleedAreaUtils.js` 兩個檔案都導出了名為 `validateBleedArea` 的函數，造成命名衝突。

**解決方案**:

將 `bleedAreaUtils.js` 中的 `validateBleedArea` 重命名為 `checkBleedAreaBounds`，以避免衝突。

**修改檔案**: `packages/shared/components/ProductMaintenance/utils/bleedAreaUtils.js`

```javascript
// ❌ 修改前
export const validateBleedArea = (printArea, bleedArea, canvasSize = 400) => {
  // ...
};

// ✅ 修改後
export const checkBleedAreaBounds = (printArea, bleedArea, canvasSize = 400) => {
  // ...
};
```

**函數職責說明**:
- `validationHelpers.js` 的 `validateBleedArea`: 完整驗證，包括數值範圍檢查
- `bleedAreaUtils.js` 的 `checkBleedAreaBounds`: 僅檢查邊界，用於內部計算

**狀態**: ✅ 已修復

---

## 其他可能的問題與解決方案

### 問題: 導入路徑不正確

**症狀**:
```javascript
// ❌ 錯誤
import { useProductMaintenance } from '@monkind/shared/ProductMaintenance';

// ❌ 錯誤
import { useProductMaintenance } from '@monkind/shared/components/ProductMaintenance/index';
```

**正確用法**:
```javascript
// ✅ 正確
import { useProductMaintenance } from '@monkind/shared/components/ProductMaintenance';
```

---

### 問題: pnpm 快取問題

**症狀**:
- 修改了 package.json 但沒有生效
- 導入仍然報錯

**解決方案**:
```bash
# 清除 pnpm 快取
pnpm store prune

# 刪除 node_modules 和重新安裝
rm -rf node_modules
pnpm install

# 或使用 pnpm clean（如果有配置）
pnpm clean && pnpm install
```

---

### 問題: TypeScript 類型錯誤

**症狀**:
```
Cannot find module '@monkind/shared/components/ProductMaintenance' or its corresponding type declarations.
```

**解決方案**:

1. 如果使用 TypeScript，需要添加類型聲明檔案:
   ```typescript
   // packages/shared/components/ProductMaintenance/index.d.ts
   export * from './hooks/useProductMaintenance';
   export * from './hooks/useDesignArea';
   export * from './hooks/useNotification';
   // ... 其他導出
   ```

2. 或在 `package.json` 中添加 types 欄位:
   ```json
   "exports": {
     "./components/ProductMaintenance": {
       "types": "./components/ProductMaintenance/index.d.ts",
       "default": "./components/ProductMaintenance/index.js"
     }
   }
   ```

---

### 問題: 熱重載(HMR)不生效

**症狀**:
- 修改共享組件後，應用沒有自動更新
- 需要手動重啟伺服器

**解決方案**:

1. **檢查 Vite 配置** (`vite.config.js`):
   ```javascript
   export default defineConfig({
     server: {
       watch: {
         // 監視 shared package 的變更
         ignored: ['!**/node_modules/@monkind/shared/**']
       }
     }
   });
   ```

2. **使用 pnpm link 替代**:
   ```bash
   cd packages/shared
   pnpm link --global

   cd ../admin-app
   pnpm link --global @monkind/shared
   ```

---

### 問題: React 重複打包

**症狀**:
```
Warning: Invalid hook call. Hooks can only be called inside of the body of a function component.
```

**原因**:
shared package 和應用都打包了自己的 React，導致有多個 React 實例。

**解決方案**:

1. **確保 React 為 peerDependencies** (已正確配置):
   ```json
   // packages/shared/package.json
   "peerDependencies": {
     "react": "^18.0.0 || ^19.0.0",
     "react-dom": "^18.0.0 || ^19.0.0"
   }
   ```

2. **Vite 配置 resolve.dedupe**:
   ```javascript
   // vite.config.js
   export default defineConfig({
     resolve: {
       dedupe: ['react', 'react-dom']
     }
   });
   ```

---

### 問題: 找不到 CSS/Tailwind 樣式

**症狀**:
- 組件渲染但沒有樣式
- Tailwind class 不生效

**解決方案**:

1. **確保 Tailwind 掃描共享組件**:
   ```javascript
   // tailwind.config.js
   module.exports = {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
       "./node_modules/@monkind/shared/**/*.{js,jsx,ts,tsx}",  // ← 添加這行
     ],
   };
   ```

2. **檢查 PostCSS 配置**:
   ```javascript
   // postcss.config.js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```

---

### 問題: 開發環境正常，生產環境錯誤

**症狀**:
- `pnpm dev` 正常運作
- `pnpm build` 後運行出錯

**解決方案**:

1. **檢查環境變數**:
   ```bash
   # 確保生產環境變數正確
   NODE_ENV=production
   ```

2. **檢查 build 輸出**:
   ```bash
   pnpm build
   # 檢查 dist/ 目錄中是否包含所有必要檔案
   ```

3. **使用 preview 測試**:
   ```bash
   pnpm build
   pnpm preview
   ```

---

## 預防措施

### 1. 新增共享組件時的檢查清單

當添加新的共享組件時，確保完成以下步驟:

- [ ] 在 `packages/shared/components/` 建立組件目錄
- [ ] 建立 `index.js` 導出檔案
- [ ] 更新 `packages/shared/package.json` 的 `exports` 欄位
- [ ] 執行 `pnpm install` 更新依賴
- [ ] 測試導入是否正常
- [ ] 如使用 TypeScript，添加 `.d.ts` 類型聲明

### 2. 測試共享組件

```javascript
// 快速測試導入
import {
  useProductMaintenance,
  adminConfig
} from '@monkind/shared/components/ProductMaintenance';

console.log('Import successful:', { useProductMaintenance, adminConfig });
```

### 3. 文檔更新

新增共享組件後，更新相關文檔:
- `HOOKS_AND_UTILS_INDEX.md`
- 組件專屬的 `USAGE.md`
- `README.md`

---

## 常用診斷命令

```bash
# 檢查 package 導出配置
cat packages/shared/package.json | grep -A 20 "exports"

# 檢查 pnpm workspace 連結
pnpm list -r --depth 0

# 清除並重新安裝
pnpm clean-install

# 檢查 node_modules 中的實際檔案
ls -la node_modules/@monkind/shared/components/

# 查看 pnpm 解析路徑
pnpm why @monkind/shared
```

---

## 聯繫與支援

如遇到其他問題:
1. 查看 `FAQ_AND_SOLUTIONS.md`
2. 檢查 `MIGRATION_COMPLETE.md` 中的故障排查章節
3. 參考相關組件的 `USAGE.md`

---

**文檔版本**: 1.0.0
**最後更新**: 2025-11-12
**維護者**: MonKind Team
