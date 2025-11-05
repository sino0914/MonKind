# MonKind 專案說明

## 專案結構概覽

MonKind 專案採用 Monorepo 架構，所有應用統一管理：

### 專案目錄
- `packages/admin-app/` - 管理後台應用
- `packages/customer-app/` - 客戶端應用
- `packages/shared/` - 共用元件與服務

詳細的 Monorepo 遷移說明請參考 `MONOREPO_MIGRATION.md`

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
