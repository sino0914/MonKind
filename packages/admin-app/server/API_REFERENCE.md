# API Reference

完整的後端 API 端點文檔。所有 API 端點都以 `/api` 為前綴。

## 目錄

- [產品 API](#產品-api) - 產品的 CRUD 操作
- [訂單 API](#訂單-api) - 訂單管理和查詢
- [範本 API](#範本-api) - 設計範本管理
- [廠商 API](#廠商-api) - 廠商帳號管理
- [使用者 API](#使用者-api) - 使用者註冊和登入
- [元素 API](#元素-api) - 設計元素管理
- [購物車 API](#購物車-api) - 購物車操作
- [草稿 API](#草稿-api) - 設計草稿儲存
- [檔案上傳 API](#檔案上傳-api) - 檔案上傳和管理
- [定價設定 API](#定價設定-api) - 價格計算和設定

---

## 產品 API

**檔案位置**: `server/routes/products.js`

### GET /api/products

獲取所有產品列表（支援篩選）

**查詢參數：**
- `category` (string, optional) - 依分類篩選
- `featured` (boolean, optional) - 只顯示精選產品
- `active` (boolean, optional) - 只顯示啟用的產品

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "產品名稱",
      "category": "分類",
      "price": 100,
      "featured": true,
      "isActive": true,
      "type": "3D",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /api/products/stats

獲取產品統計資訊

**注意：** 必須放在 `/:id` 路由之前

**回應：**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "featured": 3,
    "active": 8,
    "with3D": 5,
    "categories": {
      "馬克杯": 3,
      "T恤": 5
    }
  }
}
```

---

### GET /api/products/:id

獲取單個產品詳情

**參數：**
- `id` (integer) - 產品 ID

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "產品名稱",
    "category": "分類",
    "price": 100,
    "description": "產品描述",
    "featured": true,
    "isActive": true,
    "type": "3D",
    "model3D": {
      "glbUrl": "/uploads/glb/xxxxx.glb",
      "printArea": { ... }
    }
  }
}
```

**錯誤回應：**
- `404` - 找不到指定產品

---

### POST /api/products

創建新產品

**請求 Body：**
```json
{
  "name": "新產品",
  "category": "分類",
  "price": 100,
  "description": "描述",
  "featured": false,
  "isActive": true,
  "type": "3D",
  "model3D": { ... }
}
```

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "新產品",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    ...
  },
  "message": "產品創建成功"
}
```

**狀態碼：** `201 Created`

---

### PUT /api/products/:id

更新產品資訊

**參數：**
- `id` (integer) - 產品 ID

**請求 Body：** (所有欄位都是 optional)
```json
{
  "name": "更新後的名稱",
  "price": 150,
  "isActive": false
}
```

**回應：**
```json
{
  "success": true,
  "data": { ... },
  "message": "產品更新成功"
}
```

**錯誤回應：**
- `404` - 找不到指定產品

---

### DELETE /api/products/:id

刪除產品

**參數：**
- `id` (integer) - 產品 ID

**回應：**
```json
{
  "success": true,
  "data": { ... },
  "message": "產品刪除成功"
}
```

**注意：**
- 目前不會自動刪除關聯的 GLB 檔案和圖片（標記為 TODO）
- 未來版本將實作檔案清理功能

**錯誤回應：**
- `404` - 找不到指定產品

---

## 訂單 API

**檔案位置**: `server/routes/orders.js`

### GET /api/orders

獲取所有訂單（管理後台用）

**查詢參數：**
- `vendorId` (integer, optional) - 篩選特定廠商的訂單項目

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "order_20240101_xxx",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "status": "pending",
      "totalAmount": 500,
      "itemCount": 2,
      "customerInfo": {
        "name": "客戶名稱",
        "email": "user@example.com",
        "phone": "0912345678",
        "address": "地址"
      },
      "items": [...]
    }
  ]
}
```

**注意：**
- 如果提供 `vendorId`，只會返回該廠商的訂單項目
- 過濾後如果沒有項目的訂單會被跳過

---

### POST /api/orders

建立新訂單

**請求 Body：**
```json
{
  "userId": "user@example.com",
  "cartItems": [
    {
      "id": 1,
      "title": "商品名稱",
      "type": "3D",
      "price": 100,
      "quantity": 2,
      "isCustom": true,
      "designData": { ... },
      "snapshot3D": "data:image/...",
      "snapshot2D": "/uploads/snapshots/xxx.jpg",
      "printFileUrl": "/uploads/print-files/xxx.png",
      "printArea": { ... },
      "vendorId": 1
    }
  ],
  "shipping": {
    "name": "收件人",
    "phone": "0912345678",
    "address": "地址",
    "method": "宅配",
    "fee": 100,
    "notes": "備註"
  },
  "payment": {
    "method": "credit_card"
  }
}
```

**回應：**
```json
{
  "success": true,
  "message": "訂單建立成功",
  "orderId": "order_20240101_xxx",
  "order": {
    "orderId": "order_20240101_xxx",
    "status": "pending",
    "items": [...],
    "totalAmount": 500,
    ...
  }
}
```

**處理流程：**
1. 生成唯一訂單 ID (`order_YYYYMMDD_random`)
2. 複製快照圖片到 `/data/orders/{orderId}/snapshots/`
3. 複製列印檔案到 `/data/orders/{orderId}/print-files/`
4. 儲存完整訂單資料到 `/data/orders/{orderId}/order.json`
5. 更新用戶訂單索引到 `/data/users/{userId}/orders.json`
6. 觸發清理舊列印檔案的背景任務

**錯誤回應：**
- `400` - 缺少必要參數或購物車為空

---

### GET /api/orders/:orderId

獲取訂單詳情

**參數：**
- `orderId` (string) - 訂單 ID

**回應：**
```json
{
  "success": true,
  "order": {
    "orderId": "order_20240101_xxx",
    "userId": "user@example.com",
    "status": "pending",
    "items": [...],
    "shipping": {...},
    "payment": {...},
    "totalAmount": 500
  }
}
```

**錯誤回應：**
- `404` - 找不到訂單

---

### GET /api/orders/users/:userId/orders

獲取用戶所有訂單（包含商品縮圖）

**參數：**
- `userId` (string) - 使用者 ID

**回應：**
```json
{
  "success": true,
  "orders": [
    {
      "orderId": "order_20240101_xxx",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "status": "pending",
      "totalAmount": 500,
      "itemCount": 2,
      "items": [
        {
          "itemId": "item_1",
          "productTitle": "商品名稱",
          "snapshot": "/data/orders/xxx/snapshots/item_1.jpg",
          "snapshotUrl": "/api/orders/xxx/snapshots/item_1.jpg",
          ...
        }
      ]
    }
  ]
}
```

**注意：**
- 自動將快照路徑轉換為 API URL
- 如果訂單檔案損壞，會使用索引資料

---

### PATCH /api/orders/:orderId/status

更新訂單狀態

**參數：**
- `orderId` (string) - 訂單 ID

**請求 Body：**
```json
{
  "status": "paid"
}
```

**有效狀態值：**
- `pending` - 待處理
- `paid` - 已付款
- `shipped` - 已出貨
- `completed` - 已完成
- `cancelled` - 已取消

**回應：**
```json
{
  "success": true,
  "message": "訂單狀態已更新",
  "order": { ... }
}
```

**特殊處理：**
- 如果狀態改為 `paid`，會自動更新 `payment.status` 和 `payment.paidAt`
- 同步更新用戶訂單索引中的狀態

**錯誤回應：**
- `400` - 無效的訂單狀態

---

### GET /api/orders/:orderId/items/:itemId/print-file

下載訂單項目的列印檔案

**參數：**
- `orderId` (string) - 訂單 ID
- `itemId` (string) - 項目 ID

**查詢參數：**
- `showCropMarks` (boolean, optional) - 是否顯示裁切線（僅在有出血區域時有效）

**回應：**
- 成功：返回 PNG 圖片檔案（強制下載）
- 失敗：返回 JSON 錯誤訊息

**錯誤回應：**
- `404` - 找不到訂單項目或列印檔案不存在
- `501` - 列印檔案不存在且伺服器端重建功能尚未實作

**注意：**
- 如果列印檔案被清理，未來版本將支援從訂單資料重建
- 重建功能需要實作伺服器端 Canvas 渲染

---

### GET /api/orders/:orderId/snapshots/:filename

獲取訂單快照圖片

**參數：**
- `orderId` (string) - 訂單 ID
- `filename` (string) - 檔案名稱

**搜尋順序：**
1. `/data/orders/{orderId}/snapshots/{filename}`
2. `/data/uploads/snapshots/{filename}` (備用)

**回應：**
- 成功：返回圖片檔案
- 失敗：返回 404

---

## 範本 API

**檔案位置**: `server/routes/templates.js`

### GET /api/templates

獲取所有範本

**查詢參數：**
- `productId` (integer, optional) - 依產品篩選
- `category` (string, optional) - 依分類篩選
- `active` (boolean, optional) - 只顯示啟用的範本

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "範本名稱",
      "productId": 1,
      "category": "分類",
      "designData": { ... },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### GET /api/templates/:id

獲取單個範本

**參數：**
- `id` (integer) - 範本 ID

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "範本名稱",
    "productId": 1,
    "designData": { ... }
  }
}
```

**錯誤回應：**
- `404` - 找不到指定範本

---

### POST /api/templates

創建新範本

**請求 Body：**
```json
{
  "name": "新範本",
  "productId": 1,
  "category": "分類",
  "designData": { ... },
  "isActive": true
}
```

**回應：**
```json
{
  "success": true,
  "data": { ... },
  "message": "模板創建成功"
}
```

**狀態碼：** `201 Created`

---

### PUT /api/templates/:id

更新範本

**參數：**
- `id` (integer) - 範本 ID

**請求 Body：** (所有欄位都是 optional)
```json
{
  "name": "更新後的名稱",
  "designData": { ... }
}
```

**回應：**
```json
{
  "success": true,
  "data": { ... },
  "message": "模板更新成功"
}
```

**錯誤回應：**
- `404` - 找不到指定範本

---

### DELETE /api/templates/:id

刪除範本

**參數：**
- `id` (integer) - 範本 ID

**回應：**
```json
{
  "success": true,
  "data": { ... },
  "message": "模板刪除成功"
}
```

**錯誤回應：**
- `404` - 找不到指定範本

---

## 廠商 API

**檔案位置**: `server/routes/vendors.js`

### GET /api/vendors

獲取所有廠商

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "廠商名稱",
      "address": "地址",
      "email": "vendor@example.com",
      "phone": "0912345678",
      "username": "vendor1",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**注意：** 不會返回密碼欄位

---

### GET /api/vendors/:id

獲取單個廠商

**參數：**
- `id` (integer) - 廠商 ID

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "廠商名稱",
    "address": "地址",
    "email": "vendor@example.com",
    ...
  }
}
```

**錯誤回應：**
- `404` - 找不到指定廠商

---

### POST /api/vendors

創建新廠商

**請求 Body：**
```json
{
  "name": "廠商名稱",
  "address": "地址",
  "email": "vendor@example.com",
  "phone": "0912345678",
  "username": "vendor1",
  "password": "password123"
}
```

**必填欄位：**
- `name`
- `email`
- `username`
- `password`

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "廠商名稱",
    "username": "vendor1",
    "isActive": true,
    ...
  }
}
```

**錯誤回應：**
- `400` - 缺少必填欄位或帳號已存在

**安全性警告：** 目前密碼為明文儲存，實際應用應使用加密

---

### PUT /api/vendors/:id

更新廠商資訊

**參數：**
- `id` (integer) - 廠商 ID

**請求 Body：** (所有欄位都是 optional)
```json
{
  "name": "新名稱",
  "email": "new@example.com",
  "password": "newpassword",
  "isActive": false
}
```

**回應：**
```json
{
  "success": true,
  "data": { ... }
}
```

**錯誤回應：**
- `404` - 找不到指定廠商

---

### DELETE /api/vendors/:id

刪除廠商

**參數：**
- `id` (integer) - 廠商 ID

**回應：**
```json
{
  "success": true,
  "message": "廠商已刪除"
}
```

**錯誤回應：**
- `404` - 找不到指定廠商

---

### POST /api/vendors/login

廠商登入

**請求 Body：**
```json
{
  "username": "vendor1",
  "password": "password123"
}
```

**回應：**
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "id": 1,
    "name": "廠商名稱",
    "username": "vendor1",
    "role": "vendor",
    ...
  }
}
```

**錯誤回應：**
- `400` - 缺少帳號或密碼
- `401` - 帳號或密碼錯誤
- `403` - 此帳號已被停用

---

## 使用者 API

**檔案位置**: `server/routes/users.js`

### GET /api/users

獲取所有使用者（管理員功能）

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "使用者名稱",
      "isAdmin": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**注意：** 不會返回密碼欄位

---

### GET /api/users/:id

獲取單個使用者

**參數：**
- `id` (integer) - 使用者 ID

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "使用者名稱",
    "isAdmin": false
  }
}
```

**錯誤回應：**
- `404` - 找不到指定使用者

---

### POST /api/users/register

使用者註冊

**請求 Body：**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "使用者名稱"
}
```

**必填欄位：**
- `email`
- `password`

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "使用者名稱",
    "isAdmin": false
  },
  "message": "用戶註冊成功"
}
```

**錯誤回應：**
- `400` - 缺少必填欄位或該電子郵件已被註冊

**安全性警告：** 目前密碼為明文儲存，實際應用應使用加密

---

### POST /api/users/login

使用者登入（支援管理員和廠商）

**請求 Body：**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

或使用 `email` 欄位：
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**登入流程：**
1. 優先從 `users.json` 查找管理員帳號
2. 如果找不到，再從 `vendors.json` 查找廠商帳號
3. 廠商登入時會標記 `isVendor: true`

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "使用者名稱",
    "isAdmin": true,
    "isVendor": false
  },
  "message": "登入成功"
}
```

**錯誤回應：**
- `400` - 缺少帳號或密碼
- `401` - 帳號或密碼錯誤

---

## 元素 API

**檔案位置**: `server/routes/elements.js`

### GET /api/elements

獲取所有元素

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "元素名稱",
      "type": "image",
      "url": "/uploads/images/xxx.jpg",
      "fileName": "xxx.jpg",
      "fileSize": 102400,
      "mimeType": "image/jpeg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/elements/:id

獲取單個元素

**參數：**
- `id` (integer) - 元素 ID

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "元素名稱",
    "type": "image",
    "url": "/uploads/images/xxx.jpg"
  }
}
```

**錯誤回應：**
- `404` - 元素不存在

---

### POST /api/elements

創建新元素

**請求 Body：**
```json
{
  "name": "新元素",
  "type": "image",
  "url": "/uploads/images/xxx.jpg",
  "fileName": "xxx.jpg",
  "fileSize": 102400,
  "mimeType": "image/jpeg"
}
```

**必填欄位：**
- `name`
- `type`
- `url`

**回應：**
```json
{
  "success": true,
  "message": "元素創建成功",
  "data": {
    "id": 1,
    "name": "新元素",
    ...
  }
}
```

**錯誤回應：**
- `400` - 缺少必要欄位

---

### PUT /api/elements/:id

更新元素

**參數：**
- `id` (integer) - 元素 ID

**請求 Body：** (所有欄位都是 optional)
```json
{
  "name": "更新後的名稱"
}
```

**回應：**
```json
{
  "success": true,
  "message": "元素更新成功",
  "data": { ... }
}
```

**錯誤回應：**
- `404` - 元素不存在

---

### DELETE /api/elements/:id

刪除元素

**參數：**
- `id` (integer) - 元素 ID

**回應：**
```json
{
  "success": true,
  "message": "元素刪除成功",
  "data": { ... }
}
```

**注意：** 會同時刪除關聯的檔案（如果存在於 `/uploads/` 目錄）

**錯誤回應：**
- `404` - 元素不存在

---

### GET /api/elements/stats

獲取元素統計

**注意：** 此路由路徑有問題，應該放在 `/:id` 之前

**回應：**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "byType": {
      "image": 8,
      "icon": 2
    },
    "totalSize": 2048000
  }
}
```

---

## 購物車 API

**檔案位置**: `server/routes/cart.js`

### GET /api/cart

獲取用戶購物車

**使用者識別：** 基於 session ID（預設為 'guest'）

**回應：**
```json
{
  "success": true,
  "cart": [
    {
      "id": "1",
      "title": "商品名稱",
      "price": 100,
      "quantity": 2,
      "image": "/uploads/images/xxx.jpg"
    }
  ]
}
```

---

### POST /api/cart

更新用戶購物車（完整替換）

**請求 Body：**
```json
{
  "cart": [
    {
      "id": "1",
      "title": "商品名稱",
      "price": 100,
      "quantity": 1
    }
  ]
}
```

**回應：**
```json
{
  "success": true,
  "cart": [...]
}
```

**錯誤回應：**
- `400` - 無效的購物車資料

---

### POST /api/cart/add

添加商品到購物車

**請求 Body：**
```json
{
  "product": {
    "id": "1",
    "title": "商品名稱",
    "price": 100
  }
}
```

**行為：**
- 如果商品已存在，數量 +1
- 如果是新商品，加入購物車（數量設為 1）

**回應：**
```json
{
  "success": true,
  "cart": [...]
}
```

---

### PUT /api/cart/:productId

更新商品數量

**參數：**
- `productId` (string) - 商品 ID

**請求 Body：**
```json
{
  "quantity": 3
}
```

**行為：**
- 如果數量 <= 0，移除該商品
- 否則更新數量

**回應：**
```json
{
  "success": true,
  "cart": [...]
}
```

---

### DELETE /api/cart/:productId

移除商品

**參數：**
- `productId` (string) - 商品 ID

**回應：**
```json
{
  "success": true,
  "cart": [...]
}
```

---

### DELETE /api/cart

清空購物車

**回應：**
```json
{
  "success": true,
  "cart": []
}
```

---

## 草稿 API

**檔案位置**: `server/routes/drafts.js`

### GET /api/drafts/:userId

獲取用戶的所有草稿

**參數：**
- `userId` (string) - 使用者 ID

**回應：**
```json
[
  {
    "id": "draft_xxx",
    "productId": 1,
    "name": "我的設計",
    "elements": [...],
    "backgroundColor": "#ffffff",
    "timestamp": 1234567890,
    "snapshot3D": "data:image/...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**注意：** 如果檔案不存在，返回空陣列

---

### POST /api/drafts/:userId

儲存草稿

**參數：**
- `userId` (string) - 使用者 ID

**請求 Body：**
```json
{
  "id": "draft_xxx",
  "productId": 1,
  "name": "我的設計",
  "elements": [...],
  "backgroundColor": "#ffffff",
  "timestamp": 1234567890,
  "snapshot3D": "data:image/..."
}
```

**必填欄位：**
- `id`
- `productId`

**行為：**
- 如果草稿 ID 已存在，更新該草稿（並更新 `updatedAt`）
- 如果是新草稿，加入列表（並設定 `createdAt` 和 `updatedAt`）

**回應：**
```json
{
  "success": true,
  "draft": { ... }
}
```

**錯誤回應：**
- `400` - 缺少必要欄位

---

### DELETE /api/drafts/:userId/:draftId

刪除草稿

**參數：**
- `userId` (string) - 使用者 ID
- `draftId` (string) - 草稿 ID

**回應：**
```json
{
  "success": true
}
```

**錯誤回應：**
- `404` - 找不到草稿或找不到指定的草稿

---

### POST /api/drafts/:userId/migrate

批量遷移草稿（從 localStorage）

**參數：**
- `userId` (string) - 使用者 ID

**請求 Body：**
```json
{
  "drafts": [
    {
      "id": "draft_1",
      "productId": 1,
      ...
    },
    {
      "id": "draft_2",
      "productId": 2,
      ...
    }
  ]
}
```

**行為：**
- 合併草稿，避免重複（基於草稿 ID）
- 只新增不存在的草稿

**回應：**
```json
{
  "success": true,
  "migratedCount": 2,
  "totalCount": 5
}
```

**錯誤回應：**
- `400` - 無效的草稿資料格式

---

## 檔案上傳 API

**檔案位置**: `server/routes/upload.js`

### POST /api/upload/glb

上傳 GLB 3D 模型檔案

**請求：** `multipart/form-data`
- `glb` (file) - GLB 檔案

**限制：**
- 檔案大小上限：200MB
- 支援格式：.glb, .gltf

**回應：**
```json
{
  "success": true,
  "message": "GLB 文件上傳成功",
  "data": {
    "filename": "xxxx.glb",
    "originalName": "model.glb",
    "size": 1024000,
    "sizeKB": "1000.00",
    "sizeMB": "0.98",
    "mimetype": "model/gltf-binary",
    "url": "/uploads/glb/xxxx.glb",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "fileInfo": { ... }
  }
}
```

**錯誤回應：**
- `400` - 沒有接收到文件或不支援的文件類型

---

### POST /api/upload/image

上傳圖片檔案

**請求：** `multipart/form-data`
- `image` (file) - 圖片檔案

**限制：**
- 檔案大小上限：200MB
- 支援格式：.jpg, .jpeg, .png, .webp, .svg

**回應：**
```json
{
  "success": true,
  "message": "圖片上傳成功",
  "data": {
    "filename": "xxxx.jpg",
    "originalName": "photo.jpg",
    "size": 102400,
    "sizeKB": "100.00",
    "mimetype": "image/jpeg",
    "url": "/uploads/images/xxxx.jpg",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "fileInfo": { ... }
  }
}
```

---

### POST /api/upload/element

上傳元素圖片

**說明：** 與 `/api/upload/image` 相同，但使用 `element` 欄位名

**請求：** `multipart/form-data`
- `element` (file) - 元素圖片

**回應格式：** 同 `/api/upload/image`

---

### POST /api/upload/editor-image

上傳編輯器圖片（使用者專屬目錄）

**請求：** `multipart/form-data`
- `editorImage` (file) - 編輯器圖片
- `userId` (string, optional) - 使用者 ID（預設為 'guest'）

**儲存位置：** `/data/users/{userId}/images/`

**回應：**
```json
{
  "success": true,
  "message": "編輯器圖片上傳成功",
  "data": {
    "filename": "xxxx.jpg",
    "url": "/data/users/guest/images/xxxx.jpg",
    "userId": "guest",
    ...
  }
}
```

---

### POST /api/upload/snapshot

上傳 3D 快照（接收 base64）

**請求 Body：**
```json
{
  "base64Image": "data:image/png;base64,iVBORw0KG...",
  "productId": 1
}
```

**儲存位置：** `/data/uploads/snapshots/`

**回應：**
```json
{
  "success": true,
  "message": "快照上傳成功",
  "data": {
    "filename": "xxxx.jpg",
    "size": 102400,
    "sizeKB": "100.00",
    "url": "/uploads/snapshots/xxxx.jpg",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "productId": 1
  }
}
```

**錯誤回應：**
- `400` - 沒有接收到快照資料或無效的 base64 圖片格式

---

### POST /api/upload/print-file

上傳高解析度列印檔案

**請求：** `multipart/form-data`
- `printFile` (file) - 列印檔案（PNG）
- `productId` (string, optional) - 產品 ID

**儲存位置：** `/data/uploads/print-files/`

**回應：**
```json
{
  "success": true,
  "message": "列印檔案上傳成功",
  "data": {
    "filename": "xxxx.png",
    "size": 5242880,
    "sizeMB": "5.00",
    "url": "/uploads/print-files/xxxx.png",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "productId": 1
  }
}
```

**副作用：** 上傳完成後會觸發清理舊列印檔案的背景任務

---

### POST /api/upload/multiple

批量上傳檔案

**請求：** `multipart/form-data`
- `files` (file[]) - 最多 5 個檔案

**回應：**
```json
{
  "success": true,
  "message": "成功上傳 3 個文件",
  "data": [
    {
      "filename": "xxxx.glb",
      "originalName": "model.glb",
      "type": "glb",
      "url": "/uploads/glbs/xxxx.glb",
      ...
    },
    ...
  ]
}
```

**錯誤回應：**
- `400` - 文件數量超過限制（最多 5 個）

---

### GET /api/upload/files

獲取上傳的檔案列表

**查詢參數：**
- `type` (string, optional) - 檔案類型
  - `glb` - 只返回 GLB 檔案
  - `images` - 只返回一般圖片
  - `element` - 返回元素圖片（同 images）
  - `editor-image` - 返回編輯器圖片（需搭配 userId）
  - `all` - 返回所有檔案
- `userId` (string, optional) - 使用者 ID（僅在 type=editor-image 時需要）

**回應 (type=glb 或 images 或 all)：**
```json
{
  "success": true,
  "data": {
    "glb": [
      {
        "filename": "xxxx.glb",
        "url": "/uploads/glb/xxxx.glb",
        "size": 1024000,
        "sizeKB": "1000.00",
        "sizeMB": "0.98",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "images": [...]
  }
}
```

**回應 (type=editor-image)：**
```json
[
  {
    "filename": "xxxx.jpg",
    "url": "/data/users/guest/images/xxxx.jpg",
    "userId": "guest",
    "size": 102400,
    ...
  }
]
```

---

### DELETE /api/upload/file/:type/:filename

刪除檔案

**參數：**
- `type` (string) - 檔案類型 (glb, images, editor-image, element)
- `filename` (string) - 檔案名稱

**查詢參數：**
- `userId` (string, optional) - 使用者 ID（僅在 type=editor-image 時需要）

**回應：**
```json
{
  "success": true,
  "message": "文件刪除成功"
}
```

**錯誤回應：**
- `400` - 無效的文件類型
- `404` - 文件不存在

---

### GET /api/upload/storage

獲取儲存空間使用情況

**回應：**
```json
{
  "success": true,
  "data": {
    "total": {
      "bytes": 10485760,
      "kb": "10240.00",
      "mb": "10.00",
      "gb": "0.01"
    },
    "glb": {
      "bytes": 5242880,
      "mb": "5.00"
    },
    "images": {
      "bytes": 5242880,
      "mb": "5.00"
    }
  }
}
```

---

## 定價設定 API

**檔案位置**: `server/routes/pricing-settings.js`

### GET /api/pricing-settings

獲取所有定價設定

**回應：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "標準定價",
      "description": "一般客製化定價方案",
      "textElementPrice": 10,
      "imageElementPrice": 30,
      "minimumDesignFee": 50,
      "enableMinimumFee": true,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET /api/pricing-settings/active

獲取當前啟用的定價方案

**回應：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "標準定價",
    "textElementPrice": 10,
    "imageElementPrice": 30,
    "minimumDesignFee": 50,
    "enableMinimumFee": true,
    ...
  }
}
```

**預設值：** 如果沒有啟用的方案，返回預設值：
```json
{
  "textElementPrice": 10,
  "imageElementPrice": 30,
  "minimumDesignFee": 50,
  "enableMinimumFee": true
}
```

---

### GET /api/pricing-settings/:id

獲取單個定價設定

**參數：**
- `id` (integer) - 設定 ID

**回應：**
```json
{
  "success": true,
  "data": { ... }
}
```

**錯誤回應：**
- `404` - 找不到該定價設定

---

### POST /api/pricing-settings

創建新定價設定

**請求 Body：**
```json
{
  "name": "新定價方案",
  "description": "描述",
  "textElementPrice": 10,
  "imageElementPrice": 30,
  "minimumDesignFee": 50,
  "enableMinimumFee": true,
  "isActive": false
}
```

**預設值：**
- `name`: "新定價方案"
- `description`: ""
- `textElementPrice`: 0
- `imageElementPrice`: 0
- `minimumDesignFee`: 0
- `enableMinimumFee`: true
- `isActive`: false

**行為：**
- 如果 `isActive` 為 true，會將其他所有設定的 `isActive` 設為 false

**回應：**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### PUT /api/pricing-settings/:id

更新定價設定

**參數：**
- `id` (integer) - 設定 ID

**請求 Body：** (所有欄位都是 optional)
```json
{
  "name": "更新後的名稱",
  "textElementPrice": 15,
  "isActive": true
}
```

**行為：**
- 如果 `isActive` 更新為 true，會將其他所有設定的 `isActive` 設為 false

**回應：**
```json
{
  "success": true,
  "data": { ... }
}
```

**錯誤回應：**
- `404` - 找不到該定價設定

---

### DELETE /api/pricing-settings/:id

刪除定價設定

**參數：**
- `id` (integer) - 設定 ID

**限制：** 不允許刪除啟用中的設定

**回應：**
```json
{
  "success": true,
  "message": "刪除成功"
}
```

**錯誤回應：**
- `404` - 找不到該定價設定
- `400` - 無法刪除啟用中的定價設定

---

### POST /api/pricing-settings/calculate

計算價格

**請求 Body：**
```json
{
  "productPrice": 100,
  "designElements": [
    { "type": "text", "content": "Hello" },
    { "type": "image", "url": "/uploads/xxx.jpg" },
    { "type": "text", "content": "World" }
  ]
}
```

**計算邏輯：**
1. 統計文字元素和圖片元素數量
2. 計算元素費用 = (文字數量 × 文字單價) + (圖片數量 × 圖片單價)
3. 如果啟用最低設計費且元素總數 > 0 且元素費用 < 最低設計費，則設計費用 = 最低設計費
4. 總價 = 產品價格 + 設計費用

**回應：**
```json
{
  "success": true,
  "data": {
    "basePrice": 100,
    "designCost": 50,
    "totalPrice": 150,
    "breakdown": {
      "textCount": 2,
      "imageCount": 1,
      "textCost": 20,
      "imageCost": 30,
      "minimumFeeApplied": false
    }
  }
}
```

**錯誤回應：**
- `400` - 缺少必要參數

---

## 通用錯誤回應格式

所有 API 在發生錯誤時都會返回以下格式：

```json
{
  "success": false,
  "message": "錯誤訊息描述"
}
```

某些 API 可能會包含額外的 `error` 欄位：

```json
{
  "success": false,
  "message": "錯誤訊息描述",
  "error": "詳細錯誤資訊"
}
```

---

## 常見 HTTP 狀態碼

- `200 OK` - 請求成功
- `201 Created` - 資源創建成功
- `400 Bad Request` - 請求參數錯誤或缺少必要欄位
- `401 Unauthorized` - 未授權（帳號密碼錯誤）
- `403 Forbidden` - 禁止存取（帳號被停用等）
- `404 Not Found` - 找不到資源
- `500 Internal Server Error` - 伺服器內部錯誤
- `501 Not Implemented` - 功能尚未實作

---

## 注意事項

### 安全性問題
1. **密碼儲存**：目前所有密碼都是明文儲存在 JSON 檔案中，實際應用必須使用 bcrypt 等加密方式
2. **認證機制**：目前沒有實作 JWT 或 Session 認證，建議加入
3. **輸入驗證**：部分 API 缺乏完整的輸入驗證，建議加強

### 檔案管理
1. **檔案清理**：產品刪除時不會自動刪除關聯的 GLB 和圖片檔案
2. **列印檔案**：舊的列印檔案會定期清理，但訂單中的列印檔案如果遺失需要手動處理
3. **儲存空間**：目前沒有儲存空間配額限制

### 資料一致性
1. **外鍵關聯**：JSON 檔案資料庫沒有外鍵約束，刪除資料時需手動處理關聯
2. **並發問題**：JSON 檔案讀寫沒有鎖定機制，高並發情況下可能有資料競爭問題

---

## 開發建議

### 查詢 API 時的最佳實踐
1. 使用此文檔快速查找所需的 API 端點
2. 查看請求格式和必填欄位
3. 注意錯誤回應和狀態碼
4. 如需更詳細的實作細節，再查看對應的路由檔案

### 新增 API 時的檢查清單
1. 更新此文檔，加入新的 API 端點
2. 遵循現有的回應格式（`{ success, data, message }`）
3. 實作適當的錯誤處理
4. 加入必要的輸入驗證
5. 考慮資料一致性和並發問題

---

**最後更新：** 2024-01-12
**API 版本：** v1
**維護者：** MonKind 開發團隊
