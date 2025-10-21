# MonKind 專案重構記錄

## 專案結構概覽

### 舊程式目錄 (重構前)
- `gwgw-gift-admin/` - 舊版管理後台
- `my-react-app/` - 舊版主應用程式

**重要**: 這兩個目錄保留作為參考,不應修改。重構時可以參考這些舊程式碼。

### 新程式目錄 (重構後)
- `packages/admin-app/` - 新版管理後台 (Monorepo 架構)
- `packages/customer-app/` - 新版客戶端應用
- `packages/shared/` - 共用元件與服務

## 安裝與啟動

使用 pnpm 管理 Monorepo:
```bash
pnpm install           # 安裝所有依賴
pnpm dev:admin         # 啟動管理後台
pnpm dev:customer      # 啟動客戶端
pnpm dev:all           # 同時啟動所有應用
```

## 注意事項

- 舊程式僅供參考,功能實作應在新目錄中進行
- 路由變更時需同步更新所有相關的 navigate 調用
- 共用邏輯應放置在 `packages/shared/` 中
