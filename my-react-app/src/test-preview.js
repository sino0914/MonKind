/**
 * 測試預覽圖生成功能
 */

import { generateTemplateThumbnail } from './utils/TemplatePreviewGenerator';

// 測試版型資料
const testTemplate = {
  id: 1,
  name: '測試版型',
  backgroundColor: '#ff6b6b',
  elements: [
    {
      type: 'text',
      content: '測試文字',
      x: 160,
      y: 100,
      fontSize: 24,
      color: '#ffffff',
      fontFamily: 'Arial',
      fontWeight: 'bold'
    },
    {
      type: 'text',
      content: '第二行文字',
      x: 160,
      y: 200,
      fontSize: 16,
      color: '#333333',
      fontFamily: 'Arial'
    }
  ]
};

// 測試商品資料
const testProduct = {
  id: 1,
  name: '測試商品',
  printArea: {
    x: 50,
    y: 50,
    width: 220,
    height: 220
  },
  mockupImage: null // 測試時不使用底圖
};

// 執行測試
async function testPreviewGeneration() {
  console.log('開始測試預覽圖生成...');

  try {
    const thumbnailData = await generateTemplateThumbnail(testTemplate, testProduct);

    if (thumbnailData) {
      console.log('✅ 預覽圖生成成功！');
      console.log('預覽圖資料長度:', thumbnailData.length);
      console.log('預覽圖格式:', thumbnailData.substring(0, 30) + '...');

      // 可以在瀏覽器中查看生成的圖片
      const img = new Image();
      img.onload = () => {
        console.log('預覽圖載入成功，尺寸:', img.width, 'x', img.height);
      };
      img.src = thumbnailData;

    } else {
      console.log('❌ 預覽圖生成失敗');
    }
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

// 當模組載入時執行測試
if (typeof window !== 'undefined') {
  // 在瀏覽器環境中執行
  window.testPreviewGeneration = testPreviewGeneration;
  console.log('預覽圖測試功能已載入，請在瀏覽器控制台執行: testPreviewGeneration()');
}

export { testPreviewGeneration };