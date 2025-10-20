# MonKind 電商平台 Monorepo

MonKind 客製化禮品電商平台，採用 Monorepo 架構管理前後台應用及共用組件。

## 🏗️ 專案架構

```
MonKind/
├── packages/
│   ├── shared/              # 共用組件、服務和工具
│   │   ├── components/      # React 組件
│   │   │   ├── GLBViewer/   # 3D 模型預覽
│   │   │   ├── UVMapper/    # UV 映射配置
│   │   │   ├── Editor/      # 統一編輯器
│   │   │   └── Preview/     # 預覽組件
│   │   ├── services/        # API 服務
│   │   └── utils/           # 工具函數
│   ├── customer-app/        # 前台客戶應用
│   └── admin-app/           # 後台管理應用
├── package.json             # Root workspace 配置
├── pnpm-workspace.yaml      # pnpm workspace 定義
└── README.md
```

## 🚀 快速開始

### 前置需求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安裝

```bash
# 1. 安裝 pnpm (如果尚未安裝)
npm install -g pnpm

# 2. Clone 專案後，進入專案目錄
cd MonKind

# 3. 安裝所有依賴 (包含所有 packages 的依賴)
pnpm install

# 4. 初次使用會自動創建必要的資料目錄和初始資料
```

### 預設管理員帳號

初次啟動後台應用時，系統會自動建立預設管理員帳號：

- **帳號 (username):** `admin`
- **密碼:** `admin123`
- **角色:** 管理員

> ⚠️ 生產環境請務必修改預設密碼

### 開發指令

```bash
# 啟動前台開發伺服器
pnpm dev:customer

# 啟動後台開發伺服器 (包含 API server)
pnpm dev:admin

# 同時啟動前後台
pnpm dev:all

# 建構生產版本
pnpm build:customer
pnpm build:admin
pnpm build:all

# 執行測試
pnpm test

# 執行 linting
pnpm lint
```

## 📦 套件說明

### @monkind/shared

共用組件庫，提供前後台共用的 React 組件、API 服務和工具函數。

**主要組件:**
- `GLBViewer`: 3D 模型預覽組件
- `UVMapper`: UV 映射配置工具
- `UniversalEditor`: 統一設計編輯器
- `ProductPreview`: 產品預覽組件
- `TemplateThumbnail`: 版型縮圖預覽

**使用範例:**
```javascript
import GLBViewer from '@monkind/shared/components/GLBViewer';
import { UniversalEditor } from '@monkind/shared/components/Editor';
import { API } from '@monkind/shared/services/api';
```

### customer-app

前台客戶應用，提供產品瀏覽、客製化設計、購物車和訂單管理功能。

**主要功能:**
- 產品展示與搜尋
- 3D/2D 客製化設計編輯器
- 購物車管理
- 訂單查詢
- 我的作品管理

**啟動:** `pnpm dev:customer`
**埠號:** 3000

### admin-app

後台管理應用，提供商品管理、訂單處理、廠商管理等功能。

**主要功能:**
- 商品維護 (含 3D 模型上傳)
- 訂單管理
- 廠商管理
- 版型管理
- 系統設定

**啟動:** `pnpm dev:admin`
**前端埠號:** 3001
**API 埠號:** 3002

## 🔧 技術棧

- **前端框架:** React 19
- **路由:** React Router v7
- **3D 渲染:** Three.js + React Three Fiber
- **樣式:** Tailwind CSS
- **API 後端:** Express.js (admin-app)
- **套件管理:** pnpm workspaces
- **建構工具:** Create React App

## 📝 開發指南

### 修改共用組件

1. 編輯 `packages/shared/components/` 中的組件
2. 保存後，前後台會自動 hot reload
3. 提交一次變更，兩邊同步更新

### 新增共用組件

1. 在 `packages/shared/components/` 建立新組件目錄
2. 建立 `index.js` 導出文件
3. 更新 `packages/shared/package.json` 的 `exports` 欄位
4. 在應用中使用 `@monkind/shared/components/NewComponent` 導入

### Import 規範

- **Shared 組件:** `import { Component } from '@monkind/shared/components/...'`
- **Shared 服務:** `import { API } from '@monkind/shared/services/api'`
- **應用內組件:** 使用相對路徑 `import Component from './Component'`

## 🎯 遷移說明

本專案已從獨立應用架構遷移至 Monorepo 架構:

- ✅ 共用組件統一管理
- ✅ 原子性提交確保版本一致
- ✅ 統一依賴管理
- ✅ 支援跨專案重構

**詳細遷移文檔:** 請參閱 `gwgw-gift-admin/REFACTORING.md`

## 🔧 故障排除

### 後台登入失敗

如果看到「電子郵件或密碼錯誤」或登入失敗：

1. **檢查後端服務是否運行**
   ```bash
   # 在瀏覽器開啟或使用 curl 檢查
   curl http://localhost:3002/api/health
   ```

2. **確認使用正確的登入資訊**
   - 帳號欄位使用 `username` (不是 email)
   - 預設帳號：`admin`
   - 預設密碼：`admin123`

3. **檢查資料庫檔案**
   ```bash
   # 檢查 users.json 是否存在且格式正確
   cat packages/admin-app/server/data/users.json
   ```

4. **重新初始化資料**
   ```bash
   # 刪除舊的資料檔案並重啟
   rm -rf packages/admin-app/server/data/users.json
   pnpm dev:admin
   ```

### 依賴安裝問題

如果 `pnpm install` 失敗：

1. **清理並重新安裝**
   ```bash
   # 清理所有 node_modules 和 lock 檔案
   pnpm clean
   rm -rf node_modules pnpm-lock.yaml

   # 重新安裝
   pnpm install
   ```

2. **檢查 Node.js 和 pnpm 版本**
   ```bash
   node --version   # 應該 >= 18.0.0
   pnpm --version   # 應該 >= 8.0.0
   ```

### 端口被佔用

如果看到端口已被佔用的錯誤：

```bash
# Windows - 查找並終止佔用端口的進程
netstat -ano | findstr "3002"
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3002 | xargs kill -9
```

## 📄 授權

UNLICENSED - MonKind Team 專屬專案

## 🔖 版本

- Monorepo 版本: 1.0.0
- 遷移日期: 2025-10-15
- 備份標籤: `backup-before-monorepo`
