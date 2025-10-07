const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const vendorsFile = path.join(dataDir, 'vendors.json');
const adminsFile = path.join(dataDir, 'admins.json');

// 確保管理員資料檔案存在
const ensureAdminsFile = async () => {
  if (!await fs.pathExists(adminsFile)) {
    // 建立預設管理員
    const defaultAdmins = [
      {
        id: 1,
        username: 'admin',
        password: 'admin123', // 實際應用應該加密
        name: '系統管理員',
        email: 'admin@monkind.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
    await fs.writeJson(adminsFile, defaultAdmins, { spaces: 2 });
  }
};

// 讀取管理員資料
const readAdmins = async () => {
  await ensureAdminsFile();
  return await fs.readJson(adminsFile);
};

// 讀取廠商資料
const readVendors = async () => {
  if (await fs.pathExists(vendorsFile)) {
    return await fs.readJson(vendorsFile);
  }
  return [];
};

// POST /api/auth/login - 登入
router.post('/login', async (req, res) => {
  try {
    const { username, password, userType } = req.body;

    if (!username || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: '請提供帳號、密碼和用戶類型'
      });
    }

    let user = null;

    if (userType === 'admin') {
      // 管理員登入
      const admins = await readAdmins();
      user = admins.find(a => a.username === username && a.password === password);

      if (user) {
        const { password: _, ...safeUser } = user;
        return res.json({
          success: true,
          data: {
            ...safeUser,
            userType: 'admin'
          },
          message: '登入成功'
        });
      }
    } else if (userType === 'vendor') {
      // 廠商登入
      const vendors = await readVendors();
      user = vendors.find(v => v.username === username && v.password === password && v.isActive);

      if (user) {
        const { password: _, ...safeUser } = user;
        return res.json({
          success: true,
          data: {
            ...safeUser,
            userType: 'vendor'
          },
          message: '登入成功'
        });
      }
    }

    // 登入失敗
    res.status(401).json({
      success: false,
      message: '帳號或密碼錯誤'
    });

  } catch (error) {
    console.error('登入失敗:', error);
    res.status(500).json({
      success: false,
      message: '登入失敗'
    });
  }
});

// POST /api/auth/logout - 登出
router.post('/logout', async (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

// GET /api/auth/me - 獲取當前用戶資訊
router.get('/me', async (req, res) => {
  // 這裡應該從 session 或 token 中獲取用戶資訊
  // 簡化版本直接返回未認證
  res.status(401).json({
    success: false,
    message: '未登入'
  });
});

module.exports = router;
