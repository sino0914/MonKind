/**
 * 訂單管理 API 路由
 * 處理訂單的建立、查詢、更新等操作
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// 資料目錄
const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_DIR = path.join(DATA_DIR, 'orders');
const USERS_DIR = path.join(DATA_DIR, 'users');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// 確保目錄存在
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// 生成訂單 ID
function generateOrderId() {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 9);
  return `order_${date}_${random}`;
}

// 複製快照到訂單目錄
async function copySnapshotToOrder(snapshotUrl, orderId, itemId) {
  if (!snapshotUrl) return null;

  const snapshotsDir = path.join(ORDERS_DIR, orderId, 'snapshots');
  await ensureDir(snapshotsDir);

  // 如果是 URL (已上傳到 /uploads/snapshots/)
  if (typeof snapshotUrl === 'string' && snapshotUrl.startsWith('/uploads/')) {
    try {
      const sourcePath = path.join(__dirname, '..', snapshotUrl);
      const ext = path.extname(snapshotUrl) || '.jpg';
      const destFileName = `${itemId}${ext}`;
      const destPath = path.join(snapshotsDir, destFileName);

      await fs.copyFile(sourcePath, destPath);
      return `/data/orders/${orderId}/snapshots/${destFileName}`;
    } catch (error) {
      console.error('複製快照失敗:', error);
      return snapshotUrl; // 失敗時返回原 URL
    }
  }

  // 如果是 base64，儲存為檔案
  if (typeof snapshotUrl === 'string' && snapshotUrl.startsWith('data:image/')) {
    try {
      const matches = snapshotUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) return snapshotUrl;

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const destFileName = `${itemId}.${ext}`;
      const destPath = path.join(snapshotsDir, destFileName);

      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(destPath, buffer);

      return `/data/orders/${orderId}/snapshots/${destFileName}`;
    } catch (error) {
      console.error('儲存 base64 快照失敗:', error);
      return snapshotUrl; // 失敗時返回原 base64
    }
  }

  return snapshotUrl;
}

// 儲存訂單索引到用戶目錄
async function saveOrderIndexToUser(userId, orderIndex) {
  const userOrdersPath = path.join(USERS_DIR, userId, 'orders.json');
  await ensureDir(path.join(USERS_DIR, userId));

  let orders = [];
  try {
    const data = await fs.readFile(userOrdersPath, 'utf-8');
    orders = JSON.parse(data);
  } catch (error) {
    // 檔案不存在，使用空陣列
  }

  orders.unshift(orderIndex); // 新訂單放最前面
  await fs.writeFile(userOrdersPath, JSON.stringify(orders, null, 2));
}

/**
 * 建立訂單
 * POST /api/orders
 * Body: { userId, cartItems, shipping, payment }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, cartItems, shipping, payment } = req.body;

    if (!userId || !cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數或購物車為空'
      });
    }

    // 生成訂單 ID
    const orderId = generateOrderId();
    const orderDir = path.join(ORDERS_DIR, orderId);
    await ensureDir(orderDir);

    console.log(`📦 建立訂單 ${orderId}`);

    // 處理訂單項目並複製快照
    const items = [];
    for (let i = 0; i < cartItems.length; i++) {
      const cartItem = cartItems[i];
      const itemId = `item_${i + 1}`;

      // 複製快照到訂單目錄
      let snapshotPath = null;
      if (cartItem.snapshot3D) {
        snapshotPath = await copySnapshotToOrder(cartItem.snapshot3D, orderId, itemId);
        console.log(`  📸 快照已複製: ${itemId}`);
      }

      items.push({
        itemId,
        originalProductId: cartItem.originalProductId || cartItem.id,
        productTitle: cartItem.title,
        productType: cartItem.type || '2D',
        quantity: cartItem.quantity,
        price: cartItem.price,
        subtotal: cartItem.price * cartItem.quantity,
        isCustom: cartItem.isCustom || false,
        designData: cartItem.designData || null,
        snapshot: snapshotPath,
        image: cartItem.image,
        printArea: cartItem.printArea || null
      });
    }

    // 計算總金額
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shippingFee = shipping?.fee || 100;
    const totalAmount = subtotal + shippingFee;

    // 建立訂單資料
    const order = {
      orderId,
      userId,
      createdAt: new Date().toISOString(),
      status: 'pending', // pending, paid, shipped, completed, cancelled
      items,
      shipping: {
        name: shipping?.name || '',
        phone: shipping?.phone || '',
        address: shipping?.address || '',
        method: shipping?.method || '宅配',
        fee: shippingFee
      },
      payment: {
        method: payment?.method || 'credit_card',
        status: 'pending' // pending, paid, failed
      },
      subtotal,
      shippingFee,
      totalAmount,
      notes: shipping?.notes || ''
    };

    // 儲存訂單完整資料
    const orderPath = path.join(orderDir, 'order.json');
    await fs.writeFile(orderPath, JSON.stringify(order, null, 2));

    // 儲存訂單索引到用戶目錄
    const orderIndex = {
      orderId,
      createdAt: order.createdAt,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: items.length
    };
    await saveOrderIndexToUser(userId, orderIndex);

    console.log(`✅ 訂單 ${orderId} 建立成功`);

    res.json({
      success: true,
      message: '訂單建立成功',
      orderId,
      order
    });

  } catch (error) {
    console.error('建立訂單失敗:', error);
    res.status(500).json({
      success: false,
      message: '建立訂單失敗',
      error: error.message
    });
  }
});

/**
 * 獲取訂單詳情
 * GET /api/orders/:orderId
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const orderPath = path.join(ORDERS_DIR, orderId, 'order.json');

    const data = await fs.readFile(orderPath, 'utf-8');
    const order = JSON.parse(data);

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('獲取訂單失敗:', error);
    res.status(404).json({
      success: false,
      message: '找不到訂單',
      error: error.message
    });
  }
});

/**
 * 獲取用戶所有訂單
 * GET /api/users/:userId/orders
 */
router.get('/users/:userId/orders', async (req, res) => {
  try {
    const { userId } = req.params;
    const userOrdersPath = path.join(USERS_DIR, userId, 'orders.json');

    let orders = [];
    try {
      const data = await fs.readFile(userOrdersPath, 'utf-8');
      orders = JSON.parse(data);
    } catch (error) {
      // 檔案不存在，返回空陣列
    }

    res.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('獲取用戶訂單失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取訂單失敗',
      error: error.message
    });
  }
});

/**
 * 更新訂單狀態
 * PATCH /api/orders/:orderId/status
 * Body: { status }
 */
router.patch('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '無效的訂單狀態'
      });
    }

    const orderPath = path.join(ORDERS_DIR, orderId, 'order.json');
    const data = await fs.readFile(orderPath, 'utf-8');
    const order = JSON.parse(data);

    // 更新狀態
    order.status = status;
    order.updatedAt = new Date().toISOString();

    // 如果狀態為已付款，更新付款狀態
    if (status === 'paid') {
      order.payment.status = 'paid';
      order.payment.paidAt = order.updatedAt;
    }

    // 儲存更新後的訂單
    await fs.writeFile(orderPath, JSON.stringify(order, null, 2));

    // 更新用戶訂單索引中的狀態
    const userOrdersPath = path.join(USERS_DIR, order.userId, 'orders.json');
    try {
      const ordersData = await fs.readFile(userOrdersPath, 'utf-8');
      const orders = JSON.parse(ordersData);
      const updatedOrders = orders.map(o =>
        o.orderId === orderId ? { ...o, status } : o
      );
      await fs.writeFile(userOrdersPath, JSON.stringify(updatedOrders, null, 2));
    } catch (error) {
      console.warn('更新用戶訂單索引失敗:', error);
    }

    console.log(`✅ 訂單 ${orderId} 狀態更新為 ${status}`);

    res.json({
      success: true,
      message: '訂單狀態已更新',
      order
    });

  } catch (error) {
    console.error('更新訂單狀態失敗:', error);
    res.status(500).json({
      success: false,
      message: '更新訂單狀態失敗',
      error: error.message
    });
  }
});

/**
 * 獲取訂單快照
 * GET /api/orders/:orderId/snapshots/:itemId
 */
router.get('/:orderId/snapshots/:filename', async (req, res) => {
  try {
    const { orderId, filename } = req.params;
    const snapshotPath = path.join(ORDERS_DIR, orderId, 'snapshots', filename);

    // 檢查檔案是否存在
    await fs.access(snapshotPath);

    // 發送檔案
    res.sendFile(snapshotPath);

  } catch (error) {
    console.error('獲取快照失敗:', error);
    res.status(404).json({
      success: false,
      message: '找不到快照'
    });
  }
});

module.exports = router;
