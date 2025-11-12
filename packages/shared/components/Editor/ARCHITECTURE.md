# 編輯器架構文檔

完整的 UniversalEditor 組件架構說明，包含組件層級、Hooks 依賴關係、常見修改場景和快速指引。

## 目錄

- [組件層級結構](#組件層級結構)
- [Hooks 依賴關係](#hooks-依賴關係)
- [工具函數與 Utils](#工具函數與-utils)
- [常見修改場景](#常見修改場景)
- [渲染邏輯說明](#渲染邏輯說明)
- [開發指南](#開發指南)

---

## 組件層級結構

```
UniversalEditor (主編輯器組件)
├── TopToolbar (頂部工具列)
│   ├── topToolbarLeft (左側自定義內容)
│   ├── title (標題)
│   └── topToolbarRight (右側自定義內容)
│
├── ToolSidebar (左側工具面板)
│   ├── TemplatePanel (版型面板)
│   ├── ElementPanel (元素面板)
│   ├── TextPanel (文字面板)
│   ├── ImagePanel (圖片面板)
│   ├── BackgroundPanel (背景面板)
│   └── LayerPanel (圖層面板)
│
└── MainContentArea (主要編輯區域)
    ├── CanvasArea (畫布區域)
    │   ├── DesignElementsLayer (設計元素渲染層)
    │   │   ├── 圖片元素 (支援蒙版、裁剪、旋轉、縮放)
    │   │   └── 文字元素 (支援字型、顏色、對齊、旋轉)
    │   │
    │   ├── TextEditingInput (文字編輯輸入框)
    │   ├── TextToolbar (文字工具列)
    │   ├── ImageFloatingToolbar (圖片浮動工具列)
    │   └── CropOverlay (裁剪遮罩)
    │
    └── Preview (預覽區域 - 2D/3D)
        └── ProductPreview (產品預覽組件)
```

### 組件檔案位置

| 組件 | 檔案路徑 | 說明 |
|------|---------|------|
| UniversalEditor | `components/Editor/UniversalEditor.jsx` | 主編輯器組件 |
| TopToolbar | `components/Editor/components/TopToolbar.jsx` | 頂部工具列 |
| ToolSidebar | `components/Editor/components/ToolSidebar.jsx` | 左側工具面板 |
| MainContentArea | `components/Editor/MainContentArea.jsx` | 主要編輯區域 |
| CanvasArea | `components/Editor/components/CanvasArea.jsx` | 畫布區域 |
| DesignElementsLayer | `components/Editor/components/DesignElementsLayer.jsx` | **核心渲染層** |
| ProductPreview | `components/Preview/ProductPreview.jsx` | 產品預覽 |

**工具面板組件位置**: `components/Editor/components/ToolPanels/`
- `TemplatePanel.jsx` - 版型選擇
- `ElementPanel.jsx` - 元素選擇
- `TextPanel.jsx` - 文字工具
- `ImagePanel.jsx` - 圖片上傳
- `BackgroundPanel.jsx` - 背景顏色
- `LayerPanel.jsx` - 圖層管理

---

## Hooks 依賴關係

### 核心 Hooks 架構

```
useEditorState (核心狀態管理)
├── 狀態管理
│   ├── elements (所有設計元素)
│   ├── selectedElementId (當前選中的元素 ID)
│   ├── backgroundColor (背景顏色)
│   └── workName (作品名稱)
│
├── 基礎操作
│   ├── addElement() - 添加元素
│   ├── updateElement() - 更新元素屬性
│   ├── deleteElement() - 刪除元素
│   ├── clearSelection() - 清除選擇
│   └── setBackgroundColor() - 設定背景色
│
└── 被以下 Hooks 依賴
    ├── useCanvasInteraction (依賴: elements, selectedElementId, updateElement)
    ├── useImageManager (依賴: addElement)
    ├── useTextEditor (依賴: addElement, updateElement)
    ├── useLayerManager (依賴: elements, updateElement, deleteElement)
    ├── useImageReplace (依賴: updateElement)
    ├── useFreeTransform (依賴: selectedElementId, updateElement)
    └── useImageCrop (依賴: selectedElementId, updateElement)
```

### Hooks 詳細說明

#### 1. useEditorState
**檔案**: `hooks/useEditorState.js`

**用途**: 管理編輯器核心狀態（元素、選擇、背景色）

**主要方法**:
```javascript
{
  elements,              // 所有設計元素陣列
  selectedElementId,     // 當前選中的元素 ID
  backgroundColor,       // 背景顏色
  workName,             // 作品名稱
  addElement,           // 添加元素
  updateElement,        // 更新元素屬性
  deleteElement,        // 刪除元素
  setSelectedElement,   // 設定選中元素
  clearSelection,       // 清除選擇
  setBackgroundColor,   // 設定背景色
  setWorkName,          // 設定作品名稱
  setElements,          // 直接設定所有元素（用於載入範本）
  ...
}
```

**依賴**: 無

**被依賴**: 所有其他編輯器 Hooks

---

#### 2. useCanvasInteraction
**檔案**: `hooks/useCanvasInteraction.js`

**用途**: 處理畫布上的互動（拖曳、縮放、旋轉、選擇）

**主要方法**:
```javascript
{
  handleMouseDown,    // 滑鼠按下（開始拖曳/旋轉/縮放）
  handleMouseMove,    // 滑鼠移動（執行拖曳/旋轉/縮放）
  handleMouseUp,      // 滑鼠放開（結束互動）
  isInteracting,      // 是否正在互動
  ...
}
```

**依賴**: `useEditorState`（elements, selectedElementId, updateElement）

**互動類型**:
- 拖曳移動元素
- 縮放元素（透過控制點）
- 旋轉元素（透過旋轉控制點）
- 點擊選擇元素

---

#### 3. useImageManager
**檔案**: `hooks/useImageManager.js`

**用途**: 管理圖片上傳和添加到畫布

**主要方法**:
```javascript
{
  handleImageUpload,     // 處理圖片上傳
  handleElementSelect,   // 處理元素選擇（從元素庫）
  isUploading,          // 是否正在上傳
  uploadError,          // 上傳錯誤訊息
  ...
}
```

**依賴**: `useEditorState`（addElement）

**功能**:
- 上傳圖片到伺服器
- 從元素庫選擇圖片
- 自動計算元素位置和大小
- 支援去背功能

---

#### 4. useTextEditor
**檔案**: `hooks/useTextEditor.js`

**用途**: 管理文字元素的添加和編輯

**主要方法**:
```javascript
{
  addText,              // 添加文字元素
  handleTextChange,     // 處理文字內容變更
  handleTextStyleChange,// 處理文字樣式變更（字型、大小、顏色、對齊）
  isEditingText,        // 是否正在編輯文字
  editingElementId,     // 正在編輯的元素 ID
  ...
}
```

**依賴**: `useEditorState`（addElement, updateElement）

**樣式屬性**:
- `fontFamily` - 字型
- `fontSize` - 字體大小
- `color` - 文字顏色
- `textAlign` - 對齊方式（left, center, right）
- `fontWeight` - 粗體
- `fontStyle` - 斜體

---

#### 5. useLayerManager
**檔案**: `hooks/useLayerManager.js`

**用途**: 管理元素的圖層順序

**主要方法**:
```javascript
{
  moveLayerUp,        // 向上移動一層
  moveLayerDown,      // 向下移動一層
  moveLayerToTop,     // 移到最上層
  moveLayerToBottom,  // 移到最下層
  duplicateElement,   // 複製元素
  ...
}
```

**依賴**: `useEditorState`（elements, updateElement, deleteElement）

**圖層順序**: 元素陣列的順序決定渲染順序（後面的元素在上層）

---

#### 6. useTemplateManager
**檔案**: `hooks/useTemplateManager.js`

**用途**: 管理範本的載入和儲存

**主要方法**:
```javascript
{
  loadTemplate,       // 載入範本
  saveAsTemplate,     // 儲存為範本
  templates,          // 範本列表
  isLoading,          // 是否正在載入
  ...
}
```

**依賴**: `useEditorState`（setElements, setBackgroundColor）

**範本資料結構**:
```javascript
{
  id,
  name,
  designData: {
    elements: [...],
    backgroundColor: "#ffffff"
  }
}
```

---

#### 7. useImageReplace
**檔案**: `hooks/useImageReplace.js`

**用途**: 替換圖片元素的圖片（保持尺寸和位置）

**主要方法**:
```javascript
{
  handleImageReplace,   // 替換圖片
  isReplacing,          // 是否正在替換
  replacingElementId,   // 正在替換的元素 ID
  ...
}
```

**依賴**: `useEditorState`（updateElement）

---

#### 8. useCanvasViewport
**檔案**: `hooks/useCanvasViewport.js`

**用途**: 管理畫布視窗（縮放、平移）

**主要方法**:
```javascript
{
  zoom,               // 縮放比例
  offset,             // 平移偏移
  zoomIn,             // 放大
  zoomOut,            // 縮小
  resetView,          // 重置視圖
  fitToScreen,        // 適應螢幕
  ...
}
```

**依賴**: 無

---

#### 9. useFreeTransform
**檔案**: `hooks/useFreeTransform.js`

**用途**: 自由變形（透視變形、3D 旋轉）

**主要方法**:
```javascript
{
  enableFreeTransform,  // 啟用自由變形模式
  disableFreeTransform, // 關閉自由變形模式
  isFreeTransformMode,  // 是否在自由變形模式
  ...
}
```

**依賴**: `useEditorState`（selectedElementId, updateElement）

---

#### 10. useImageCrop
**檔案**: `hooks/useImageCrop.js`

**用途**: 圖片裁剪功能

**主要方法**:
```javascript
{
  enableCrop,         // 啟用裁剪模式
  disableCrop,        // 關閉裁剪模式
  applyCrop,          // 套用裁剪
  isCropping,         // 是否在裁剪模式
  cropData,           // 裁剪資料
  ...
}
```

**依賴**: `useEditorState`（selectedElementId, updateElement）

**裁剪資料結構**:
```javascript
{
  cropX,        // 裁剪起點 X
  cropY,        // 裁剪起點 Y
  cropWidth,    // 裁剪寬度
  cropHeight,   // 裁剪高度
  cropRotation, // 裁剪旋轉角度
}
```

---

## 工具函數與 Utils

### Canvas 工具函數
**檔案**: `utils/canvasUtils.js`

**主要功能**:
- `calculateCenter()` - 計算畫布中心點
- `exportDesignToImage()` - 匯出設計為圖片
- `generatePrintFile()` - 生成高解析度列印檔案
- `calculateInputWidth()` - 計算文字輸入框寬度

**使用場景**: 匯出、列印、計算位置

---

### 圖片處理工具
**檔案**: `utils/imageUtils.js`

**主要功能**:
- `processImageColor()` - 處理圖片顏色（濾鏡、亮度等）
- `loadImage()` - 載入圖片
- `resizeImage()` - 調整圖片大小

**使用場景**: 圖片上傳、圖片處理

---

### 背景去除工具
**檔案**: `utils/backgroundRemoval.js`

**主要功能**:
- `removeImageBackground()` - 使用 AI 去除圖片背景

**使用場景**: 圖片上傳時的去背功能

---

### 儲存工具
**檔案**: `utils/storageUtils.js`

**主要功能**:
- `saveDraft()` - 儲存草稿到伺服器
- `getStorageInfo()` - 獲取儲存空間資訊

**使用場景**: 草稿管理

---

### 快照生成工具
**檔案**: `utils/snapshot3D.js` 和 `utils/snapshot2D.js`

**主要功能**:
- `generate3DSnapshot()` - 生成 3D 商品快照（包含 UV 貼圖）
- `generate2DSnapshot()` - 生成 2D 商品快照

**使用場景**: 購物車、訂單、草稿預覽

---

### 驗證工具
**檔案**: `utils/validationUtils.js`

**主要功能**:
- `validateDesign()` - 驗證設計是否有效
- `checkPrintAreaBounds()` - 檢查元素是否在列印區域內

**使用場景**: 提交設計前的驗證

---

## 常見修改場景

### 場景 1: 修改渲染邏輯（例如：新增元素屬性）

**問題**: 想要為元素新增透明度（opacity）屬性

**需要修改的檔案** (按優先級):

1. **DesignElementsLayer.jsx** (P0 - 編輯器即時顯示)
   - 位置: `components/Editor/components/DesignElementsLayer.jsx`
   - 修改: 在元素的 style 中添加 `opacity: element.opacity || 1`

2. **ProductPreview.jsx** (P0 - 預覽顯示)
   - 位置: `components/Preview/ProductPreview.jsx`
   - 修改: Canvas 繪製和 DOM 渲染都要加上 opacity
   - Canvas: `ctx.globalAlpha = element.opacity || 1`
   - DOM: `style={{ opacity: element.opacity || 1 }}`

3. **snapshot3D.js** (P0 - 3D 快照)
   - 位置: `components/Editor/utils/snapshot3D.js`
   - 修改: Canvas 繪製時設定 `ctx.globalAlpha`

4. **snapshot2D.js** (P0 - 2D 快照)
   - 位置: `components/Editor/utils/snapshot2D.js`
   - 修改: Canvas 繪製時設定 `ctx.globalAlpha`

5. **canvasUtils.js** (P1 - 匯出和列印)
   - 位置: `components/Editor/utils/canvasUtils.js`
   - 修改: `exportDesignToImage()` 和 `generatePrintFile()` 函數

6. **工具面板** (UI 控制)
   - 位置: `components/Editor/components/ToolPanels/ImagePanel.jsx` 或 `TextPanel.jsx`
   - 修改: 添加 opacity 滑桿控制

**完整修改清單**: 參考 `RENDERING_FILES_GUIDE.md`

---

### 場景 2: 修改工具列

**問題**: 想要在頂部工具列添加新按鈕

**修改檔案**:
- `components/Editor/components/TopToolbar.jsx`
- 使用 `topToolbarLeft` 或 `topToolbarRight` props 傳入自定義內容

**範例**:
```jsx
<UniversalEditor
  topToolbarRight={
    <button onClick={handleCustomAction}>
      自定義按鈕
    </button>
  }
/>
```

---

### 場景 3: 添加新的工具面板

**問題**: 想要添加一個「濾鏡」工具面板

**步驟**:

1. **建立面板組件**
   - 位置: `components/Editor/components/ToolPanels/FilterPanel.jsx`
   - 參考現有面板的結構

2. **在 ToolSidebar 註冊**
   - 修改: `components/Editor/components/ToolSidebar.jsx`
   - 添加新的工具按鈕和面板

3. **建立 Hook（如需要）**
   - 位置: `components/Editor/hooks/useFilterManager.js`
   - 管理濾鏡相關的邏輯

4. **在 UniversalEditor 整合**
   - 修改: `components/Editor/UniversalEditor.jsx`
   - 引入新的 Hook 和面板

---

### 場景 4: 修改圖層操作

**問題**: 想要添加「鎖定圖層」功能

**修改檔案**:

1. **useLayerManager.js**
   - 位置: `hooks/useLayerManager.js`
   - 添加 `lockElement()` 和 `unlockElement()` 方法

2. **useEditorState.js**
   - 位置: `hooks/useEditorState.js`
   - 在 updateElement 中添加 `locked` 屬性處理

3. **LayerPanel.jsx**
   - 位置: `components/ToolPanels/LayerPanel.jsx`
   - 添加鎖定/解鎖按鈕

4. **useCanvasInteraction.js**
   - 位置: `hooks/useCanvasInteraction.js`
   - 在互動時檢查 `element.locked`，如果鎖定則跳過

---

### 場景 5: 修改快照生成

**問題**: 3D 商品的快照顯示不正確

**檢查順序**:

1. **snapshot3D.js** - UV 貼圖生成
   - 位置: `utils/snapshot3D.js`
   - 檢查 `generateUVTexture()` 函數
   - 確認元素的 scaleX, scaleY, rotation 計算正確

2. **ProductPreview.jsx** - 3D 模型渲染
   - 位置: `components/Preview/ProductPreview.jsx`
   - 檢查 Canvas UV 貼圖生成邏輯（與 snapshot3D 應一致）

3. **GLBViewer.jsx** - 3D 查看器
   - 位置: `components/GLBViewer/GLBViewer.jsx`
   - 檢查貼圖應用到模型的邏輯

**常見問題**:
- 元素位置偏移 → 檢查座標轉換邏輯
- 元素變形 → 檢查 scaleX/scaleY 計算
- 元素旋轉錯誤 → 檢查 rotation 應用順序

---

## 渲染邏輯說明

### 元素資料結構

```javascript
{
  id: "element_1234567890",     // 唯一 ID
  type: "image" | "text",        // 元素類型

  // 位置和尺寸
  x: 100,                        // X 座標（畫布相對位置）
  y: 100,                        // Y 座標
  width: 200,                    // 寬度
  height: 200,                   // 高度

  // 變形
  rotation: 0,                   // 旋轉角度（度）
  scaleX: 1,                     // X 軸縮放比例
  scaleY: 1,                     // Y 軸縮放比例

  // 圖片特有屬性
  src: "/uploads/images/xxx.jpg", // 圖片 URL
  maskSrc: "/uploads/masks/xxx.png", // 蒙版 URL（optional）
  cropX: 0,                      // 裁剪起點 X（optional）
  cropY: 0,                      // 裁剪起點 Y
  cropWidth: 200,                // 裁剪寬度
  cropHeight: 200,               // 裁剪高度
  cropRotation: 0,               // 裁剪旋轉角度

  // 文字特有屬性
  text: "Hello World",           // 文字內容
  fontFamily: "Arial",           // 字型
  fontSize: 24,                  // 字體大小
  color: "#000000",              // 文字顏色
  textAlign: "center",           // 對齊方式
  fontWeight: "normal",          // 粗體
  fontStyle: "normal",           // 斜體
}
```

### 渲染流程

1. **編輯器渲染**（DesignElementsLayer.jsx）
   ```
   elements.map() → 渲染每個元素 → 應用 transform 和樣式
   ```

2. **預覽渲染**（ProductPreview.jsx）
   - **3D 模式**:
     ```
     Canvas 繪製 UV 貼圖 → 應用到 3D 模型 → GLBViewer 顯示
     ```
   - **2D 模式**:
     ```
     DOM 渲染元素 → 應用 transform 和樣式
     ```

3. **快照生成**（snapshot3D.js / snapshot2D.js）
   ```
   Canvas 繪製所有元素 → 轉換為 base64 → 上傳到伺服器
   ```

### Transform 順序

**CSS Transform**:
```css
transform: rotate(${rotation}deg) scale(${scaleX}, ${scaleY})
```

**Canvas Transform**:
```javascript
ctx.translate(x, y);
ctx.rotate(rotation * Math.PI / 180);
ctx.scale(scaleX, scaleY);
ctx.drawImage(...);
```

**重要**: CSS 和 Canvas 的 transform 順序必須一致，否則顯示會不同

---

## 開發指南

### 新增元素屬性的完整流程

1. **定義資料結構**
   - 在元素資料中添加新屬性
   - 設定預設值

2. **更新 UI 控制**
   - 在對應的工具面板（ImagePanel/TextPanel）添加控制項
   - 使用 `updateElement()` 更新屬性

3. **更新所有渲染位置**
   - DesignElementsLayer.jsx
   - ProductPreview.jsx (Canvas + DOM)
   - snapshot3D.js
   - snapshot2D.js
   - canvasUtils.js

4. **測試**
   - 編輯器即時顯示
   - 2D/3D 預覽
   - 快照生成
   - 匯出圖片
   - 列印檔案

### 除錯技巧

1. **元素顯示問題**
   - 檢查 DesignElementsLayer.jsx 的渲染
   - 使用 Chrome DevTools 查看元素的 style

2. **預覽不一致**
   - 比對 ProductPreview.jsx 的 Canvas 和 DOM 渲染
   - 檢查座標轉換邏輯

3. **快照問題**
   - 在 snapshot3D.js 中添加 console.log
   - 檢查 Canvas 繪製順序
   - 確認圖片載入完成

4. **效能問題**
   - 使用 React DevTools Profiler
   - 檢查不必要的重新渲染
   - 優化 useCallback 和 useMemo

### 程式碼風格

1. **命名慣例**
   - 組件: PascalCase (e.g., `DesignElementsLayer`)
   - Hooks: camelCase with "use" prefix (e.g., `useEditorState`)
   - 函數: camelCase (e.g., `calculateCenter`)

2. **檔案組織**
   - 一個檔案一個組件/Hook
   - 相關功能放在同一目錄

3. **註解**
   - 複雜邏輯添加註解
   - 公開函數添加 JSDoc

---

## 參考資料

- **渲染檔案完整清單**: `RENDERING_FILES_GUIDE.md`
- **專案整體架構**: `README.md`
- **Monorepo 遷移計劃**: `MONOREPO_MIGRATION.md`

---

**最後更新**: 2025-01-12
**版本**: 1.0
**維護者**: MonKind 開發團隊
