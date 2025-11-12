# Server API Routes 參考文檔

## 概述

本文檔提供 MonKind Admin Server 所有 API 路由的快速參考索引。所有 API 端點的基礎路徑為 `/api`。

**伺服器位置**: `packages/admin-app/server/`
**主要路由檔案**: `routes/*.js`
**端口**: 5000 (開發環境)

---

## 快速索引

| 模組 | 端點數量 | 檔案 | 主要功能 |
|------|---------|------|---------|
| [Auth](#auth-認證) | 3 | `routes/auth.js` | 用戶認證、登入登出 |
| [Cart](#cart-購物車) | 6 | `routes/cart.js` | 購物車管理 |
| [Drafts](#drafts-草稿) | 4 | `routes/drafts.js` | 設計草稿管理 |
| [Elements](#elements-元素) | 6 | `routes/elements.js` | 設計元素庫 |
| [Orders](#orders-訂單) | 6 | `routes/orders.js` | 訂單處理與管理 |
| [Products](#products-商品) | 9 | `routes/products.js` | 商品 CRUD |
| [Templates](#templates-模板) | 6 | `routes/templates.js` | 模板管理 |
| [Upload](#upload-上傳) | 4 | `routes/upload.js` | 檔案上傳處理 |
| [Users](#users-用戶) | 5 | `routes/users.js` | 用戶管理 |

**總計**: 49 個 API 端點

---

## Auth (認證)

**檔案**: `routes/auth.js`

### POST /api/auth/login
**用途**: 用戶登入

**請求**:
```json
{
  "username": "string",
  "password": "string"
}
```

**回應**:
```json
{
  "message": "登入成功",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  },
  "token": "jwt_token_here"
}
```

### POST /api/auth/logout
**用途**: 用戶登出

**回應**:
```json
{
  "message": "登出成功"
}
```

### GET /api/auth/me
**用途**: 獲取當前用戶資訊

**回應**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin"
}
```

---

## Cart (購物車)

**檔案**: `routes/cart.js`

### GET /api/cart
**用途**: 獲取用戶購物車（基於 session ID）

**回應**:
```json
{
  "items": [
    {
      "id": "cart_item_id",
      "product": { /* product object */ },
      "quantity": 1,
      "design": { /* design data */ },
      "price": 299
    }
  ],
  "total": 299
}
```

### POST /api/cart
**用途**: 更新用戶購物車（完整替換）

**請求**:
```json
{
  "items": [ /* array of cart items */ ]
}
```

### POST /api/cart/add
**用途**: 添加商品到購物車

**請求**:
```json
{
  "productId": 1,
  "quantity": 1,
  "design": {
    "elements": [],
    "backgroundColor": "#ffffff",
    "workName": "我的設計"
  }
}
```

### DELETE /api/cart/:productId
**用途**: 移除指定商品

**參數**: `productId` - 商品 ID

### PUT /api/cart/:productId
**用途**: 更新商品數量

**請求**:
```json
{
  "quantity": 2
}
```

### DELETE /api/cart
**用途**: 清空購物車

---

## Drafts (草稿)

**檔案**: `routes/drafts.js`

### GET /api/drafts/:userId
**用途**: 獲取用戶的所有草稿

**參數**: `userId` - 用戶 ID

**回應**:
```json
{
  "drafts": [
    {
      "id": "draft_id",
      "productId": 1,
      "design": { /* design data */ },
      "createdAt": "2025-11-12T10:00:00Z",
      "updatedAt": "2025-11-12T10:30:00Z"
    }
  ]
}
```

### POST /api/drafts/:userId
**用途**: 儲存新草稿或更新現有草稿

**請求**:
```json
{
  "draftId": "draft_id_optional",
  "productId": 1,
  "design": {
    "elements": [],
    "backgroundColor": "#ffffff",
    "workName": "我的作品"
  }
}
```

### DELETE /api/drafts/:userId/:draftId
**用途**: 刪除指定草稿

**參數**:
- `userId` - 用戶 ID
- `draftId` - 草稿 ID

### POST /api/drafts/:userId/migrate
**用途**: 從 localStorage 遷移草稿到伺服器

**請求**:
```json
{
  "drafts": [
    {
      "productId": 1,
      "design": { /* design data */ }
    }
  ]
}
```

---

## Elements (元素)

**檔案**: `routes/elements.js`

設計元素庫，提供預製的文字、圖片、形狀等元素。

### GET /api/elements
**用途**: 獲取所有元素

**查詢參數**:
- `type` - 元素類型 (text, image, shape)
- `category` - 元素分類

**回應**:
```json
{
  "elements": [
    {
      "id": 1,
      "type": "text",
      "category": "標題",
      "name": "大標題",
      "data": {
        "text": "標題文字",
        "fontSize": 48,
        "fontFamily": "Arial"
      },
      "thumbnail": "/thumbnails/text-1.png"
    }
  ]
}
```

### GET /api/elements/:id
**用途**: 獲取單個元素詳細資訊

### POST /api/elements
**用途**: 創建新元素

**請求**:
```json
{
  "type": "text",
  "category": "標題",
  "name": "新標題樣式",
  "data": { /* element data */ }
}
```

### PUT /api/elements/:id
**用途**: 更新元素

### DELETE /api/elements/:id
**用途**: 刪除元素

### GET /api/elements/stats
**用途**: 獲取元素統計資訊

**回應**:
```json
{
  "total": 150,
  "byType": {
    "text": 50,
    "image": 70,
    "shape": 30
  },
  "byCategory": {
    "標題": 20,
    "圖示": 40,
    "裝飾": 30
  }
}
```

---

## Orders (訂單)

**檔案**: `routes/orders.js` (701 行)

### GET /api/orders
**用途**: 獲取訂單列表（支援分頁和篩選）

**查詢參數**:
- `page` - 頁碼 (預設: 1)
- `limit` - 每頁數量 (預設: 20)
- `status` - 訂單狀態篩選
- `userId` - 用戶 ID 篩選
- `startDate` - 開始日期
- `endDate` - 結束日期

**回應**:
```json
{
  "orders": [
    {
      "id": "ORDER-20251112-001",
      "userId": "user_123",
      "status": "pending",
      "items": [
        {
          "productId": 1,
          "quantity": 2,
          "design": { /* design data */ },
          "price": 299,
          "subtotal": 598
        }
      ],
      "total": 598,
      "shippingAddress": { /* address object */ },
      "createdAt": "2025-11-12T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### POST /api/orders
**用途**: 創建新訂單（從購物車結帳）

**請求**:
```json
{
  "userId": "user_123",
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "design": { /* design data */ },
      "price": 299
    }
  ],
  "shippingAddress": {
    "name": "張三",
    "phone": "0912345678",
    "address": "台北市信義區...",
    "zipCode": "110"
  },
  "paymentMethod": "credit_card",
  "notes": "請小心包裝"
}
```

**處理流程**:
1. 驗證商品庫存
2. 計算總金額
3. 產生訂單編號
4. 生成印刷檔案
5. 清空購物車
6. 發送確認郵件

### GET /api/orders/:orderId
**用途**: 獲取單個訂單詳細資訊

### GET /api/orders/users/:userId/orders
**用途**: 獲取指定用戶的所有訂單

### PATCH /api/orders/:orderId/status
**用途**: 更新訂單狀態

**請求**:
```json
{
  "status": "processing",
  "notes": "訂單處理中"
}
```

**允許的狀態**:
- `pending` - 待處理
- `processing` - 處理中
- `shipped` - 已出貨
- `delivered` - 已送達
- `cancelled` - 已取消

### GET /api/orders/:orderId/items/:itemId/print-file
**用途**: 獲取訂單項目的印刷檔案

**回應**:
- 返回生成的印刷檔案 (PNG)
- 包含設計區域和出血區域
- 適合直接送印

---

## Products (商品)

**檔案**: `routes/products.js`

### GET /api/products
**用途**: 獲取所有商品

**查詢參數**:
- `category` - 類別篩選
- `active` - 是否只顯示啟用商品

**回應**:
```json
{
  "products": [
    {
      "id": 1,
      "title": "經典白色馬克杯",
      "category": "mug",
      "price": 299,
      "image": "/uploads/products/mug-1.jpg",
      "mockupImage": "/uploads/mockups/mug-mockup.jpg",
      "printArea": {
        "x": 50,
        "y": 50,
        "width": 200,
        "height": 150
      },
      "bleedArea": {
        "mode": "uniform",
        "value": 3
      },
      "type": "2D",
      "isActive": true,
      "featured": false
    }
  ]
}
```

### GET /api/products/:id
**用途**: 獲取單個商品詳細資訊

### POST /api/products
**用途**: 創建新商品

### PUT /api/products/:id
**用途**: 更新商品資訊

### DELETE /api/products/:id
**用途**: 刪除商品

### POST /api/products/:id/upload-glb
**用途**: 上傳 3D 模型 (GLB 檔案)

**請求**: `multipart/form-data`
- `glb` - GLB 檔案

**回應**:
```json
{
  "message": "GLB 上傳成功",
  "product": {
    /* updated product with model3D */
  }
}
```

### DELETE /api/products/:id/glb
**用途**: 移除 3D 模型

### POST /api/products/:id/mockup
**用途**: 上傳商品預覽圖

### DELETE /api/products/:id/mockup
**用途**: 刪除商品預覽圖

---

## Templates (模板)

**檔案**: `routes/templates.js`

### GET /api/templates
**用途**: 獲取所有模板

**查詢參數**:
- `category` - 類別篩選
- `featured` - 是否只顯示精選模板

**回應**:
```json
{
  "templates": [
    {
      "id": 1,
      "name": "生日快樂模板",
      "category": "birthday",
      "thumbnail": "/uploads/templates/template-1-thumb.jpg",
      "preview": "/uploads/templates/template-1.jpg",
      "elements": [
        {
          "id": "element-1",
          "type": "text",
          "text": "生日快樂！",
          /* other element properties */
        }
      ],
      "backgroundColor": "#ffe0f0",
      "featured": true,
      "isActive": true
    }
  ]
}
```

### GET /api/templates/:id
**用途**: 獲取單個模板詳細資訊

### POST /api/templates
**用途**: 創建新模板

### PUT /api/templates/:id
**用途**: 更新模板

### DELETE /api/templates/:id
**用途**: 刪除模板

### POST /api/templates/:id/thumbnail
**用途**: 上傳模板縮圖

---

## Upload (上傳)

**檔案**: `routes/upload.js` (651 行)

處理所有檔案上傳操作，包括圖片壓縮、格式轉換、安全檢查等。

### POST /api/upload/image
**用途**: 上傳圖片（用於設計元素）

**請求**: `multipart/form-data`
- `image` - 圖片檔案

**支援格式**: JPG, PNG, GIF, WEBP
**檔案大小限制**: 10MB
**自動處理**:
- 壓縮大型圖片
- 轉換為 Base64
- 生成縮圖

**回應**:
```json
{
  "message": "圖片上傳成功",
  "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "metadata": {
    "originalSize": 2048576,
    "compressedSize": 512000,
    "width": 1920,
    "height": 1080,
    "format": "png"
  }
}
```

### POST /api/upload/product-image
**用途**: 上傳商品圖片

**特殊處理**:
- 產生多種尺寸（thumbnail, medium, large）
- 儲存到檔案系統
- 返回 URL 而非 Base64

**回應**:
```json
{
  "imageUrl": "/uploads/products/product-123-abc.jpg",
  "sizes": {
    "thumbnail": "/uploads/products/product-123-abc-thumb.jpg",
    "medium": "/uploads/products/product-123-abc-medium.jpg",
    "large": "/uploads/products/product-123-abc-large.jpg"
  }
}
```

### POST /api/upload/mockup
**用途**: 上傳商品預覽圖（mockup）

### POST /api/upload/template-thumbnail
**用途**: 上傳模板縮圖

**處理流程**:
1. 檢查檔案類型和大小
2. 壓縮圖片（如需要）
3. 生成縮圖
4. 儲存到指定目錄
5. 返回 URL

---

## Users (用戶)

**檔案**: `routes/users.js`

### GET /api/users
**用途**: 獲取所有用戶（管理員）

**查詢參數**:
- `role` - 角色篩選
- `active` - 是否啟用

### GET /api/users/:id
**用途**: 獲取單個用戶資訊

### POST /api/users
**用途**: 創建新用戶

**請求**:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```

### PUT /api/users/:id
**用途**: 更新用戶資訊

### DELETE /api/users/:id
**用途**: 刪除用戶

---

## 錯誤處理

所有 API 端點遵循統一的錯誤格式：

### 成功回應 (200-299)
```json
{
  "message": "操作成功",
  "data": { /* response data */ }
}
```

### 錯誤回應 (400-599)
```json
{
  "error": "錯誤訊息",
  "details": "詳細錯誤說明",
  "code": "ERROR_CODE"
}
```

### 常見錯誤碼

| HTTP 狀態碼 | 說明 | 範例 |
|------------|------|------|
| 400 | 請求格式錯誤 | 缺少必要欄位、資料格式不正確 |
| 401 | 未認證 | 需要登入、Token 無效 |
| 403 | 無權限 | 非管理員嘗試訪問管理功能 |
| 404 | 資源不存在 | 商品、訂單不存在 |
| 409 | 衝突 | 用戶名已存在、訂單狀態衝突 |
| 413 | 檔案過大 | 上傳檔案超過限制 |
| 500 | 伺服器錯誤 | 內部錯誤、資料庫錯誤 |

---

## 認證與授權

### Session-based 認證

目前使用 Session-based 認證：

```javascript
// 登入後會設定 session
req.session.userId = user.id;
req.session.role = user.role;

// 保護的路由會檢查 session
if (!req.session.userId) {
  return res.status(401).json({ error: '未登入' });
}
```

### 角色權限

| 角色 | 權限 |
|------|------|
| `admin` | 所有功能（包括商品管理、訂單管理、用戶管理） |
| `user` | 一般用戶功能（設計、購物車、訂單查詢） |
| `guest` | 瀏覽商品、使用編輯器（但不能下單） |

---

## 檔案上傳規範

### 圖片上傳

**接受的格式**:
- JPG/JPEG
- PNG
- GIF
- WEBP

**大小限制**:
- 設計元素圖片: 10MB
- 商品圖片: 5MB
- 模板縮圖: 2MB

**處理流程**:
```
1. 檔案驗證 (類型、大小)
2. 安全檢查 (防止惡意檔案)
3. 圖片壓縮 (如超過限制)
4. 格式轉換 (統一為 PNG/JPG)
5. 生成縮圖 (如需要)
6. 儲存到檔案系統或轉為 Base64
7. 返回 URL 或 Base64
```

### 3D 模型上傳

**接受的格式**:
- GLB (GLTF Binary)
- GLTF

**大小限制**: 50MB

**處理流程**:
```
1. 檔案驗證
2. 儲存到 uploads/models/
3. 更新商品的 model3D 資料
4. 生成預覽圖（可選）
```

---

## 常見使用模式

### Pattern 1: 完整購物流程

```javascript
// 1. 瀏覽商品
const products = await fetch('/api/products').then(r => r.json());

// 2. 選擇商品並設計
// (使用 UniversalEditor)

// 3. 加入購物車
await fetch('/api/cart/add', {
  method: 'POST',
  body: JSON.stringify({
    productId: 123,
    design: { /* design data */ }
  })
});

// 4. 查看購物車
const cart = await fetch('/api/cart').then(r => r.json());

// 5. 建立訂單
const order = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'user_123',
    items: cart.items,
    shippingAddress: { /* address */ }
  })
});

// 6. 追蹤訂單
const orderDetails = await fetch(`/api/orders/${order.id}`).then(r => r.json());
```

### Pattern 2: 草稿管理流程

```javascript
// 1. 載入用戶草稿
const drafts = await fetch('/api/drafts/user_123').then(r => r.json());

// 2. 儲存新草稿
await fetch('/api/drafts/user_123', {
  method: 'POST',
  body: JSON.stringify({
    productId: 123,
    design: { /* design data */ }
  })
});

// 3. 更新草稿
await fetch('/api/drafts/user_123', {
  method: 'POST',
  body: JSON.stringify({
    draftId: 'draft_abc',
    design: { /* updated design */ }
  })
});

// 4. 刪除草稿
await fetch('/api/drafts/user_123/draft_abc', {
  method: 'DELETE'
});
```

### Pattern 3: 圖片上傳流程

```javascript
// 1. 準備 FormData
const formData = new FormData();
formData.append('image', fileInput.files[0]);

// 2. 上傳圖片
const response = await fetch('/api/upload/image', {
  method: 'POST',
  body: formData
});

const { imageUrl } = await response.json();

// 3. 使用上傳的圖片
addImageElement({
  type: 'image',
  src: imageUrl,
  x: 100,
  y: 100,
  width: 200,
  height: 200
});
```

---

## 效能優化建議

### 1. 使用分頁

```javascript
// 不好的做法 - 一次載入所有訂單
const allOrders = await fetch('/api/orders');

// 好的做法 - 使用分頁
const orders = await fetch('/api/orders?page=1&limit=20');
```

### 2. 快取常用資料

```javascript
// 快取商品列表（不常變動）
let productsCache = null;
let cacheTime = 0;

async function getProducts() {
  if (productsCache && Date.now() - cacheTime < 300000) { // 5分鐘
    return productsCache;
  }

  productsCache = await fetch('/api/products').then(r => r.json());
  cacheTime = Date.now();
  return productsCache;
}
```

### 3. 批次操作

```javascript
// 不好 - 多次請求
for (const item of cartItems) {
  await fetch(`/api/cart/${item.id}`, { method: 'DELETE' });
}

// 好 - 一次清空
await fetch('/api/cart', { method: 'DELETE' });
```

---

## 測試端點

可使用以下 curl 命令測試 API：

```bash
# 獲取所有商品
curl http://localhost:5000/api/products

# 登入
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 創建訂單
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_123","items":[...]}'

# 上傳圖片
curl -X POST http://localhost:5000/api/upload/image \
  -F "image=@/path/to/image.jpg"
```

---

## 相關文檔

- [API 完整參考](./API_REFERENCE.md) - 詳細的請求/回應格式
- [常見問題集](../../../FAQ_AND_SOLUTIONS.md) - API 相關常見問題
- [UniversalEditor API](../../shared/components/Editor/UNIVERSAL_EDITOR_API.md) - 編輯器組件 API

---

**文檔版本**: 1.0.0
**最後更新**: 2025-11-12
**維護者**: MonKind Team
**總端點數**: 49
