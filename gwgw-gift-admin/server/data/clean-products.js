/**
 * 清理 products.json - 移除 mockupImage (base64)
 * 保留 image 和 glbUrl
 */

const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'products.json');
const backupPath = path.join(__dirname, 'products.backup.json');

try {
  console.log('📖 讀取 products.json...');
  const data = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

  console.log(`📦 總商品數: ${data.length}`);

  // 備份原始檔案
  console.log('💾 建立備份...');
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  console.log(`✅ 備份已儲存: ${backupPath}`);

  // 清理每個商品
  let removedCount = 0;
  const cleanedData = data.map(product => {
    const cleaned = { ...product };

    // 移除 mockupImage (通常是 base64)
    if (cleaned.mockupImage) {
      delete cleaned.mockupImage;
      removedCount++;
      console.log(`  🗑️  移除 mockupImage: ${product.id} - ${product.title}`);
    }

    return cleaned;
  });

  // 儲存清理後的資料
  console.log('\n💾 儲存清理後的檔案...');
  fs.writeFileSync(productsPath, JSON.stringify(cleanedData, null, 2));

  // 顯示檔案大小變化
  const originalSize = fs.statSync(backupPath).size;
  const newSize = fs.statSync(productsPath).size;
  const savedBytes = originalSize - newSize;
  const savedKB = (savedBytes / 1024).toFixed(2);

  console.log('\n✅ 清理完成！');
  console.log(`📊 統計:`);
  console.log(`   - 移除 mockupImage 數量: ${removedCount}`);
  console.log(`   - 原始檔案大小: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`   - 清理後大小: ${(newSize / 1024).toFixed(2)} KB`);
  console.log(`   - 節省空間: ${savedKB} KB (${((savedBytes / originalSize) * 100).toFixed(1)}%)`);

  // 檢查清理後的結果
  console.log('\n🔍 清理後檢查:');
  cleanedData.forEach(p => {
    console.log(`   ${p.id}. ${p.title}`);
    console.log(`      - type: ${p.type}`);
    console.log(`      - image: ${p.image ? '✓' : '✗'}`);
    console.log(`      - glbUrl: ${p.glbUrl || p.model3D?.glbUrl ? '✓' : '✗'}`);
    console.log(`      - mockupImage: ${p.mockupImage ? '✓ (未移除!)' : '✗ (已移除)'}`);
  });

} catch (error) {
  console.error('❌ 清理失敗:', error);
  process.exit(1);
}
