/**
 * 腳本：為所有現有訂單項目新增廠商欄位
 * 預設使用第一個廠商（測試廠商）
 */

const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const ORDERS_DIR = path.join(DATA_DIR, 'orders');
const VENDORS_FILE = path.join(DATA_DIR, 'vendors.json');

async function addVendorToOrders() {
  try {
    console.log('🔧 開始更新訂單資料結構...\n');

    // 讀取廠商資料
    const vendors = await fs.readJson(VENDORS_FILE);
    const defaultVendor = vendors.find(v => v.isActive) || vendors[0];

    if (!defaultVendor) {
      console.error('❌ 找不到可用的廠商');
      return;
    }

    console.log(`📦 預設廠商: ${defaultVendor.name} (ID: ${defaultVendor.id})\n`);

    // 獲取所有訂單資料夾
    const orderDirs = await fs.readdir(ORDERS_DIR);
    let updatedCount = 0;
    let skippedCount = 0;

    for (const orderDir of orderDirs) {
      if (!orderDir.startsWith('order_')) {
        continue;
      }

      const orderJsonPath = path.join(ORDERS_DIR, orderDir, 'order.json');

      try {
        // 檢查訂單檔案是否存在
        if (!await fs.pathExists(orderJsonPath)) {
          console.log(`⚠️  跳過（無 order.json）: ${orderDir}`);
          skippedCount++;
          continue;
        }

        // 讀取訂單資料
        const order = await fs.readJson(orderJsonPath);

        // 檢查是否需要更新
        let needsUpdate = false;
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            if (!item.vendorId) {
              needsUpdate = true;
              break;
            }
          }
        }

        if (!needsUpdate) {
          console.log(`✓ 已有廠商資料: ${orderDir}`);
          skippedCount++;
          continue;
        }

        // 更新每個訂單項目
        order.items = order.items.map(item => ({
          ...item,
          vendorId: defaultVendor.id,
          vendorName: defaultVendor.name
        }));

        // 儲存更新後的訂單
        await fs.writeJson(orderJsonPath, order, { spaces: 2 });

        console.log(`✅ 已更新: ${orderDir} (${order.items.length} 個項目)`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ 更新失敗 ${orderDir}:`, error.message);
      }
    }

    console.log('\n📊 更新完成！');
    console.log(`   - 已更新: ${updatedCount} 筆訂單`);
    console.log(`   - 已跳過: ${skippedCount} 筆訂單`);

  } catch (error) {
    console.error('❌ 執行失敗:', error);
  }
}

// 執行腳本
addVendorToOrders();
