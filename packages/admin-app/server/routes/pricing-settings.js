const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const settingsFile = path.join(dataDir, 'pricing-settings.json');

// 讀取定價設定
async function readSettings() {
  try {
    await fs.ensureFile(settingsFile);
    const data = await fs.readFile(settingsFile, 'utf8');
    if (!data.trim()) {
      const defaultData = { settings: [] };
      await fs.writeJson(settingsFile, defaultData, { spaces: 2 });
      return defaultData;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('讀取定價設定失敗:', error);
    return { settings: [] };
  }
}

// 寫入定價設定
async function writeSettings(data) {
  await fs.writeJson(settingsFile, data, { spaces: 2 });
}

// GET /api/pricing-settings - 獲取所有定價設定
router.get('/', async (req, res) => {
  try {
    const data = await readSettings();
    res.json({ success: true, data: data.settings });
  } catch (error) {
    console.error('獲取定價設定失敗:', error);
    res.status(500).json({ success: false, message: '獲取定價設定失敗' });
  }
});

// GET /api/pricing-settings/active - 獲取當前啟用的定價方案
router.get('/active', async (req, res) => {
  try {
    const data = await readSettings();
    const activeSetting = data.settings.find(setting => setting.isActive);

    if (!activeSetting) {
      // 如果沒有啟用的方案，返回預設值
      return res.json({
        success: true,
        data: {
          textElementPrice: 10,
          imageElementPrice: 30,
          minimumDesignFee: 50,
          enableMinimumFee: true
        }
      });
    }

    res.json({ success: true, data: activeSetting });
  } catch (error) {
    console.error('獲取啟用的定價設定失敗:', error);
    res.status(500).json({ success: false, message: '獲取啟用的定價設定失敗' });
  }
});

// GET /api/pricing-settings/:id - 獲取單個定價設定
router.get('/:id', async (req, res) => {
  try {
    const data = await readSettings();
    const setting = data.settings.find(s => s.id === parseInt(req.params.id));

    if (!setting) {
      return res.status(404).json({ success: false, message: '找不到該定價設定' });
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    console.error('獲取定價設定失敗:', error);
    res.status(500).json({ success: false, message: '獲取定價設定失敗' });
  }
});

// POST /api/pricing-settings - 創建新定價設定
router.post('/', async (req, res) => {
  try {
    const data = await readSettings();
    const newSetting = {
      id: data.settings.length > 0 ? Math.max(...data.settings.map(s => s.id)) + 1 : 1,
      name: req.body.name || '新定價方案',
      description: req.body.description || '',
      textElementPrice: parseFloat(req.body.textElementPrice) || 0,
      imageElementPrice: parseFloat(req.body.imageElementPrice) || 0,
      minimumDesignFee: parseFloat(req.body.minimumDesignFee) || 0,
      enableMinimumFee: req.body.enableMinimumFee !== false,
      isActive: req.body.isActive || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 如果新設定為啟用，將其他設定設為停用
    if (newSetting.isActive) {
      data.settings.forEach(setting => {
        setting.isActive = false;
      });
    }

    data.settings.push(newSetting);
    await writeSettings(data);

    res.json({ success: true, data: newSetting });
  } catch (error) {
    console.error('創建定價設定失敗:', error);
    res.status(500).json({ success: false, message: '創建定價設定失敗' });
  }
});

// PUT /api/pricing-settings/:id - 更新定價設定
router.put('/:id', async (req, res) => {
  try {
    const data = await readSettings();
    const index = data.settings.findIndex(s => s.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: '找不到該定價設定' });
    }

    const updatedSetting = {
      ...data.settings[index],
      name: req.body.name || data.settings[index].name,
      description: req.body.description !== undefined ? req.body.description : data.settings[index].description,
      textElementPrice: req.body.textElementPrice !== undefined ? parseFloat(req.body.textElementPrice) : data.settings[index].textElementPrice,
      imageElementPrice: req.body.imageElementPrice !== undefined ? parseFloat(req.body.imageElementPrice) : data.settings[index].imageElementPrice,
      minimumDesignFee: req.body.minimumDesignFee !== undefined ? parseFloat(req.body.minimumDesignFee) : data.settings[index].minimumDesignFee,
      enableMinimumFee: req.body.enableMinimumFee !== undefined ? req.body.enableMinimumFee : data.settings[index].enableMinimumFee,
      isActive: req.body.isActive !== undefined ? req.body.isActive : data.settings[index].isActive,
      updatedAt: new Date().toISOString()
    };

    // 如果更新為啟用，將其他設定設為停用
    if (updatedSetting.isActive) {
      data.settings.forEach((setting, i) => {
        if (i !== index) {
          setting.isActive = false;
        }
      });
    }

    data.settings[index] = updatedSetting;
    await writeSettings(data);

    res.json({ success: true, data: updatedSetting });
  } catch (error) {
    console.error('更新定價設定失敗:', error);
    res.status(500).json({ success: false, message: '更新定價設定失敗' });
  }
});

// DELETE /api/pricing-settings/:id - 刪除定價設定
router.delete('/:id', async (req, res) => {
  try {
    const data = await readSettings();
    const index = data.settings.findIndex(s => s.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: '找不到該定價設定' });
    }

    // 不允許刪除啟用中的設定
    if (data.settings[index].isActive) {
      return res.status(400).json({ success: false, message: '無法刪除啟用中的定價設定' });
    }

    data.settings.splice(index, 1);
    await writeSettings(data);

    res.json({ success: true, message: '刪除成功' });
  } catch (error) {
    console.error('刪除定價設定失敗:', error);
    res.status(500).json({ success: false, message: '刪除定價設定失敗' });
  }
});

// POST /api/pricing-settings/calculate - 計算價格
router.post('/calculate', async (req, res) => {
  try {
    const { productPrice, designElements } = req.body;

    if (!productPrice || !designElements) {
      return res.status(400).json({ success: false, message: '缺少必要參數' });
    }

    // 獲取啟用的定價設定
    const data = await readSettings();
    const activeSetting = data.settings.find(setting => setting.isActive);

    // 使用預設值如果沒有啟用的設定
    const pricing = activeSetting || {
      textElementPrice: 10,
      imageElementPrice: 30,
      minimumDesignFee: 50,
      enableMinimumFee: true
    };

    // 計算元素數量
    const textCount = designElements.filter(el => el.type === 'text').length;
    const imageCount = designElements.filter(el => el.type === 'image').length;
    const totalElements = textCount + imageCount;

    // 計算元素費用
    const textCost = textCount * pricing.textElementPrice;
    const imageCost = imageCount * pricing.imageElementPrice;
    let designCost = textCost + imageCost;

    // 套用最低設計費
    if (pricing.enableMinimumFee && totalElements > 0 && designCost < pricing.minimumDesignFee) {
      designCost = pricing.minimumDesignFee;
    }

    const totalPrice = productPrice + designCost;

    res.json({
      success: true,
      data: {
        basePrice: productPrice,
        designCost: designCost,
        totalPrice: totalPrice,
        breakdown: {
          textCount,
          imageCount,
          textCost,
          imageCost,
          minimumFeeApplied: pricing.enableMinimumFee && totalElements > 0 && (textCost + imageCost) < pricing.minimumDesignFee
        }
      }
    });
  } catch (error) {
    console.error('計算價格失敗:', error);
    res.status(500).json({ success: false, message: '計算價格失敗' });
  }
});

module.exports = router;
