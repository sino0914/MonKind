const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();
const dataDir = path.join(__dirname, '../data');
const elementsFile = path.join(dataDir, 'elements.json');

// 確保數據目錄和文件存在
const ensureDataFile = async () => {
  await fs.ensureDir(dataDir);
  if (!await fs.pathExists(elementsFile)) {
    await fs.writeJson(elementsFile, []);
  }
};

// 讀取元素數據
const readElements = async () => {
  await ensureDataFile();
  return await fs.readJson(elementsFile);
};

// 寫入元素數據
const writeElements = async (elements) => {
  await ensureDataFile();
  await fs.writeJson(elementsFile, elements, { spaces: 2 });
};

// GET /api/elements - 獲取所有元素
router.get('/', async (req, res) => {
  try {
    const elements = await readElements();
    res.json({
      success: true,
      data: elements
    });
  } catch (error) {
    console.error('獲取元素列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取元素列表失敗'
    });
  }
});

// GET /api/elements/:id - 獲取單個元素
router.get('/:id', async (req, res) => {
  try {
    const elements = await readElements();
    const element = elements.find(e => e.id === parseInt(req.params.id));

    if (!element) {
      return res.status(404).json({
        success: false,
        message: '元素不存在'
      });
    }

    res.json({
      success: true,
      data: element
    });
  } catch (error) {
    console.error('獲取元素失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取元素失敗'
    });
  }
});

// POST /api/elements - 創建新元素
router.post('/', async (req, res) => {
  try {
    const elements = await readElements();
    const { name, type, url, fileName, fileSize, mimeType } = req.body;

    // 驗證必要欄位
    if (!name || !type || !url) {
      return res.status(400).json({
        success: false,
        message: '缺少必要欄位'
      });
    }

    // 生成新ID
    const newId = elements.length > 0
      ? Math.max(...elements.map(e => e.id || 0)) + 1
      : 1;

    const newElement = {
      id: newId,
      name,
      type,
      url,
      fileName,
      fileSize,
      mimeType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    elements.push(newElement);
    await writeElements(elements);

    res.json({
      success: true,
      message: '元素創建成功',
      data: newElement
    });
  } catch (error) {
    console.error('創建元素失敗:', error);
    res.status(500).json({
      success: false,
      message: '創建元素失敗'
    });
  }
});

// PUT /api/elements/:id - 更新元素
router.put('/:id', async (req, res) => {
  try {
    const elements = await readElements();
    const index = elements.findIndex(e => e.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '元素不存在'
      });
    }

    const updatedElement = {
      ...elements[index],
      ...req.body,
      id: elements[index].id, // 保持ID不變
      updatedAt: new Date().toISOString()
    };

    elements[index] = updatedElement;
    await writeElements(elements);

    res.json({
      success: true,
      message: '元素更新成功',
      data: updatedElement
    });
  } catch (error) {
    console.error('更新元素失敗:', error);
    res.status(500).json({
      success: false,
      message: '更新元素失敗'
    });
  }
});

// DELETE /api/elements/:id - 刪除元素
router.delete('/:id', async (req, res) => {
  try {
    const elements = await readElements();
    const index = elements.findIndex(e => e.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '元素不存在'
      });
    }

    const deletedElement = elements[index];

    // 如果元素有對應的檔案，也刪除檔案
    if (deletedElement.url && deletedElement.url.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../data', deletedElement.url.replace('/uploads/', 'uploads/'));
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
      }
    }

    elements.splice(index, 1);
    await writeElements(elements);

    res.json({
      success: true,
      message: '元素刪除成功',
      data: deletedElement
    });
  } catch (error) {
    console.error('刪除元素失敗:', error);
    res.status(500).json({
      success: false,
      message: '刪除元素失敗'
    });
  }
});

// GET /api/elements/stats - 獲取元素統計
router.get('/stats', async (req, res) => {
  try {
    const elements = await readElements();

    const stats = {
      total: elements.length,
      byType: {},
      totalSize: 0
    };

    elements.forEach(element => {
      // 按類型統計
      stats.byType[element.type] = (stats.byType[element.type] || 0) + 1;

      // 計算總大小
      if (element.fileSize) {
        stats.totalSize += element.fileSize;
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('獲取元素統計失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取元素統計失敗'
    });
  }
});

module.exports = router;
