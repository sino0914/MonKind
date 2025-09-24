const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();
const dataDir = path.join(__dirname, '../../data');
const templatesFile = path.join(dataDir, 'templates.json');

// 讀取模板數據
const readTemplates = async () => {
  try {
    if (await fs.pathExists(templatesFile)) {
      return await fs.readJson(templatesFile);
    }
    return [];
  } catch (error) {
    console.error('讀取模板數據失敗:', error);
    return [];
  }
};

// 寫入模板數據
const writeTemplates = async (templates) => {
  try {
    await fs.writeJson(templatesFile, templates, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('寫入模板數據失敗:', error);
    return false;
  }
};

// GET /api/templates - 獲取所有模板
router.get('/', async (req, res) => {
  try {
    const templates = await readTemplates();

    // 支持查詢參數
    const { productId, category, active } = req.query;

    let filteredTemplates = templates;

    if (productId) {
      filteredTemplates = filteredTemplates.filter(t => t.productId === parseInt(productId));
    }

    if (category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === category);
    }

    if (active !== undefined) {
      filteredTemplates = filteredTemplates.filter(t => t.isActive !== false);
    }

    res.json({
      success: true,
      data: filteredTemplates,
      count: filteredTemplates.length
    });
  } catch (error) {
    console.error('獲取模板列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取模板列表失敗'
    });
  }
});

// GET /api/templates/:id - 獲取單個模板
router.get('/:id', async (req, res) => {
  try {
    const templates = await readTemplates();
    const template = templates.find(t => t.id === parseInt(req.params.id));

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '找不到指定模板'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('獲取模板失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取模板失敗'
    });
  }
});

// POST /api/templates - 創建新模板
router.post('/', async (req, res) => {
  try {
    const templates = await readTemplates();

    // 生成新的 ID
    const newId = templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1;

    const newTemplate = {
      ...req.body,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    templates.push(newTemplate);

    if (await writeTemplates(templates)) {
      res.status(201).json({
        success: true,
        data: newTemplate,
        message: '模板創建成功'
      });
    } else {
      throw new Error('保存模板數據失敗');
    }
  } catch (error) {
    console.error('創建模板失敗:', error);
    res.status(500).json({
      success: false,
      message: '創建模板失敗'
    });
  }
});

// PUT /api/templates/:id - 更新模板
router.put('/:id', async (req, res) => {
  try {
    const templates = await readTemplates();
    const index = templates.findIndex(t => t.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '找不到指定模板'
      });
    }

    // 更新模板數據
    templates[index] = {
      ...templates[index],
      ...req.body,
      id: parseInt(req.params.id), // 確保 ID 不被覆蓋
      updatedAt: new Date().toISOString()
    };

    if (await writeTemplates(templates)) {
      res.json({
        success: true,
        data: templates[index],
        message: '模板更新成功'
      });
    } else {
      throw new Error('保存模板數據失敗');
    }
  } catch (error) {
    console.error('更新模板失敗:', error);
    res.status(500).json({
      success: false,
      message: '更新模板失敗'
    });
  }
});

// DELETE /api/templates/:id - 刪除模板
router.delete('/:id', async (req, res) => {
  try {
    const templates = await readTemplates();
    const index = templates.findIndex(t => t.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '找不到指定模板'
      });
    }

    const deletedTemplate = templates[index];
    templates.splice(index, 1);

    if (await writeTemplates(templates)) {
      res.json({
        success: true,
        data: deletedTemplate,
        message: '模板刪除成功'
      });
    } else {
      throw new Error('保存模板數據失敗');
    }
  } catch (error) {
    console.error('刪除模板失敗:', error);
    res.status(500).json({
      success: false,
      message: '刪除模板失敗'
    });
  }
});

module.exports = router;