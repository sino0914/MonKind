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

// 複製列印檔案到訂單目錄
async function copyPrintFileToOrder(printFileUrl, orderId, itemId) {
  console.log(`🖨️  處理列印檔案複製: itemId=${itemId}, printFile=${printFileUrl}`);

  if (!printFileUrl) {
    console.log('  ⚠️  沒有列印檔案資料');
    return null;
  }

  const printFilesDir = path.join(ORDERS_DIR, orderId, 'print-files');
  await ensureDir(printFilesDir);

  // 處理完整 URL (http://localhost:3002/uploads/print-files/xxx.png)
  if (typeof printFileUrl === 'string' && printFileUrl.startsWith('http')) {
    try {
      const urlObj = new URL(printFileUrl);
      const relativePath = urlObj.pathname;
      return await copyPrintFileToOrder(relativePath, orderId, itemId);
    } catch (err) {
      console.error('  ❌ URL 解析失敗:', err.message);
      return printFileUrl;
    }
  }

  // 處理相對路徑 (/uploads/print-files/xxx.png)
  if (typeof printFileUrl === 'string' && printFileUrl.startsWith('/uploads/print-files/')) {
    try {
      const filename = path.basename(printFileUrl);
      const sourceFile = path.join(DATA_DIR, printFileUrl.replace('/uploads/', 'uploads/'));
      const destFileName = `${itemId}_print.png`;
      const destPath = path.join(printFilesDir, destFileName);

      try {
        await fs.access(sourceFile);
        await fs.copyFile(sourceFile, destPath);
        console.log(`  ✅ 列印檔案複製成功: ${filename} -> ${destFileName}`);
        return `/data/orders/${orderId}/print-files/${destFileName}`;
      } catch (err) {
        console.error('  ❌ 列印檔案複製失敗:', err.message);
        return printFileUrl;
      }
    } catch (error) {
      console.error('  ❌ 處理列印檔案路徑失敗:', error.message);
      return printFileUrl;
    }
  }

  console.log(`  ⚠️  未知的列印檔案格式: ${printFileUrl.substring(0, 100)}`);
  return printFileUrl;
}

// 複製快照到訂單目錄
async function copySnapshotToOrder(snapshotUrl, orderId, itemId) {
  console.log(`📸 處理快照複製: itemId=${itemId}, snapshot=${snapshotUrl}`);

  if (!snapshotUrl) {
    console.log('  ⚠️  沒有快照資料');
    return null;
  }

  const snapshotsDir = path.join(ORDERS_DIR, orderId, 'snapshots');
  await ensureDir(snapshotsDir);

  // 處理完整 URL (http://localhost:3002/uploads/snapshots/xxx.jpg)
  if (typeof snapshotUrl === 'string' && snapshotUrl.startsWith('http')) {
    try {
      // 提取相對路徑部分
      const urlObj = new URL(snapshotUrl);
      const relativePath = urlObj.pathname; // 例如：/uploads/snapshots/xxx.jpg

      console.log(`  🔗 完整 URL 轉換為相對路徑: ${relativePath}`);

      // 遞迴呼叫自己處理相對路徑
      return await copySnapshotToOrder(relativePath, orderId, itemId);
    } catch (error) {
      console.error('  ❌ 解析完整 URL 失敗:', error.message);
      return snapshotUrl;
    }
  }

  // 如果是相對路徑 URL (已上傳到 /uploads/snapshots/)
  if (typeof snapshotUrl === 'string' && snapshotUrl.startsWith('/uploads/')) {
    try {
      const sourcePath = path.join(__dirname, '..', 'data', snapshotUrl.replace('/uploads/', 'uploads/'));
      const ext = path.extname(snapshotUrl) || '.jpg';
      const destFileName = `${itemId}${ext}`;
      const destPath = path.join(snapshotsDir, destFileName);

      console.log(`  📂 複製檔案:`);
      console.log(`     來源: ${sourcePath}`);
      console.log(`     目標: ${destPath}`);

      await fs.copyFile(sourcePath, destPath);
      console.log(`  ✅ 快照複製成功`);
      return `/data/orders/${orderId}/snapshots/${destFileName}`;
    } catch (error) {
      console.error('  ❌ 複製快照失敗:', error.message);
      return snapshotUrl; // 失敗時返回原 URL
    }
  }

  // 如果是 base64，儲存為檔案
  if (typeof snapshotUrl === 'string' && snapshotUrl.startsWith('data:image/')) {
    try {
      const matches = snapshotUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        console.log('  ⚠️  無法解析 base64 格式');
        return snapshotUrl;
      }

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const destFileName = `${itemId}.${ext}`;
      const destPath = path.join(snapshotsDir, destFileName);

      console.log(`  💾 儲存 base64 圖片到: ${destPath}`);

      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(destPath, buffer);

      console.log(`  ✅ Base64 快照儲存成功`);
      return `/data/orders/${orderId}/snapshots/${destFileName}`;
    } catch (error) {
      console.error('  ❌ 儲存 base64 快照失敗:', error.message);
      return snapshotUrl; // 失敗時返回原 base64
    }
  }

  console.log(`  ⚠️  未知的快照格式: ${snapshotUrl.substring(0, 100)}`);
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
 * 獲取所有訂單（管理後台用）
 * GET /api/orders?vendorId=xxx (廠商篩選)
 */
router.get('/', async (req, res) => {
  try {
    await ensureDir(ORDERS_DIR);

    const { vendorId } = req.query;

    // 讀取所有訂單目錄
    const orderDirs = await fs.readdir(ORDERS_DIR);
    const orders = [];

    for (const orderId of orderDirs) {
      try {
        const orderPath = path.join(ORDERS_DIR, orderId, 'order.json');
        const data = await fs.readFile(orderPath, 'utf-8');
        const order = JSON.parse(data);

        // 如果有指定 vendorId，只返回該廠商的訂單項目
        let filteredItems = order.items || [];
        if (vendorId) {
          filteredItems = filteredItems.filter(item => item.vendorId === parseInt(vendorId));

          // 如果過濾後沒有項目，跳過此訂單
          if (filteredItems.length === 0) {
            continue;
          }
        }

        // 轉換訂單格式以符合前端需求
        orders.push({
          orderId: order.orderId,
          createdAt: order.createdAt,
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: filteredItems.length, // 使用過濾後的項目數量
          customerInfo: {
            name: order.shipping?.name || '',
            email: order.userId || '',
            phone: order.shipping?.phone || '',
            address: order.shipping?.address || ''
          },
          items: filteredItems // 使用過濾後的項目
        });
      } catch (error) {
        console.warn(`無法讀取訂單 ${orderId}:`, error.message);
      }
    }

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('獲取訂單列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取訂單列表失敗',
      error: error.message
    });
  }
});

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

    // 處理訂單項目並複製快照和列印檔案
    const items = [];
    for (let i = 0; i < cartItems.length; i++) {
      const cartItem = cartItems[i];
      const itemId = `item_${i + 1}`;

      console.log(`\n處理商品 ${itemId}:`, {
        title: cartItem.title,
        hasSnapshot3D: !!cartItem.snapshot3D,
        hasSnapshot2D: !!cartItem.snapshot2D,
        hasPrintFile: !!cartItem.printFileUrl,
        snapshot3D: cartItem.snapshot3D ? cartItem.snapshot3D.substring(0, 100) : null,
        snapshot2D: cartItem.snapshot2D ? cartItem.snapshot2D.substring(0, 100) : null
      });

      // 複製快照到訂單目錄（優先使用 3D 快照，其次使用 2D 快照）
      let snapshotPath = null;
      if (cartItem.snapshot3D) {
        snapshotPath = await copySnapshotToOrder(cartItem.snapshot3D, orderId, itemId);
        console.log(`  📸 3D 快照處理結果: ${snapshotPath}`);
      } else if (cartItem.snapshot2D) {
        snapshotPath = await copySnapshotToOrder(cartItem.snapshot2D, orderId, itemId);
        console.log(`  📸 2D 快照處理結果: ${snapshotPath}`);
      } else {
        console.log(`  ⚠️  此商品沒有快照`);
      }

      // 複製列印檔案到訂單目錄
      let printFilePath = null;
      if (cartItem.printFileUrl) {
        printFilePath = await copyPrintFileToOrder(cartItem.printFileUrl, orderId, itemId);
        console.log(`  🖨️  列印檔案處理結果: ${printFilePath}`);
      }

      // 處理廠商資訊
      let vendorId = cartItem.vendorId;
      let vendorName = null;

      if (vendorId) {
        // 從廠商資料檔讀取廠商名稱
        try {
          const vendorsFile = path.join(__dirname, '../data/vendors.json');
          const vendors = await fs.readFile(vendorsFile, 'utf-8');
          const vendorsList = JSON.parse(vendors);
          const vendor = vendorsList.find(v => v.id === vendorId);
          if (vendor) {
            vendorName = vendor.name;
            console.log(`  🏭 廠商: ${vendorName} (ID: ${vendorId})`);
          }
        } catch (error) {
          console.error('  ⚠️  讀取廠商資料失敗:', error.message);
        }
      } else {
        console.log(`  ⚠️  此商品沒有指定廠商`);
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
        printFile: printFilePath,
        printFileGeneratedAt: printFilePath ? new Date().toISOString() : null,
        image: cartItem.image,
        printArea: cartItem.printArea || null,
        vendorId: vendorId,
        vendorName: vendorName
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

    // 訂單建立完成後，觸發清理舊的列印檔案
    const { cleanupOldPrintFiles } = require('../utils/cleanupPrintFiles');
    cleanupOldPrintFiles().catch(err => {
      console.error('清理列印檔案失敗:', err);
    });

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
 * 獲取用戶所有訂單（包含商品縮圖）
 * GET /api/users/:userId/orders
 */
router.get('/users/:userId/orders', async (req, res) => {
  try {
    const { userId } = req.params;
    const userOrdersPath = path.join(USERS_DIR, userId, 'orders.json');

    let orderIndexes = [];
    try {
      const data = await fs.readFile(userOrdersPath, 'utf-8');
      orderIndexes = JSON.parse(data);
    } catch (error) {
      // 檔案不存在，返回空陣列
    }

    // 載入每個訂單的完整資訊（包含商品和縮圖）
    const ordersWithDetails = [];
    for (const orderIndex of orderIndexes) {
      try {
        const orderPath = path.join(ORDERS_DIR, orderIndex.orderId, 'order.json');
        const orderData = await fs.readFile(orderPath, 'utf-8');
        const order = JSON.parse(orderData);

        // 為每個商品的快照添加完整 URL
        const itemsWithUrls = order.items.map(item => {
          const snapshotUrl = item.snapshot ? `/api/orders/${order.orderId}/snapshots/${path.basename(item.snapshot)}` : null;
          console.log(`📸 商品快照處理: ${item.itemId}`, {
            原始路徑: item.snapshot,
            提取檔名: item.snapshot ? path.basename(item.snapshot) : null,
            API路徑: snapshotUrl
          });
          return {
            ...item,
            snapshotUrl
          };
        });

        ordersWithDetails.push({
          ...order,
          items: itemsWithUrls
        });
      } catch (error) {
        console.warn(`無法載入訂單 ${orderIndex.orderId}:`, error.message);
        // 如果無法載入完整訂單，使用索引資料
        ordersWithDetails.push(orderIndex);
      }
    }

    res.json({
      success: true,
      orders: ordersWithDetails
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
 * 下載訂單項目的列印檔案（支援按需重建）
 * GET /api/orders/:orderId/items/:itemId/print-file
 */
router.get('/:orderId/items/:itemId/print-file', async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    // 讀取訂單資料
    const orderPath = path.join(ORDERS_DIR, orderId, 'order.json');
    const orderData = await fs.readFile(orderPath, 'utf-8');
    const order = JSON.parse(orderData);

    // 找到對應的訂單項目
    const item = order.items.find(i => i.itemId === itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '找不到訂單項目'
      });
    }

    // 檢查列印檔案是否存在
    if (item.printFile) {
      const printFilePath = path.join(__dirname, '../data', item.printFile.replace('/data/', ''));

      try {
        await fs.access(printFilePath);
        console.log(`✅ 提供列印檔案: ${item.printFile}`);

        // 設定下載標頭，強制下載而非預覽
        const filename = `${orderId}_${itemId}_print.png`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'image/png');

        return res.sendFile(printFilePath);
      } catch (error) {
        console.log(`⚠️  列印檔案不存在（可能已被清理），準備重建: ${item.printFile}`);
      }
    }

    // 列印檔案不存在，嘗試從訂單資料重建
    if (!item.isCustom || !item.designData) {
      return res.status(404).json({
        success: false,
        message: '列印檔案不存在且無法重建（非客製化商品）'
      });
    }

    console.log(`🔨 開始重建列印檔案: ${orderId}/${itemId}`);

    // 使用 Canvas 重建列印檔案（Node.js 環境）
    // 注意：這裡需要使用 node-canvas 或類似的伺服器端 Canvas 實現
    // 目前先返回錯誤，提示需要實作伺服器端渲染
    return res.status(501).json({
      success: false,
      message: '列印檔案不存在，伺服器端重建功能尚未實作。請聯繫管理員。',
      hint: '您可以請客戶重新下單，或手動上傳列印檔案'
    });

  } catch (error) {
    console.error('下載列印檔案失敗:', error);
    res.status(500).json({
      success: false,
      message: '下載列印檔案失敗',
      error: error.message
    });
  }
});

/**
 * 獲取訂單快照
 * GET /api/orders/:orderId/snapshots/:filename
 */
router.get('/:orderId/snapshots/:filename', async (req, res) => {
  try {
    const { orderId, filename } = req.params;

    // 優先從訂單目錄尋找
    const orderSnapshotPath = path.join(ORDERS_DIR, orderId, 'snapshots', filename);

    try {
      await fs.access(orderSnapshotPath);
      console.log(`✅ 從訂單目錄提供快照: ${filename}`);
      return res.sendFile(orderSnapshotPath);
    } catch (error) {
      // 訂單目錄沒有，嘗試從 uploads 目錄尋找
      console.log(`⚠️  訂單目錄找不到快照，嘗試 uploads 目錄: ${filename}`);
    }

    // 備用方案：從 uploads/snapshots 目錄尋找
    const uploadsSnapshotPath = path.join(__dirname, '../data/uploads/snapshots', filename);

    try {
      await fs.access(uploadsSnapshotPath);
      console.log(`✅ 從 uploads 目錄提供快照: ${filename}`);
      return res.sendFile(uploadsSnapshotPath);
    } catch (error) {
      console.error(`❌ 快照完全找不到: ${filename}`);
    }

    // 都找不到，返回 404
    res.status(404).json({
      success: false,
      message: '找不到快照'
    });

  } catch (error) {
    console.error('獲取快照失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取快照失敗',
      error: error.message
    });
  }
});

module.exports = router;
