# 重構計劃：Monorepo 架構

## 目錄
1. [當前狀況](#當前狀況)
2. [共用組件清單](#共用組件清單)
3. [為什麼需要 Monorepo](#為什麼需要-monorepo)
4. [目標架構](#目標架構)
5. [遷移步驟](#遷移步驟)
6. [使用方式](#使用方式)
7. [參考資源](#參考資源)

---

## 當前狀況

目前專案採用**完全獨立**的前後台分離架構：

```
MonKind/
├── my-react-app/          # 前台客戶應用
└── gwgw-gift-admin/       # 後台管理應用
```

### 問題點
- **組件重複**：GLBViewer、UVMapper 等組件在兩個專案中各有一份副本
- **維護困難**：修改一個共用組件需要在兩處同步修改
- **版本不一致風險**：可能導致前後台使用不同版本的組件
- **API 服務重複**：api.js 等服務也需要複製維護

---

## 共用組件清單

### 目前已知的共用組件（需同步維護）

#### 📦 組件 (Components)
| 組件名稱 | 位置 | 用途 | 文件大小 |
|---------|------|------|---------|
| `GLBViewer.jsx` | `src/components/` | 3D 模型預覽 | ~150 行 |
| `UVMapper.jsx` | `src/components/` | UV 映射配置 | ~200 行 |
| `TemplateThumbnail.jsx` | `src/components/Preview/` | 版型縮圖預覽 | ~100 行 |
| `UniversalEditor.jsx` | `src/components/Editor/` | 統一編輯器 | ~1500+ 行 |

#### 🛠️ 工具 (Utils)
| 文件名稱 | 位置 | 用途 |
|---------|------|------|
| `ProductDataManager.js` | `src/utils/` | 產品資料管理 |
| `test-preview.js` | `src/` | 預覽圖測試工具 |

#### 🌐 服務 (Services)
| 文件名稱 | 位置 | 用途 |
|---------|------|------|
| `api.js` | `src/services/` | API 統一接口 |

### ⚠️ 維護注意事項
如果修改以上任何文件，需要：
1. 在 `my-react-app` 中修改
2. 複製到 `gwgw-gift-admin` 中
3. 測試兩邊功能是否正常

---

## 為什麼需要 Monorepo

### 優點
✅ **單一事實來源**：共用代碼只維護一份
✅ **原子性提交**：同時更新多個專案，確保版本一致
✅ **更好的代碼重用**：輕鬆分享組件、工具、配置
✅ **統一依賴管理**：共用依賴只需安裝一次
✅ **更容易重構**：IDE 支援跨專案重構
✅ **CI/CD 優化**：只構建有變更的專案

### 業界案例
- Google、Facebook、Microsoft 都使用 Monorepo
- React、Vue、Angular 等開源專案也採用 Monorepo

---

## 目標架構

### 推薦方案：pnpm workspaces

```
MonKind/
├── packages/
│   ├── shared/                      # 共用套件
│   │   ├── components/              # 共用 React 組件
│   │   │   ├── GLBViewer/
│   │   │   │   ├── GLBViewer.jsx
│   │   │   │   ├── index.js
│   │   │   │   └── README.md
│   │   │   ├── UVMapper/
│   │   │   │   ├── UVMapper.jsx
│   │   │   │   └── index.js
│   │   │   ├── Editor/
│   │   │   │   ├── UniversalEditor.jsx
│   │   │   │   └── index.js
│   │   │   └── Preview/
│   │   │       ├── TemplateThumbnail.jsx
│   │   │       └── index.js
│   │   ├── services/                # API 服務
│   │   │   ├── api.js
│   │   │   └── index.js
│   │   ├── utils/                   # 工具函數
│   │   │   ├── ProductDataManager.js
│   │   │   └── index.js
│   │   ├── package.json
│   │   └── README.md
│   ├── customer-app/                # 前台（原 my-react-app）
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Products/
│   │   │   │   ├── Cart/
│   │   │   │   ├── MyWorks/
│   │   │   │   └── Editor/
│   │   │   ├── components/         # 前台專屬組件
│   │   │   └── App.js
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   └── admin-app/                   # 後台（原 gwgw-gift-admin）
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Dashboard/
│       │   │   ├── Vendors/
│       │   │   └── Admin/
│       │   ├── components/         # 後台專屬組件
│       │   │   └── Layout.js
│       │   └── App.js
│       ├── package.json
│       └── README.md
├── package.json                     # Root workspace 配置
├── pnpm-workspace.yaml              # Workspace 定義
├── .gitignore
└── README.md                        # 整體專案說明
```

---

## 遷移步驟

### 步驟 1：準備工作
```bash
# 安裝 pnpm（如果還沒有）
npm install -g pnpm

# 備份現有專案
cd C:\WorkShop\ClaudeCode\MonKind
git add .
git commit -m "Backup before Monorepo migration"
git tag backup-before-monorepo
```

### 步驟 2：創建 Monorepo 結構
```bash
# 創建新的目錄結構
mkdir -p packages/shared/components
mkdir -p packages/shared/services
mkdir -p packages/shared/utils
mkdir -p packages/customer-app
mkdir -p packages/admin-app
```

### 步驟 3：設置 Root Workspace

**創建 `package.json`**：
```json
{
  "name": "monkind-workspace",
  "version": "1.0.0",
  "private": true,
  "description": "MonKind 電商平台 Monorepo",
  "scripts": {
    "dev:customer": "pnpm --filter customer-app dev",
    "dev:admin": "pnpm --filter admin-app dev",
    "dev:all": "pnpm --parallel --filter customer-app --filter admin-app dev",
    "build:customer": "pnpm --filter customer-app build",
    "build:admin": "pnpm --filter admin-app build",
    "build:all": "pnpm --parallel --filter customer-app --filter admin-app build",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint"
  },
  "workspaces": [
    "packages/*"
  ]
}
```

**創建 `pnpm-workspace.yaml`**：
```yaml
packages:
  - 'packages/*'
```

### 步驟 4：設置 Shared Package

**創建 `packages/shared/package.json`**：
```json
{
  "name": "@monkind/shared",
  "version": "1.0.0",
  "main": "index.js",
  "exports": {
    "./components/GLBViewer": "./components/GLBViewer/index.js",
    "./components/UVMapper": "./components/UVMapper/index.js",
    "./components/UniversalEditor": "./components/Editor/index.js",
    "./components/TemplateThumbnail": "./components/Preview/index.js",
    "./services/api": "./services/index.js",
    "./utils": "./utils/index.js"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### 步驟 5：移動共用組件

```bash
# 移動組件到 shared
cp my-react-app/src/components/GLBViewer.jsx packages/shared/components/GLBViewer/GLBViewer.jsx
cp my-react-app/src/components/UVMapper.jsx packages/shared/components/UVMapper/UVMapper.jsx
cp -r my-react-app/src/components/Editor packages/shared/components/
cp -r my-react-app/src/components/Preview packages/shared/components/

# 移動服務
cp my-react-app/src/services/api.js packages/shared/services/api.js

# 移動工具
cp my-react-app/src/utils/ProductDataManager.js packages/shared/utils/ProductDataManager.js
```

### 步驟 6：創建 Index 文件

**`packages/shared/components/GLBViewer/index.js`**：
```javascript
export { default } from './GLBViewer';
```

**`packages/shared/services/index.js`**：
```javascript
export * from './api';
```

### 步驟 7：移動專案

```bash
# 移動前台
mv my-react-app/* packages/customer-app/

# 移動後台
mv gwgw-gift-admin/* packages/admin-app/
```

### 步驟 8：更新 Import 路徑

**在 `packages/customer-app` 和 `packages/admin-app` 中：**

替換所有 import：
```javascript
// 舊的 import
import GLBViewer from '../../components/GLBViewer';
import { API } from '../../services/api';

// 新的 import
import GLBViewer from '@monkind/shared/components/GLBViewer';
import { API } from '@monkind/shared/services/api';
```

### 步驟 9：更新 package.json

**`packages/customer-app/package.json`**：
```json
{
  "name": "customer-app",
  "dependencies": {
    "@monkind/shared": "workspace:*",
    "react": "^18.2.0",
    ...
  }
}
```

**`packages/admin-app/package.json`**：
```json
{
  "name": "admin-app",
  "dependencies": {
    "@monkind/shared": "workspace:*",
    "react": "^18.2.0",
    ...
  }
}
```

### 步驟 10：安裝依賴

```bash
# 在 root 目錄執行
pnpm install
```

### 步驟 11：測試

```bash
# 測試前台
pnpm dev:customer

# 測試後台（新終端）
pnpm dev:admin

# 同時啟動（新終端）
pnpm dev:all
```

---

## 使用方式

### 日常開發

```bash
# 啟動前台開發服務器
pnpm dev:customer

# 啟動後台開發服務器
pnpm dev:admin

# 同時啟動前後台
pnpm dev:all

# 建構生產版本
pnpm build:all
```

### 修改共用組件

```bash
# 1. 修改 shared 組件
code packages/shared/components/GLBViewer/GLBViewer.jsx

# 2. 保存後，前後台會自動 hot reload
# 3. 提交一次，兩邊同步更新
git add packages/shared
git commit -m "Update GLBViewer component"
```

### 新增共用組件

```bash
# 1. 在 shared 中創建新組件
mkdir packages/shared/components/NewComponent
code packages/shared/components/NewComponent/NewComponent.jsx

# 2. 創建 index.js
echo "export { default } from './NewComponent';" > packages/shared/components/NewComponent/index.js

# 3. 更新 shared/package.json exports
# 添加：
# "./components/NewComponent": "./components/NewComponent/index.js"

# 4. 在前台或後台使用
# import NewComponent from '@monkind/shared/components/NewComponent';
```

---

## 參考資源

### 工具選擇
- **pnpm workspaces**（推薦）：輕量、快速、節省磁碟空間
- **Turborepo**：更強大的構建緩存和任務編排
- **Nx**：企業級，功能最全面

### 學習資源
- [pnpm Workspaces 文檔](https://pnpm.io/workspaces)
- [Monorepo 最佳實踐](https://monorepo.tools/)
- [Turborepo 官方文檔](https://turbo.build/repo/docs)

### 時間估算
- 準備和設置：1-2 小時
- 移動和重構：2-3 小時
- 測試和修正：1-2 小時
- **總計：約 4-7 小時**

---

## 常見問題

### Q: 會影響現有功能嗎？
A: 不會。只是改變了代碼組織方式，功能完全一致。

### Q: 可以逐步遷移嗎？
A: 可以。可以先創建 shared package，逐個移動組件。

### Q: 部署會變複雜嗎？
A: 不會。每個 app 仍然獨立構建和部署。

### Q: 是否一定要現在重構？
A: 不一定。可以等到：
- 共用組件增加到 5+ 個
- 經常需要同步修改組件
- 團隊成員增加時

---

## 檢查清單

在開始重構前，請確認：

- [ ] 已完整備份當前代碼（git tag）
- [ ] 所有功能測試通過
- [ ] 已安裝 pnpm（或選擇其他工具）
- [ ] 團隊成員都了解 Monorepo 概念
- [ ] 預留足夠時間進行遷移（建議週末）
- [ ] 準備好回滾方案（保留 backup tag）

---

最後更新：2025-10-14
