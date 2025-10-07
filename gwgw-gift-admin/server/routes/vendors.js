const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const vendorsFile = path.join(dataDir, 'vendors.json');

// 確保廠商資料檔案存在
const ensureVendorsFile = async () => {
  if (!await fs.pathExists(vendorsFile)) {
    await fs.writeJson(vendorsFile, []);
  }
};

// 讀取廠商資料
const readVendors = async () => {
  await ensureVendorsFile();
  return await fs.readJson(vendorsFile);
};

// 寫入廠商資料
const writeVendors = async (vendors) => {
  await fs.writeJson(vendorsFile, vendors, { spaces: 2 });
};

// GET /api/vendors - 獲取所有廠商
router.get('/', async (req, res) => {
  try {
    const vendors = await readVendors();

    // 不返回密碼
    const safeVendors = vendors.map(({ password, ...vendor }) => vendor);

    res.json({
      success: true,
      data: safeVendors
    });
  } catch (error) {
    console.error('獲取廠商列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取廠商列表失敗'
    });
  }
});

// GET /api/vendors/:id - 獲取單個廠商
router.get('/:id', async (req, res) => {
  try {
    const vendors = await readVendors();
    const vendor = vendors.find(v => v.id === parseInt(req.params.id));

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: '找不到指定廠商'
      });
    }

    // 不返回密碼
    const { password, ...safeVendor } = vendor;

    res.json({
      success: true,
      data: safeVendor
    });
  } catch (error) {
    console.error('獲取廠商失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取廠商失敗'
    });
  }
});

// POST /api/vendors - 創建新廠商
router.post('/', async (req, res) => {
  try {
    const vendors = await readVendors();

    const { name, address, email, phone, username, password } = req.body;

    // 驗證必填欄位
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: '請提供所有必填欄位'
      });
    }

    // 檢查帳號是否已存在
    if (vendors.some(v => v.username === username)) {
      return res.status(400).json({
        success: false,
        message: '帳號已存在'
      });
    }

    // 生成新的 ID
    const newId = vendors.length > 0 ? Math.max(...vendors.map(v => v.id)) + 1 : 1;

    const newVendor = {
      id: newId,
      name,
      address: address || '',
      email,
      phone: phone || '',
      username,
      password, // 實際應用應該加密密碼
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    vendors.push(newVendor);
    await writeVendors(vendors);

    // 不返回密碼
    const { password: _, ...safeVendor } = newVendor;

    res.status(201).json({
      success: true,
      data: safeVendor
    });
  } catch (error) {
    console.error('創建廠商失敗:', error);
    res.status(500).json({
      success: false,
      message: '創建廠商失敗'
    });
  }
});

// PUT /api/vendors/:id - 更新廠商
router.put('/:id', async (req, res) => {
  try {
    const vendors = await readVendors();
    const index = vendors.findIndex(v => v.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '找不到指定廠商'
      });
    }

    const { name, address, email, phone, password, isActive } = req.body;

    // 更新廠商資料
    vendors[index] = {
      ...vendors[index],
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(password !== undefined && { password }), // 實際應用應該加密密碼
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date().toISOString()
    };

    await writeVendors(vendors);

    // 不返回密碼
    const { password: _, ...safeVendor } = vendors[index];

    res.json({
      success: true,
      data: safeVendor
    });
  } catch (error) {
    console.error('更新廠商失敗:', error);
    res.status(500).json({
      success: false,
      message: '更新廠商失敗'
    });
  }
});

// DELETE /api/vendors/:id - 刪除廠商
router.delete('/:id', async (req, res) => {
  try {
    const vendors = await readVendors();
    const index = vendors.findIndex(v => v.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '找不到指定廠商'
      });
    }

    vendors.splice(index, 1);
    await writeVendors(vendors);

    res.json({
      success: true,
      message: '廠商已刪除'
    });
  } catch (error) {
    console.error('刪除廠商失敗:', error);
    res.status(500).json({
      success: false,
      message: '刪除廠商失敗'
    });
  }
});

module.exports = router;
