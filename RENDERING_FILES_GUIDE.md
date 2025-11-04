# 渲染元素檔案指南

> **目的**: 記錄所有會渲染設計元素的檔案，確保未來修改渲染邏輯時（如添加新屬性）能夠快速找到所有需要更新的位置。

**最後更新**: 2025-11-04
**版本**: 1.0

---

## 📋 檔案清單總覽

| 檔案 | 優先級 | 功能 | scaleX/scaleY 支援 |
|------|--------|------|-------------------|
| DesignElementsLayer.jsx | P0 | 編輯器元素渲染層 | ✅ 已支援 |
| ProductPreview.jsx | P0 | 商品預覽（2D/3D） | ✅ 已支援 |
| snapshot3D.js | P0 | 3D 快照生成 | ✅ 已支援 |
| snapshot2D.js | P0 | 2D 快照生成 | ✅ 已支援 |
| ProductThumbnail.jsx | P1 | 商品縮圖 | ✅ 已支援 |
| canvasUtils.js | P1 | Canvas 工具（輸出/列印） | ✅ 已支援 |
| TemplatePreviewGenerator.js | P2 | 版型預覽生成 | ✅ 已支援 |
| TemplateThumbnail.jsx | - | 版型縮圖 | ℹ️ 間接支援（透過 ProductThumbnail） |

---

## 🔴 P0 - 核心渲染檔案

### 1. DesignElementsLayer.jsx
**路徑**: `packages/shared/components/Editor/components/DesignElementsLayer.jsx`

**功能**: 編輯器中的設計元素渲染層，負責即時顯示所有圖片和文字元素

**渲染位置**:
- **有蒙版的圖片** (第 124-259 行)
  - 使用 CSS transform scale
  - 根據 scaleX !== scaleY 判斷使用 fill 或 cover
- **無蒙版的圖片** (第 260-295 行)
  - 相同的 scale 和 objectFit 邏輯

**關鍵邏輯**:
```jsx
transform: `rotate(${element.rotation || 0}deg) scale(${element.scaleX || 1}, ${element.scaleY || 1})`
objectFit: (element.scaleX && element.scaleY && element.scaleX !== element.scaleY) ? 'fill' : 'cover'
```

**注意事項**:
- 這是最重要的檔案，用戶在編輯器中看到的就是這裡的渲染結果
- 任何元素屬性的變更都應該在這裡測試

---

### 2. ProductPreview.jsx
**路徑**: `packages/shared/components/Preview/ProductPreview.jsx`

**功能**: 商品預覽組件，支援 2D 平面和 3D 模型預覽

**渲染位置**:

#### A. Canvas UV 貼圖生成（3D 渲染）
- **位置**: 第 190-275 行
- **邏輯**:
  ```javascript
  const baseW = el.width || 100;
  const baseH = el.height || 100;
  const w = baseW * (el.scaleX || 1);
  const h = baseH * (el.scaleY || 1);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ```

#### B. 2D 預覽圖片渲染
- **位置**: 第 488-594 行
- **邏輯**:
  ```jsx
  transform: `translate(-50%, -50%) scale(${element.scaleX || 1}, ${element.scaleY || 1})`
  // 內部圖片 transform
  transform: `rotate(${element.rotation || 0}deg)`
  objectFit: (element.scaleX && element.scaleY && element.scaleX !== element.scaleY) ? 'fill' : 'cover'
  ```

**注意事項**:
- UV 貼圖生成影響 3D 模型的貼圖顯示
- 2D 和 3D 的渲染邏輯必須保持一致

---

### 3. snapshot3D.js
**路徑**: `packages/shared/components/Editor/utils/snapshot3D.js`

**功能**: 生成 3D 商品快照，用於購物車、訂單、草稿保存

**渲染位置**:
- **generateUVTexture 函數** (第 94-190 行)

**關鍵邏輯**:
```javascript
const baseW = el.width || 100;
const baseH = el.height || 100;
const w = baseW * (el.scaleX || 1);
const h = baseH * (el.scaleY || 1);
ctx.drawImage(img, -w / 2, -h / 2, w, h);
```

**使用場景**:
- 保存草稿時生成預覽圖
- 加入購物車時生成快照
- 訂單確認頁面顯示

**注意事項**:
- 必須與 ProductPreview 的 UV 生成邏輯保持一致
- 這個快照會被保存到資料庫，影響長期顯示

---

### 4. snapshot2D.js
**路徑**: `packages/shared/components/Editor/utils/snapshot2D.js`

**功能**: 生成 2D 商品快照

**渲染位置**:

#### A. 有旋轉的圖片繪製
- **位置**: 第 172-229 行
- **邏輯**:
  ```javascript
  const baseWidth = (element.width || 100) * scale;
  const baseHeight = (element.height || 100) * scale;
  const imgWidth = baseWidth * (element.scaleX || 1);
  const imgHeight = baseHeight * (element.scaleY || 1);
  ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
  ```

#### B. 無旋轉的圖片繪製
- **位置**: 第 230-283 行
- **相同邏輯**

**使用場景**:
- 2D 商品的快照生成
- 與 snapshot3D.js 互補（根據商品類型選擇）

---

## 🟡 P1 - 輔助渲染檔案

### 5. ProductThumbnail.jsx
**路徑**: `packages/shared/components/Preview/ProductThumbnail.jsx`

**功能**: 輕量級商品縮圖，用於列表快速預覽

**渲染位置**:
- **圖片元素渲染** (第 144-177 行)

**關鍵邏輯**:
```jsx
transform: `translate(-50%, -50%) scale(${element.scaleX || 1}, ${element.scaleY || 1})`
objectFit: (element.scaleX && element.scaleY && element.scaleX !== element.scaleY) ? 'fill' : 'cover'
```

**使用場景**:
- 購物車列表
- 我的作品列表
- 訂單列表

**注意事項**:
- 性能優化版的預覽組件
- 不支援 3D 渲染，只有 2D 顯示

---

### 6. canvasUtils.js
**路徑**: `packages/shared/components/Editor/utils/canvasUtils.js`

**功能**: Canvas 相關工具函數集合

**渲染位置**:

#### A. exportDesignToImage 函數
- **位置**: 第 99-191 行
- **功能**: 輸出設計區域為圖片檔案

#### B. generatePrintFile 函數
- **位置**: 第 299-389 行
- **功能**: 生成高解析度列印檔案

**關鍵邏輯**:
```javascript
const baseWidth = element.width || 100;
const baseHeight = element.height || 100;
const imgWidth = baseWidth * (element.scaleX || 1);
const imgHeight = baseHeight * (element.scaleY || 1);
ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
```

**使用場景**:
- 用戶下載設計
- 生成列印用高解析度檔案

---

## 🟢 P2 - 其他渲染檔案

### 7. TemplatePreviewGenerator.js
**路徑**: `packages/shared/utils/TemplatePreviewGenerator.js`

**功能**: 版型預覽圖生成器

**渲染位置**:
- **drawImageElement 函數** (第 191-241 行)

**關鍵邏輯**:
```javascript
const displayWidth = element.width || 50;
const displayHeight = element.height || 50;
const elementScaleX = element.scaleX || 1;
const elementScaleY = element.scaleY || 1;
const previewWidth = displayWidth * scaleX * elementScaleX;
const previewHeight = displayHeight * scaleY * elementScaleY;
```

**注意事項**:
- 需要區分「預覽縮放」和「元素自由變形」
- scaleX/scaleY 參數有兩層意義

---

### 8. TemplateThumbnail.jsx
**路徑**: `packages/shared/components/Preview/TemplateThumbnail.jsx`

**功能**: 版型縮圖組件

**渲染方式**: 內部使用 `ProductThumbnail` 組件

**無需直接修改**: 依賴 ProductThumbnail 的修改自動支援

---

## 🛠️ 核心修改模式

### Canvas 繪製邏輯

```javascript
// ❌ 舊邏輯（不支援自由變形）
const w = element.width || 100;
const h = element.height || 100;
ctx.drawImage(img, x, y, w, h);

// ✅ 新邏輯（支援自由變形）
const baseW = element.width || 100;
const baseH = element.height || 100;
const scaleX = element.scaleX || 1;
const scaleY = element.scaleY || 1;
const w = baseW * scaleX;
const h = baseH * scaleY;
ctx.drawImage(img, x, y, w, h);
```

### CSS 渲染邏輯

```jsx
// ❌ 舊邏輯
<div style={{
  width: `${element.width}px`,
  height: `${element.height}px`,
  transform: "translate(-50%, -50%)",
}}>
  <img style={{
    objectFit: 'cover'
  }} />
</div>

// ✅ 新邏輯
<div style={{
  width: `${element.width}px`,
  height: `${element.height}px`,
  transform: `translate(-50%, -50%) scale(${element.scaleX || 1}, ${element.scaleY || 1})`,
}}>
  <img style={{
    objectFit: (element.scaleX && element.scaleY && element.scaleX !== element.scaleY)
      ? 'fill'  // 自由拉伸時使用 fill
      : 'cover' // 等比例或無變形時使用 cover
  }} />
</div>
```

### objectFit 判斷邏輯

```javascript
/**
 * 根據 scaleX 和 scaleY 判斷使用哪種 objectFit
 * - 如果 scaleX !== scaleY，表示非等比例拉伸，使用 'fill' 讓圖片填滿容器
 * - 否則使用 'cover' 保持圖片比例
 */
const objectFit = (element.scaleX && element.scaleY && element.scaleX !== element.scaleY)
  ? 'fill'
  : 'cover';
```

---

## 🧪 測試檢查清單

### 編輯器測試
- [ ] 在編輯器中啟用自由變形，拉伸圖片
- [ ] 預覽區域顯示正確
- [ ] 旋轉 + 自由變形組合正確

### 快照測試
- [ ] 保存草稿，重新載入後預覽圖正確
- [ ] 加入購物車，購物車中的預覽圖正確
- [ ] 2D 商品快照正確
- [ ] 3D 商品快照正確

### 列表顯示測試
- [ ] 購物車列表縮圖正確
- [ ] 我的作品列表縮圖正確
- [ ] 訂單列表縮圖正確

### 輸出測試
- [ ] 輸出設計區域為圖片，變形正確
- [ ] 生成列印檔案，高解析度變形正確

### 蒙版交互測試
- [ ] 有蒙版的圖片 + 自由變形正確
- [ ] 剪裁後替換圖片 + 自由變形正確

---

## 📝 未來新增渲染功能指南

當需要新增元素屬性（如透明度、濾鏡、邊框等）或修改渲染邏輯時，請依照以下步驟：

### 步驟 1：識別渲染類型
- **即時預覽**: 必須修改 `DesignElementsLayer.jsx`
- **快照生成**: 必須修改 `snapshot2D.js` 和 `snapshot3D.js`
- **列表顯示**: 必須修改 `ProductThumbnail.jsx`
- **輸出功能**: 必須修改 `canvasUtils.js`

### 步驟 2：按優先級修改
1. P0 檔案（編輯器、快照）- 立即修改
2. P1 檔案（縮圖、輸出）- 盡快修改
3. P2 檔案（版型生成器）- 可後續修改

### 步驟 3：保持邏輯一致
- Canvas 繪製和 CSS 渲染使用相同的計算邏輯
- 所有檔案對新屬性的處理方式保持一致
- 添加適當的預設值（使用 `|| defaultValue`）

### 步驟 4：全面測試
- 使用上方的測試檢查清單
- 確保所有場景都正確顯示

### 步驟 5：更新本文檔
- 記錄新增的屬性和修改位置
- 更新測試檢查清單
- 更新版本號和日期

---

## 🔍 快速查找

### 我想修改...
- **編輯器顯示** → `DesignElementsLayer.jsx`
- **購物車/訂單預覽** → `ProductPreview.jsx`, `ProductThumbnail.jsx`
- **草稿保存快照** → `snapshot2D.js`, `snapshot3D.js`
- **輸出圖片功能** → `canvasUtils.js`
- **版型預覽** → `TemplatePreviewGenerator.js`

### 我遇到...
- **3D 模型貼圖錯誤** → 檢查 `ProductPreview.jsx` UV 生成和 `snapshot3D.js`
- **購物車顯示錯誤** → 檢查 `ProductThumbnail.jsx`
- **輸出圖片錯誤** → 檢查 `canvasUtils.js`
- **編輯器即時顯示錯誤** → 檢查 `DesignElementsLayer.jsx`

---

## 📚 相關資源

- **元素數據結構**: 參考 `useEditorState.js` 中的 designElements
- **自由變形功能**: 參考 `useFreeTransform.js` 和 `useCanvasInteraction.js`
- **蒙版系統**: 參考 `useImageCrop.js` 和 `CropOverlay.jsx`

---

**維護提醒**: 每次修改渲染邏輯時，請務必更新此文檔，確保團隊成員都能快速找到相關檔案。
