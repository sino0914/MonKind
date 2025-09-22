# 預覽圖生成系統使用說明

## 概述

我們建立了一個模組化的預覽圖生成系統，可以根據版型資料自動生成預覽圖片。

## 核心模組

### 1. TemplatePreviewGenerator.js
- **功能**：使用 Canvas API 生成版型預覽圖
- **特色**：
  - 支援文字和圖片元素渲染
  - 考慮商品設計區域限制
  - 支援元素旋轉和縮放
  - 生成 base64 圖片資料

### 2. ProductDataManager.js
- **功能**：統一管理商品和版型資料，提供快取機制
- **特色**：
  - 智能快取（5分鐘有效期）
  - 批次預覽圖生成
  - 自動處理商品設計區域
  - 記憶體使用量監控

### 3. TemplatePreview.jsx (React 組件)
- **功能**：可重用的預覽圖顯示組件
- **特色**：
  - 懶載入支援
  - 載入狀態顯示
  - 錯誤重試機制
  - 三種尺寸選項（small, medium, large）

## 使用方法

### 基本用法
```javascript
import { generateTemplateThumbnail } from '../../utils/TemplatePreviewGenerator';
import { getTemplatesWithPreviews } from '../../utils/ProductDataManager';
import TemplatePreview from '../../components/Template/TemplatePreview';

// 方法一：直接生成預覽圖
const previewUrl = await generateTemplateThumbnail(template, product);

// 方法二：獲取帶預覽圖的版型列表
const templatesWithPreviews = await getTemplatesWithPreviews(productId);

// 方法三：在 React 組件中使用
<TemplatePreview
  template={template}
  product={product}
  size="medium"
/>
```

### 在版型管理中的應用
版型管理頁面現在會：
1. 自動為所有版型生成預覽圖
2. 支援按商品篩選並生成對應預覽圖
3. 提供載入進度提示
4. 使用快取提升性能

## 性能考量

- **快取機制**：避免重複生成相同預覽圖
- **批次處理**：同時處理多個版型，減少 API 呼叫
- **懶載入**：只在需要時生成預覽圖
- **記憶體管理**：定期清理快取，避免記憶體洩漏

## 後續擴展

這個系統設計為模組化，可以輕鬆擴展到：
- 前台版型選擇頁面
- 商品詳情頁的版型預覽
- 用戶作品庫
- 版型搜索結果展示

## 注意事項

1. 首次載入可能較慢（需要生成預覽圖）
2. 圖片元素需要支援 CORS
3. Canvas 渲染有瀏覽器相容性考量
4. 大量版型會消耗較多記憶體