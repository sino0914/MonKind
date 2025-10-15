/**
 * 清理超過 10 天的列印檔案
 * 保留訂單資料（用於按需重建）
 */

const fs = require('fs-extra');
const path = require('path');

const ORDERS_DIR = path.join(__dirname, '../data/orders');
const MAX_AGE_DAYS = 10;

/**
 * 清理所有訂單中超過 10 天的列印檔案
 */
async function cleanupOldPrintFiles() {
  try {
    console.log('🧹 開始清理超過 10 天的列印檔案...');

    // 確保訂單目錄存在
    const ordersExists = await fs.pathExists(ORDERS_DIR);
    if (!ordersExists) {
      console.log('訂單目錄不存在，跳過清理');
      return { success: true, deletedCount: 0 };
    }

    // 獲取所有訂單資料夾
    const orderFolders = await fs.readdir(ORDERS_DIR);
    let totalDeleted = 0;
    let totalScanned = 0;

    for (const orderFolder of orderFolders) {
      // 跳過非訂單資料夾
      if (!orderFolder.startsWith('order_')) {
        continue;
      }

      const orderPath = path.join(ORDERS_DIR, orderFolder);
      const printFilesDir = path.join(orderPath, 'print-files');

      // 檢查是否有 print-files 資料夾
      const printFilesDirExists = await fs.pathExists(printFilesDir);
      if (!printFilesDirExists) {
        continue;
      }

      // 讀取訂單 JSON 資料（獲取生成時間）
      const orderJsonPath = path.join(orderPath, `${orderFolder}.json`);
      const orderJsonExists = await fs.pathExists(orderJsonPath);
      if (!orderJsonExists) {
        console.warn(`訂單資料不存在: ${orderFolder}`);
        continue;
      }

      const orderData = await fs.readJson(orderJsonPath);

      // 掃描 print-files 資料夾中的所有檔案
      const printFiles = await fs.readdir(printFilesDir);

      for (const filename of printFiles) {
        totalScanned++;
        const filePath = path.join(printFilesDir, filename);

        // 從訂單資料中找到對應的項目
        let shouldDelete = false;

        for (const item of orderData.items || []) {
          if (item.printFile && item.printFile.includes(filename)) {
            // 檢查生成時間
            if (item.printFileGeneratedAt) {
              const generatedAt = new Date(item.printFileGeneratedAt);
              const now = new Date();
              const ageInDays = (now - generatedAt) / (1000 * 60 * 60 * 24);

              if (ageInDays > MAX_AGE_DAYS) {
                shouldDelete = true;
                console.log(`🗑️ 刪除過期列印檔案 (${ageInDays.toFixed(1)} 天): ${orderFolder}/${filename}`);
              }
            }
            break;
          }
        }

        // 刪除檔案
        if (shouldDelete) {
          try {
            await fs.remove(filePath);
            totalDeleted++;
          } catch (err) {
            console.error(`刪除檔案失敗 ${filePath}:`, err);
          }
        }
      }

      // 如果 print-files 資料夾已空，刪除資料夾
      const remainingFiles = await fs.readdir(printFilesDir);
      if (remainingFiles.length === 0) {
        await fs.remove(printFilesDir);
        console.log(`📁 刪除空的 print-files 資料夾: ${orderFolder}`);
      }
    }

    console.log(`✅ 清理完成: 掃描 ${totalScanned} 個檔案，刪除 ${totalDeleted} 個過期檔案`);

    return {
      success: true,
      scannedCount: totalScanned,
      deletedCount: totalDeleted
    };
  } catch (error) {
    console.error('清理列印檔案失敗:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  cleanupOldPrintFiles
};
