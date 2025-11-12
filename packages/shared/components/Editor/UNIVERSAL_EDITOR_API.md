# UniversalEditor API 參考文檔

## 概述

UniversalEditor 是一個通用的設計編輯器組件，支援產品設計和模板編輯兩種模式。提供完整的圖層管理、文字編輯、圖片處理、背景設定等功能。

**檔案位置**: `packages/shared/components/Editor/UniversalEditor.jsx`
**代碼行數**: 917 行
**主要依賴**: React, Konva, useEditorState, useCanvasInteraction 等 hooks

---

## Props API

### 模式配置

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `mode` | `'product'` \| `'template'` | `'product'` | 編輯器模式：產品模式或模板模式 |
| `showTemplateTools` | `boolean` | `true` | 是否顯示模板工具（模板面板） |
| `isAdmin` | `boolean` | `false` | 是否為管理員模式（影響權限和可用功能） |

### 商品相關

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `productId` | `string` \| `number` \| `null` | `null` | 商品 ID，若提供會自動載入商品資料 |
| `product` | `object` \| `null` | `null` | 商品物件，可直接傳入以避免重新載入 |

**Product 物件結構**:
```javascript
{
  id: number,
  title: string,
  price: number,
  mockupImage: string,       // 商品預覽圖
  printArea: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  type: '2D' | '3D',
  model3D?: {                // 僅 3D 商品
    glbUrl: string,
    uvMapping: object
  }
}
```

### 模板相關

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `template` | `object` \| `null` | `null` | 模板物件（僅 template 模式使用） |

**Template 物件結構**:
```javascript
{
  id: number,
  name: string,
  elements: array,           // 設計元素
  backgroundColor: string,
  printArea: object
}
```

### 設計元素控制

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `initialElements` | `array` | `[]` | 初始設計元素陣列 |
| `initialBackgroundColor` | `string` | `'#ffffff'` | 初始背景顏色（hex 格式） |
| `initialWorkName` | `string` | `''` | 初始作品名稱 |
| `onElementsChange` | `function` \| `null` | `null` | 元素變更時的回調 `(elements) => void` |
| `onBackgroundColorChange` | `function` \| `null` | `null` | 背景色變更時的回調 `(color) => void` |

**Element 物件結構**:
```javascript
{
  id: string,
  type: 'text' | 'image' | 'shape',
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
  // 文字特有屬性
  text?: string,
  fontSize?: number,
  fontFamily?: string,
  fill?: string,
  // 圖片特有屬性
  src?: string,
  filters?: array
}
```

### 頂部工具列配置

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `showTopToolbar` | `boolean` | `true` | 是否顯示頂部工具列 |
| `topToolbarLeft` | `React.Node` \| `null` | `null` | 工具列左側自訂內容 |
| `topToolbarRight` | `React.Node` \| `null` | `null` | 工具列右側自訂內容 |
| `title` | `string` | `''` | 編輯器標題 |

### 回調函數

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `onBack` | `function` \| `null` | `null` | 返回按鈕點擊回調 `() => void` |
| `onNavigateBack` | `function` \| `null` | `null` | 導航返回回調（優先於 onBack） |
| `onAddToCart` | `function` \| `null` | `null` | 加入購物車回調 `(design) => void` |
| `onDesignStateChange` | `function` \| `null` | `null` | 設計狀態變更回調 `(state) => void` |

**onDesignStateChange 回調參數**:
```javascript
{
  elements: array,
  backgroundColor: string,
  hasChanges: boolean
}
```

### 草稿相關

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `draftId` | `string` \| `null` | `null` | 草稿 ID，用於更新現有草稿 |
| `isEditingFromCart` | `boolean` | `false` | 是否從購物車編輯（影響儲存行為） |

### 狀態相關

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `loading` | `boolean` | `false` | 外部載入狀態 |
| `error` | `string` \| `object` \| `null` | `null` | 外部錯誤狀態 |

### 其他配置

| Prop | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `headerContent` | `React.Node` \| `null` | `null` | 自訂 header 內容 |

---

## 使用範例

### 範例 1: 基本產品編輯模式

```jsx
import UniversalEditor from '@monkind/shared/components/Editor/UniversalEditor';

function ProductDesigner() {
  return (
    <UniversalEditor
      mode="product"
      productId={123}
      title="設計您的馬克杯"
      onBack={() => navigate('/products')}
      onAddToCart={(design) => {
        console.log('加入購物車:', design);
        // 處理加入購物車邏輯
      }}
    />
  );
}
```

### 範例 2: 模板編輯模式（管理員）

```jsx
import UniversalEditor from '@monkind/shared/components/Editor/UniversalEditor';

function TemplateEditor({ template }) {
  const [elements, setElements] = useState(template.elements);
  const [bgColor, setBgColor] = useState(template.backgroundColor);

  return (
    <UniversalEditor
      mode="template"
      isAdmin={true}
      template={template}
      initialElements={elements}
      initialBackgroundColor={bgColor}
      onElementsChange={(newElements) => {
        setElements(newElements);
        // 自動儲存
        saveTemplate({ ...template, elements: newElements });
      }}
      onBackgroundColorChange={(color) => {
        setBgColor(color);
        saveTemplate({ ...template, backgroundColor: color });
      }}
      showTemplateTools={true}
      title={`編輯模板: ${template.name}`}
    />
  );
}
```

### 範例 3: 從購物車編輯草稿

```jsx
import UniversalEditor from '@monkind/shared/components/Editor/UniversalEditor';

function EditCartItem({ cartItem }) {
  return (
    <UniversalEditor
      mode="product"
      product={cartItem.product}
      draftId={cartItem.draftId}
      isEditingFromCart={true}
      initialElements={cartItem.design.elements}
      initialBackgroundColor={cartItem.design.backgroundColor}
      initialWorkName={cartItem.design.workName}
      onBack={() => navigate('/cart')}
      onAddToCart={(updatedDesign) => {
        updateCartItem(cartItem.id, updatedDesign);
        navigate('/cart');
      }}
    />
  );
}
```

### 範例 4: 自訂工具列

```jsx
import UniversalEditor from '@monkind/shared/components/Editor/UniversalEditor';

function CustomEditor() {
  return (
    <UniversalEditor
      mode="product"
      productId={456}
      showTopToolbar={true}
      topToolbarLeft={
        <div className="flex items-center gap-2">
          <button onClick={() => console.log('自訂按鈕')}>
            自訂功能
          </button>
        </div>
      }
      topToolbarRight={
        <div className="text-sm text-gray-600">
          未儲存的變更
        </div>
      }
      title="高級編輯器"
    />
  );
}
```

### 範例 5: 監聽設計變更

```jsx
import UniversalEditor from '@monkind/shared/components/Editor/UniversalEditor';

function AutoSaveEditor() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  return (
    <UniversalEditor
      mode="product"
      productId={789}
      onDesignStateChange={(state) => {
        console.log('設計已變更:', state);
        setHasUnsavedChanges(state.hasChanges);

        // 自動儲存（防抖處理）
        if (state.hasChanges) {
          debouncedSave(state);
        }
      }}
      topToolbarRight={
        hasUnsavedChanges && (
          <span className="text-yellow-600">● 未儲存</span>
        )
      }
    />
  );
}
```

---

## Hooks 整合

UniversalEditor 內部使用了多個自訂 hooks，這些 hooks 也可以單獨使用：

### 核心 Hooks

| Hook | 位置 | 功能 |
|------|------|------|
| `useEditorState` | `hooks/useEditorState` | 管理編輯器整體狀態 |
| `useCanvasInteraction` | `hooks/useCanvasInteraction` | 處理畫布互動（選擇、移動、變形） |
| `useImageManager` | `hooks/useImageManager` | 管理圖片上傳和處理 |
| `useTemplateManager` | `hooks/useTemplateManager` | 管理模板載入和套用 |
| `useLayerManager` | `hooks/useLayerManager` | 管理圖層順序和操作 |
| `useTextEditor` | `hooks/useTextEditor` | 管理文字編輯功能 |
| `useImageReplace` | `hooks/useImageReplace` | 管理圖片替換功能 |
| `useCanvasViewport` | `hooks/useCanvasViewport` | 管理畫布視窗和縮放 |
| `useFreeTransform` | `hooks/useFreeTransform` | 管理自由變形功能 |
| `useImageCrop` | `hooks/useImageCrop` | 管理圖片裁剪功能 |

### Hooks 使用範例

```javascript
import useEditorState from '@monkind/shared/components/Editor/hooks/useEditorState';

function CustomEditor() {
  const {
    elements,
    selectedId,
    addElement,
    updateElement,
    deleteElement,
    selectElement
  } = useEditorState(initialElements);

  return (
    // 自訂編輯器 UI
  );
}
```

---

## 常用工具函數

### canvasUtils

```javascript
import {
  calculateCenter,
  exportDesignToImage,
  calculateInputWidth
} from '@monkind/shared/components/Editor/utils/canvasUtils';

// 計算畫布中心點
const center = calculateCenter(canvasSize, elementSize);

// 匯出設計為圖片
const imageData = await exportDesignToImage(stageRef, product);

// 計算輸入框寬度
const width = calculateInputWidth(text, fontSize, fontFamily);
```

### imageUtils

```javascript
import { processImageColor } from '@monkind/shared/components/Editor/utils/imageUtils';

// 處理圖片顏色（濾鏡、色調調整等）
const processedImage = await processImageColor(imageUrl, filters);
```

### storageUtils

```javascript
import { saveDraft, getStorageInfo } from '@monkind/shared/components/Editor/utils/storageUtils';

// 儲存草稿到 localStorage
saveDraft(productId, { elements, backgroundColor, workName });

// 獲取儲存空間資訊
const { used, limit, percentage } = getStorageInfo();
```

### backgroundRemoval

```javascript
import { removeImageBackground } from '@monkind/shared/components/Editor/utils/backgroundRemoval';

// 移除圖片背景
const transparentImage = await removeImageBackground(imageFile);
```

---

## 組件結構

### 主要子組件

```
UniversalEditor
├── TopToolbar              # 頂部工具列
├── ToolSidebar             # 左側工具列
├── MainContentArea         # 主要內容區域
│   ├── Canvas (Konva)     # 畫布
│   └── Preview            # 預覽區
└── ToolPanels             # 右側工具面板
    ├── TemplatePanel      # 模板面板
    ├── ElementPanel       # 元素面板
    ├── TextPanel          # 文字面板
    ├── ImagePanel         # 圖片面板
    ├── BackgroundPanel    # 背景面板
    └── LayerPanel         # 圖層面板
```

---

## 常見模式

### Pattern 1: 條件式功能啟用

```jsx
<UniversalEditor
  mode="product"
  productId={productId}
  // 根據權限啟用/禁用功能
  isAdmin={user.role === 'admin'}
  showTemplateTools={user.permissions.includes('use_templates')}
/>
```

### Pattern 2: 外部狀態同步

```jsx
function SyncedEditor() {
  const [design, setDesign] = useState(initialDesign);

  return (
    <UniversalEditor
      initialElements={design.elements}
      initialBackgroundColor={design.backgroundColor}
      onElementsChange={(elements) => {
        setDesign(prev => ({ ...prev, elements }));
      }}
      onBackgroundColorChange={(color) => {
        setDesign(prev => ({ ...prev, backgroundColor: color }));
      }}
    />
  );
}
```

### Pattern 3: 多步驟儲存流程

```jsx
function MultiStepSave() {
  const handleAddToCart = async (design) => {
    try {
      // 1. 匯出設計為圖片
      const preview = await exportDesignToImage(design);

      // 2. 上傳到伺服器
      const uploadedUrl = await uploadImage(preview);

      // 3. 儲存設計資料
      const savedDesign = await API.designs.create({
        ...design,
        previewUrl: uploadedUrl
      });

      // 4. 加入購物車
      await API.cart.add({
        productId: design.productId,
        designId: savedDesign.id
      });

      navigate('/cart');
    } catch (error) {
      console.error('儲存失敗:', error);
    }
  };

  return (
    <UniversalEditor
      onAddToCart={handleAddToCart}
    />
  );
}
```

---

## 效能優化建議

### 1. 大型元素列表優化

```jsx
// 使用 React.memo 優化元素渲染
const MemoizedElement = React.memo(DesignElement);

// 虛擬化長列表
import { FixedSizeList } from 'react-window';
```

### 2. 圖片處理優化

```javascript
// 在上傳前壓縮圖片
const compressImage = async (file, maxWidth = 2048) => {
  // 使用 canvas 壓縮邏輯
};

// 使用 WebWorker 處理圖片
const worker = new Worker('image-processor.js');
```

### 3. 草稿儲存優化

```javascript
// 使用防抖避免頻繁儲存
import { debounce } from 'lodash';

const debouncedSave = debounce((design) => {
  saveDraft(design);
}, 1000);
```

---

## 故障排除

### 問題 1: 畫布不顯示

**可能原因**:
- 商品資料未載入
- printArea 未定義
- 權限問題

**解決方案**:
```jsx
// 檢查商品資料
console.log('Product:', product);
console.log('Print Area:', product?.printArea);

// 確保 printArea 有效
if (!product?.printArea) {
  return <div>商品設定不完整</div>;
}
```

### 問題 2: 圖片上傳失敗

**檢查清單**:
- 檔案大小限制（通常 10MB）
- 檔案格式支援（JPG, PNG, GIF, WEBP）
- 伺服器 CORS 設定
- API 端點是否正確

### 問題 3: 元素位置不正確

**可能原因**:
- 座標系統不一致（邏輯座標 vs 顯示座標）
- printArea 縮放比例計算錯誤

**解決方案**:
```javascript
// 使用正確的座標轉換
const scale = DISPLAY_SIZE / CANVAS_SIZE;
const displayX = logicalX * scale;
const displayY = logicalY * scale;
```

### 問題 4: 記憶體洩漏

**檢查項目**:
- Konva 節點是否正確銷毀
- 事件監聽器是否清理
- 大型圖片是否釋放

**解決方案**:
```javascript
useEffect(() => {
  // 清理函數
  return () => {
    stage.destroy();
    images.forEach(img => img.remove());
  };
}, []);
```

---

## 相關文檔

- [Editor 架構指南](./ARCHITECTURE.md)
- [Hooks 和 Utils 索引](../../HOOKS_AND_UTILS_INDEX.md)
- [常見問題集](../../../FAQ_AND_SOLUTIONS.md)

---

**文檔版本**: 1.0.0
**最後更新**: 2025-11-12
**維護者**: MonKind Team
