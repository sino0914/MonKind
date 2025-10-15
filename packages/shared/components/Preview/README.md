# ProductPreview 組件使用說明

## 概述

`ProductPreview` 是一個可重用的商品預覽組件，支援 2D 和 3D 預覽，可以在多個地方使用。

## 基本用法

```jsx
import ProductPreview from '../components/Preview/ProductPreview';

// 基本使用
<ProductPreview
  productId={1}
  designElements={designElements}
  backgroundColor="#ff6b6b"
/>
```

## Props 參數

| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| `productId` | number/string | 必須 | 商品ID |
| `designElements` | Array | `[]` | 設計元素陣列 |
| `backgroundColor` | string | `'#ffffff'` | 背景顏色 |
| `className` | string | `''` | 額外的 CSS 類名 |
| `showControls` | boolean | `true` | 是否顯示 3D 控制提示 |
| `showInfo` | boolean | `true` | 是否顯示商品資訊 |
| `width` | number | `320` | 預覽區域寬度 |
| `height` | number | `320` | 預覽區域高度 |

## 使用場景

### 1. 編輯器中的即時預覽
```jsx
<ProductPreview
  productId={currentProduct.id}
  designElements={designElements}
  backgroundColor={backgroundColor}
  width={320}
  height={320}
/>
```

### 2. 版型管理中的預覽
```jsx
<ProductPreview
  productId={template.productId}
  designElements={template.elements}
  backgroundColor={template.backgroundColor}
  width={200}
  height={150}
  showControls={false}
  showInfo={false}
/>
```

### 3. 商品詳情頁預覽
```jsx
<ProductPreview
  productId={product.id}
  designElements={[]}
  backgroundColor="#ffffff"
  width={400}
  height={400}
  className="border-2 border-gray-300"
/>
```

### 4. 購物車預覽
```jsx
<ProductPreview
  productId={cartItem.productId}
  designElements={cartItem.designData?.elements || []}
  backgroundColor={cartItem.designData?.backgroundColor || '#ffffff'}
  width={100}
  height={100}
  showControls={false}
  showInfo={false}
/>
```

## 設計元素格式

```javascript
const designElements = [
  {
    id: 'text-1',
    type: 'text',
    content: '我的文字',
    x: 160,
    y: 100,
    fontSize: 24,
    color: '#000000',
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal'
  },
  {
    id: 'image-1',
    type: 'image',
    url: 'data:image/jpeg;base64,...',
    x: 160,
    y: 200,
    width: 100,
    height: 100,
    opacity: 1,
    rotation: 0
  }
];
```

## 支援的商品類型

- **馬克杯 (mug)**：自動使用 3D 預覽，支援旋轉查看
- **其他商品**：使用 2D 預覽，支援設計區域裁切

## 注意事項

1. 組件會自動載入商品資料，無需外部傳入完整商品資訊
2. 支援錯誤處理和重試機制
3. 背景色會正確套用到設計區域
4. 圖片元素需要支援 CORS
5. 大尺寸預覽可能影響性能，建議適當調整尺寸

## 自定義樣式

```jsx
<ProductPreview
  productId={1}
  designElements={elements}
  className="shadow-lg rounded-lg border-4 border-blue-500"
  style={{ transform: 'scale(0.8)' }}
/>
```