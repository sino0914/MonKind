# Hooks 和 Utils 功能索引

快速查找所有 Hooks 和工具函數的位置、用途、主要方法和依賴關係。

## 目錄

- [編輯器 Hooks](#編輯器-hooks)
- [工具函數 (Utils)](#工具函數-utils)
- [服務 (Services)](#服務-services)
- [常用工具函數](#常用工具函數)

---

## 編輯器 Hooks

所有編輯器 Hooks 位於 `packages/shared/components/Editor/hooks/`

### useEditorState

**檔案**: `components/Editor/hooks/useEditorState.js`

**用途**: 管理編輯器核心狀態（元素、選擇、背景色、歷史記錄）

**主要狀態**:
```javascript
{
  // 設計元素
  designElements,        // 所有設計元素陣列
  selectedElement,       // 當前選中的元素
  copiedElement,         // 複製的元素

  // 背景和圖層
  backgroundColor,       // 背景顏色
  hiddenLayers,         // 隱藏的圖層 Set
  lockedLayers,         // 鎖定的圖層 Set

  // 互動狀態
  draggedElement,       // 正在拖曳的元素
  dragOffset,           // 拖曳偏移
  resizeHandle,         // 正在使用的縮放控制點

  // 文字編輯
  editingText,          // 正在編輯的文字元素 ID
  editingContent,       // 編輯中的文字內容
  showTextToolbar,      // 是否顯示文字工具列

  // 作品資訊
  workName,             // 作品名稱
  isEditingName,        // 是否正在編輯名稱

  // 狀態追蹤
  isDirty,              // 是否有未儲存的變更
  history,              // 歷史記錄陣列
  historyIndex,         // 當前歷史記錄索引
}
```

**主要方法**:
```javascript
// 元素操作
addElement(element)              // 添加元素
updateElement(id, updates)       // 更新元素屬性
deleteElement(id)                // 刪除元素
setElements(elements)            // 直接設定所有元素

// 選擇操作
selectElement(id)                // 選擇元素
clearSelection()                 // 清除選擇
copyElement(element)             // 複製元素
pasteElement()                   // 貼上元素

// 拖曳操作
startDrag(element, offset)       // 開始拖曳
endDrag()                        // 結束拖曳

// 縮放操作
startResize(handle)              // 開始縮放/旋轉
endResize()                      // 結束縮放/旋轉

// 文字編輯
startEditingText(id, content)    // 開始編輯文字
updateEditingContent(content)    // 更新編輯內容
endEditingText()                 // 結束編輯

// 背景
setBackgroundColor(color)        // 設定背景色

// 圖層管理
toggleLayerVisibility(id)        // 切換圖層可見性
toggleLayerLock(id)              // 切換圖層鎖定
isLayerHidden(id)                // 檢查圖層是否隱藏
isLayerLocked(id)                // 檢查圖層是否鎖定

// 歷史記錄
undo()                           // 撤銷
redo()                           // 重做
canUndo                          // 是否可以撤銷
canRedo                          // 是否可以重做

// 作品名稱
setWorkName(name)                // 設定作品名稱
startEditingName()               // 開始編輯名稱
updateEditingName(value)         // 更新編輯中的名稱
saveEditingName()                // 儲存名稱編輯

// 骯髒狀態
markAsDirty()                    // 標記為已修改
resetDirty()                     // 重置骯髒狀態
```

**依賴**: 無

**被依賴**: 所有其他編輯器 Hooks

**特殊功能**:
- 自動記錄歷史（支援撤銷/重做，最多 50 筆）
- 圖片載入錯誤追蹤
- 骯髒狀態追蹤（是否有未儲存變更）

---

### useCanvasInteraction

**檔案**: `components/Editor/hooks/useCanvasInteraction.js`

**用途**: 處理畫布上的互動（拖曳、縮放、旋轉、選擇）

**主要方法**:
```javascript
handleMouseDown(e, canvasRef)    // 滑鼠按下（開始互動）
handleMouseMove(e, canvasRef)    // 滑鼠移動（執行拖曳/縮放/旋轉）
handleMouseUp()                  // 滑鼠放開（結束互動）
isHoveringImage                  // 是否懸停在圖片元素上
screenToCanvasCoords()           // 螢幕座標轉畫布座標
```

**依賴**:
- `useEditorState` (draggedElement, resizeHandle, selectedElement, updateElement, etc.)
- `viewport` (optional - 用於縮放和平移)

**互動類型**:
1. **拖曳移動** - 點擊元素並拖曳
2. **縮放** - 拖曳縮放控制點
3. **旋轉** - 拖曳旋轉控制點（綠色圓點）
4. **選擇** - 點擊元素選擇
5. **圖片替換預覽** - 拖曳圖片到元素上時顯示預覽

**特殊功能**:
- 支援鎖定圖層檢查（鎖定的元素無法互動）
- 自動驗證元素是否在列印區域內
- 支援視窗縮放和平移（透過 viewport）

---

### useImageManager

**檔案**: `components/Editor/hooks/useImageManager.js`

**用途**: 管理圖片上傳和添加到畫布

**主要方法**:
```javascript
handleImageUpload(file, options)  // 處理圖片上傳
handleElementSelect(element)      // 處理元素選擇（從元素庫）
isUploading                       // 是否正在上傳
uploadError                       // 上傳錯誤訊息
clearUploadError()                // 清除上傳錯誤
```

**參數說明** (`handleImageUpload`):
```javascript
options = {
  removeBackground: false,        // 是否去除背景
  onSuccess: (element) => {},    // 上傳成功回調
  position: { x, y },            // 指定位置（optional）
}
```

**依賴**:
- `useEditorState` (addElement)
- `API.uploadEditorImage()` - 上傳圖片到伺服器
- `removeImageBackground()` - 去背功能

**自動計算**:
- 圖片在畫布上的初始位置（預設置中）
- 圖片的初始尺寸（保持比例，最大 200px）

**錯誤處理**:
- 檔案大小限制
- 檔案類型限制
- 上傳失敗處理

---

### useTextEditor

**檔案**: `components/Editor/hooks/useTextEditor.js`

**用途**: 管理文字元素的添加和編輯

**主要方法**:
```javascript
addText(text, options)           // 添加文字元素
handleTextChange(id, newText)    // 處理文字內容變更
handleTextStyleChange(id, style) // 處理文字樣式變更
startEditing(id)                 // 開始編輯文字
stopEditing()                    // 停止編輯
isEditingText                    // 是否正在編輯文字
editingElementId                 // 正在編輯的元素 ID
```

**文字樣式屬性**:
```javascript
{
  fontFamily: "Arial",           // 字型
  fontSize: 24,                  // 字體大小
  color: "#000000",              // 文字顏色
  textAlign: "center",           // 對齊方式 (left/center/right)
  fontWeight: "normal",          // 粗體 (normal/bold)
  fontStyle: "normal",           // 斜體 (normal/italic)
}
```

**依賴**:
- `useEditorState` (addElement, updateElement, startEditingText, etc.)

**自動計算**:
- 文字寬度（基於內容和字型）
- 文字在畫布上的初始位置（預設置中）

---

### useLayerManager

**檔案**: `components/Editor/hooks/useLayerManager.js`

**用途**: 管理元素的圖層順序

**主要方法**:
```javascript
moveLayerUp(id)                  // 向上移動一層
moveLayerDown(id)                // 向下移動一層
moveLayerToTop(id)               // 移到最上層
moveLayerToBottom(id)            // 移到最下層
duplicateElement(id)             // 複製元素
canMoveUp(id)                    // 是否可以向上移動
canMoveDown(id)                  // 是否可以向下移動
```

**依賴**:
- `useEditorState` (elements, updateElement, addElement)

**圖層順序**:
- 元素陣列的順序決定渲染順序
- 索引越大的元素在越上層

---

### useTemplateManager

**檔案**: `components/Editor/hooks/useTemplateManager.js`

**用途**: 管理範本的載入和儲存

**主要方法**:
```javascript
loadTemplate(templateId)         // 載入範本
saveAsTemplate(name, description)// 儲存為範本
templates                        // 範本列表
isLoading                        // 是否正在載入
error                            // 錯誤訊息
```

**範本資料結構**:
```javascript
{
  id: 1,
  name: "範本名稱",
  description: "範本描述",
  designData: {
    elements: [...],
    backgroundColor: "#ffffff"
  },
  productId: 1
}
```

**依賴**:
- `useEditorState` (setElements, setBackgroundColor)
- `API.getTemplates()` - 獲取範本列表
- `API.saveTemplate()` - 儲存範本

---

### useImageReplace

**檔案**: `components/Editor/hooks/useImageReplace.js`

**用途**: 替換圖片元素的圖片（保持尺寸和位置）

**主要方法**:
```javascript
startReplacing(elementId)        // 開始替換模式
handleImageReplace(file)         // 處理圖片替換
cancelReplacing()                // 取消替換
isReplacing                      // 是否正在替換
replacingElementId               // 正在替換的元素 ID
```

**依賴**:
- `useEditorState` (updateElement)
- `API.uploadEditorImage()` - 上傳新圖片

**特點**:
- 保持元素的位置、尺寸、旋轉角度
- 只更新圖片 URL

---

### useCanvasViewport

**檔案**: `components/Editor/hooks/useCanvasViewport.js`

**用途**: 管理畫布視窗（縮放、平移）

**主要方法**:
```javascript
zoom                             // 當前縮放比例
pan                              // 當前平移偏移 {x, y}
zoomIn()                         // 放大
zoomOut()                        // 縮小
setZoom(scale)                   // 設定縮放比例
resetView()                      // 重置視圖
fitToScreen()                    // 適應螢幕
handleWheel(e)                   // 處理滾輪縮放
handlePan(deltaX, deltaY)        // 處理平移
```

**縮放範圍**: 0.1 ~ 5.0

**依賴**: 無

**特殊功能**:
- 滾輪縮放（Ctrl + 滾輪）
- 空白處拖曳平移
- 縮放時保持畫布置中

---

### useFreeTransform

**檔案**: `components/Editor/hooks/useFreeTransform.js`

**用途**: 自由變形（透視變形、3D 旋轉）

**主要方法**:
```javascript
enableFreeTransform(elementId)   // 啟用自由變形模式
disableFreeTransform()           // 關閉自由變形模式
isFreeTransformMode              // 是否在自由變形模式
transformingElementId            // 正在變形的元素 ID
```

**依賴**:
- `useEditorState` (selectedElement, updateElement)

**注意**: 此功能目前可能未完全實作

---

### useImageCrop

**檔案**: `components/Editor/hooks/useImageCrop.js`

**用途**: 圖片裁剪功能

**主要方法**:
```javascript
enableCrop(elementId)            // 啟用裁剪模式
disableCrop()                    // 關閉裁剪模式
applyCrop()                      // 套用裁剪
updateCropData(data)             // 更新裁剪資料
isCropping                       // 是否在裁剪模式
croppingElementId                // 正在裁剪的元素 ID
cropData                         // 裁剪資料
```

**裁剪資料結構**:
```javascript
{
  cropX: 0,                      // 裁剪起點 X
  cropY: 0,                      // 裁剪起點 Y
  cropWidth: 200,                // 裁剪寬度
  cropHeight: 200,               // 裁剪高度
  cropRotation: 0,               // 裁剪旋轉角度
}
```

**依賴**:
- `useEditorState` (selectedElement, updateElement)

---

### useImageEdit

**檔案**: `components/Editor/hooks/useImageEdit.js`

**用途**: 圖片編輯功能（濾鏡、調整等）

**注意**: 檔案存在但可能功能有限，建議查看實作細節

---

## 工具函數 (Utils)

所有工具函數位於 `packages/shared/components/Editor/utils/`

### canvasUtils.js

**檔案**: `components/Editor/utils/canvasUtils.js`

**功能**: Canvas 相關工具函數

**主要函數**:

#### calculateCenter(printArea)
計算設計區域中心點
```javascript
// 參數
printArea: { x, y, width, height }

// 回傳
{ x, y }  // 中心點座標
```

#### measureTextWidth(text, fontSize, fontFamily, fontWeight, fontStyle)
測量文字寬度
```javascript
// 參數
text: "文字內容"
fontSize: 24
fontFamily: "Arial"
fontWeight: "normal"
fontStyle: "normal"

// 回傳
width  // 文字寬度（px）
```

#### exportDesignToImage(productInfo, designElements, backgroundColor, options)
輸出設計為圖片
```javascript
// 參數
productInfo: {
  printArea: {...},
  bleedArea: {...},
  type: "2D" | "3D",
  title: "商品名稱"
}
designElements: [...]
backgroundColor: "#ffffff"
options: {
  useBleedArea: false,           // 是否使用出血區域
  showCropMarks: false           // 是否顯示裁切線
}

// 回傳
dataUrl  // base64 圖片
```

**特點**:
- 高解析度輸出（8x scale factor）
- 支援出血區域
- 支援裁切線

#### generatePrintFile(productInfo, designElements, backgroundColor, options)
生成列印檔案
```javascript
// 參數（同 exportDesignToImage）
options: {
  scaleFactor: 8,                // 解析度倍數
  useBleedArea: true,            // 使用出血區域
  showCropMarks: true,           // 顯示裁切線
  format: "png" | "jpeg"         // 輸出格式
}

// 回傳
blob  // 圖片 Blob
```

#### calculateInputWidth(text, fontSize, fontFamily)
計算文字輸入框寬度
```javascript
// 回傳最小 20px 的寬度
```

---

### imageUtils.js

**檔案**: `components/Editor/utils/imageUtils.js`

**功能**: 圖片處理工具函數

**主要函數**:

#### loadImage(src)
載入圖片
```javascript
// 參數
src: "圖片 URL"

// 回傳
Promise<HTMLImageElement>
```

#### processImageColor(imageUrl, filters)
處理圖片顏色（濾鏡）
```javascript
// 參數
imageUrl: "圖片 URL"
filters: {
  brightness: 100,              // 亮度 (0-200)
  contrast: 100,                // 對比度 (0-200)
  saturation: 100,              // 飽和度 (0-200)
  hue: 0,                       // 色調 (0-360)
  blur: 0,                      // 模糊 (0-10)
  grayscale: 0                  // 灰階 (0-100)
}

// 回傳
dataUrl  // 處理後的圖片 base64
```

#### resizeImage(imageUrl, maxWidth, maxHeight)
調整圖片大小
```javascript
// 回傳
{ width, height, dataUrl }
```

---

### backgroundRemoval.js

**檔案**: `components/Editor/utils/backgroundRemoval.js`

**功能**: 背景去除工具（使用 AI）

**主要函數**:

#### removeImageBackground(imageFile)
去除圖片背景
```javascript
// 參數
imageFile: File

// 回傳
Promise<Blob>  // 去背後的圖片
```

**注意**: 需要第三方 API 或本地模型支援

---

### storageUtils.js

**檔案**: `components/Editor/utils/storageUtils.js`

**功能**: 儲存相關工具函數

**主要函數**:

#### saveDraft(userId, draftData)
儲存草稿到伺服器
```javascript
// 參數
userId: "user@example.com"
draftData: {
  id: "draft_xxx",
  productId: 1,
  name: "我的設計",
  elements: [...],
  backgroundColor: "#ffffff",
  snapshot3D: "data:image/..."
}

// 回傳
Promise<Response>
```

#### getStorageInfo()
獲取儲存空間資訊
```javascript
// 回傳
{
  used: 1024,                   // 已使用（bytes）
  quota: 1048576,               // 配額（bytes）
  usedMB: "1.00",              // 已使用（MB）
  quotaMB: "1.00"              // 配額（MB）
}
```

---

### snapshot3D.js

**檔案**: `components/Editor/utils/snapshot3D.js`

**功能**: 生成 3D 商品快照

**主要函數**:

#### generate3DSnapshot(productInfo, designElements, backgroundColor, glbViewerRef)
生成 3D 快照
```javascript
// 參數
productInfo: {
  printArea: {...},
  model3D: {
    glbUrl: "模型 URL",
    uvMapping: {...}
  }
}
designElements: [...]
backgroundColor: "#ffffff"
glbViewerRef: React.Ref  // GLBViewer 的 ref

// 回傳
Promise<string>  // base64 圖片
```

**內部函數**:

#### generateUVTexture(printArea, designElements, backgroundColor)
生成 UV 貼圖
```javascript
// 回傳
Promise<string>  // base64 貼圖
```

**特點**:
- 使用 Canvas 繪製 UV 貼圖
- 應用到 3D 模型
- 截取 GLBViewer 畫面作為快照

---

### snapshot2D.js

**檔案**: `components/Editor/utils/snapshot2D.js`

**功能**: 生成 2D 商品快照

**主要函數**:

#### generate2DSnapshot(productInfo, designElements, backgroundColor, mockupImage)
生成 2D 快照
```javascript
// 參數
productInfo: { printArea: {...} }
designElements: [...]
backgroundColor: "#ffffff"
mockupImage: HTMLImageElement  // Mockup 圖片

// 回傳
Promise<string>  // base64 圖片
```

**流程**:
1. 繪製 Mockup 背景
2. 繪製設計區域
3. 繪製所有設計元素
4. 回傳 base64

---

### validationUtils.js

**檔案**: `components/Editor/utils/validationUtils.js`

**功能**: 驗證工具函數

**主要函數**:

#### validateDesign(designElements)
驗證設計是否有效
```javascript
// 回傳
{
  isValid: true,
  errors: []
}
```

#### validatePrintArea(element, printArea)
驗證元素是否在列印區域內
```javascript
// 回傳
boolean
```

#### checkPrintAreaBounds(element, printArea)
檢查元素邊界
```javascript
// 回傳
{
  left: boolean,
  right: boolean,
  top: boolean,
  bottom: boolean,
  isValid: boolean
}
```

---

## 服務 (Services)

所有服務位於 `packages/shared/services/`

### API (api.js)

**檔案**: `services/api.js`

**用途**: 前端 API 封裝（localStorage + HTTP fallback）

**主要方法**:

#### 產品相關
```javascript
getProducts()                    // 獲取所有產品
getProductById(id)               // 獲取單個產品
```

#### 範本相關
```javascript
getTemplates(productId)          // 獲取範本
saveTemplate(templateData)       // 儲存範本
```

#### 元素相關
```javascript
getElements()                    // 獲取元素庫
```

#### 上傳相關
```javascript
uploadEditorImage(file, userId)  // 上傳編輯器圖片
uploadSnapshot(base64, productId)// 上傳快照
uploadPrintFile(file, productId) // 上傳列印檔案
```

#### 草稿相關
```javascript
getDrafts(userId)                // 獲取草稿列表
saveDraft(userId, draftData)     // 儲存草稿
deleteDraft(userId, draftId)     // 刪除草稿
```

---

### HttpAPI (HttpApiService.js)

**檔案**: `services/HttpApiService.js`

**用途**: HTTP API 封裝（純後端 API 調用）

**主要方法**:

#### 產品 API
```javascript
getProducts(params)              // GET /api/products
getProductById(id)               // GET /api/products/:id
createProduct(data)              // POST /api/products
updateProduct(id, data)          // PUT /api/products/:id
deleteProduct(id)                // DELETE /api/products/:id
```

#### 訂單 API
```javascript
getOrders(params)                // GET /api/orders
createOrder(data)                // POST /api/orders
getOrderById(id)                 // GET /api/orders/:id
updateOrderStatus(id, status)    // PATCH /api/orders/:id/status
```

#### 範本 API
```javascript
getTemplates(params)             // GET /api/templates
getTemplateById(id)              // GET /api/templates/:id
createTemplate(data)             // POST /api/templates
updateTemplate(id, data)         // PUT /api/templates/:id
deleteTemplate(id)               // DELETE /api/templates/:id
```

#### 上傳 API
```javascript
uploadGLB(file)                  // POST /api/upload/glb
uploadImage(file)                // POST /api/upload/image
uploadSnapshot(data)             // POST /api/upload/snapshot
uploadPrintFile(file, productId) // POST /api/upload/print-file
```

#### 使用者 API
```javascript
login(credentials)               // POST /api/users/login
register(userData)               // POST /api/users/register
```

**基礎 URL**: `http://localhost:3002`

---

## 常用工具函數

### 快速查找指南

#### 我想要...

**載入圖片**
→ `imageUtils.js` → `loadImage(src)`

**測量文字寬度**
→ `canvasUtils.js` → `measureTextWidth(text, fontSize, fontFamily)`

**計算畫布中心**
→ `canvasUtils.js` → `calculateCenter(printArea)`

**匯出設計為圖片**
→ `canvasUtils.js` → `exportDesignToImage(productInfo, elements, bgColor, options)`

**生成列印檔案**
→ `canvasUtils.js` → `generatePrintFile(productInfo, elements, bgColor, options)`

**去除圖片背景**
→ `backgroundRemoval.js` → `removeImageBackground(imageFile)`

**處理圖片顏色**
→ `imageUtils.js` → `processImageColor(imageUrl, filters)`

**儲存草稿**
→ `storageUtils.js` → `saveDraft(userId, draftData)`

**生成 3D 快照**
→ `snapshot3D.js` → `generate3DSnapshot(...)`

**生成 2D 快照**
→ `snapshot2D.js` → `generate2DSnapshot(...)`

**驗證設計**
→ `validationUtils.js` → `validateDesign(elements)`

**上傳圖片**
→ `API.uploadEditorImage(file, userId)`

**獲取產品列表**
→ `API.getProducts()` 或 `HttpAPI.getProducts()`

---

## 依賴關係圖

```
useEditorState (核心)
├── useCanvasInteraction (拖曳、縮放、旋轉)
├── useImageManager (圖片上傳)
│   └── API.uploadEditorImage()
│   └── removeImageBackground()
├── useTextEditor (文字編輯)
├── useLayerManager (圖層管理)
├── useTemplateManager (範本管理)
│   └── API.getTemplates()
│   └── API.saveTemplate()
├── useImageReplace (圖片替換)
│   └── API.uploadEditorImage()
├── useFreeTransform (自由變形)
└── useImageCrop (圖片裁剪)

useCanvasViewport (獨立)

工具函數 (獨立)
├── canvasUtils.js
├── imageUtils.js
├── backgroundRemoval.js
├── storageUtils.js
├── snapshot3D.js
├── snapshot2D.js
└── validationUtils.js
```

---

## 使用範例

### 範例 1: 添加文字元素

```javascript
import { useTextEditor } from './hooks/useTextEditor';

const MyComponent = () => {
  const { addText } = useTextEditor(editorState);

  const handleAddText = () => {
    addText("Hello World", {
      fontSize: 24,
      fontFamily: "Arial",
      color: "#000000"
    });
  };

  return <button onClick={handleAddText}>添加文字</button>;
};
```

### 範例 2: 上傳圖片

```javascript
import { useImageManager } from './hooks/useImageManager';

const MyComponent = () => {
  const { handleImageUpload, isUploading } = useImageManager(editorState, product);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file, {
      removeBackground: false,
      onSuccess: (element) => {
        console.log("圖片已添加:", element);
      }
    });
  };

  return (
    <input
      type="file"
      onChange={handleFileChange}
      disabled={isUploading}
    />
  );
};
```

### 範例 3: 匯出設計

```javascript
import { exportDesignToImage } from './utils/canvasUtils';

const MyComponent = () => {
  const handleExport = async () => {
    const dataUrl = await exportDesignToImage(
      productInfo,
      designElements,
      backgroundColor,
      {
        useBleedArea: true,
        showCropMarks: true
      }
    );

    // 下載圖片
    const link = document.createElement('a');
    link.download = 'design.png';
    link.href = dataUrl;
    link.click();
  };

  return <button onClick={handleExport}>匯出設計</button>;
};
```

---

**最後更新**: 2025-01-12
**版本**: 1.0
**維護者**: MonKind 開發團隊
