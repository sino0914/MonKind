const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const router = express.Router();
const dataDir = path.join(__dirname, '../data');
const usersFile = path.join(dataDir, 'users.json');

// 讀取用戶數據
const readUsers = async () => {
  try {
    if (await fs.pathExists(usersFile)) {
      return await fs.readJson(usersFile);
    }
    return [];
  } catch (error) {
    console.error('讀取用戶數據失敗:', error);
    return [];
  }
};

// 寫入用戶數據
const writeUsers = async (users) => {
  try {
    await fs.writeJson(usersFile, users, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('寫入用戶數據失敗:', error);
    return false;
  }
};

// GET /api/users - 獲取所有用戶（管理員功能）
router.get('/', async (req, res) => {
  try {
    const users = await readUsers();

    // 移除密碼信息
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      success: true,
      data: safeUsers
    });
  } catch (error) {
    console.error('獲取用戶列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取用戶列表失敗'
    });
  }
});

// POST /api/users/register - 用戶註冊
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '電子郵件和密碼不能為空'
      });
    }

    const users = await readUsers();

    // 檢查用戶是否已存在
    if (users.find(user => user.email === email)) {
      return res.status(400).json({
        success: false,
        message: '該電子郵件已被註冊'
      });
    }

    // 生成新用戶 ID
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

    const newUser = {
      id: newId,
      email,
      password, // 實際應用中應該加密密碼
      name: name || email.split('@')[0],
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    users.push(newUser);

    if (await writeUsers(users)) {
      // 返回時移除密碼
      const { password: _, ...safeUser } = newUser;

      res.status(201).json({
        success: true,
        data: safeUser,
        message: '用戶註冊成功'
      });
    } else {
      throw new Error('保存用戶數據失敗');
    }
  } catch (error) {
    console.error('用戶註冊失敗:', error);
    res.status(500).json({
      success: false,
      message: '用戶註冊失敗'
    });
  }
});

// POST /api/users/login - 用戶登入
router.post('/login', async (req, res) => {
  try {
    console.log('收到登入請求 - req.body:', req.body);
    const { username, email, password } = req.body;

    // 支援使用 username 或 email 登入
    const loginIdentifier = username || email;
    console.log('登入識別:', { username, email, password: password ? '***' : undefined, loginIdentifier });

    if (!loginIdentifier || !password) {
      console.log('驗證失敗 - 缺少必要欄位');
      return res.status(400).json({
        success: false,
        message: '帳號和密碼不能為空'
      });
    }

    const users = await readUsers();
    // 支援使用 username 或 email 登入
    const user = users.find(u =>
      (u.username === loginIdentifier || u.email === loginIdentifier) &&
      u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '帳號或密碼錯誤'
      });
    }

    // 返回時移除密碼
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      data: safeUser,
      message: '登入成功'
    });
  } catch (error) {
    console.error('用戶登入失敗:', error);
    res.status(500).json({
      success: false,
      message: '用戶登入失敗'
    });
  }
});

// GET /api/users/:id - 獲取單個用戶
router.get('/:id', async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === parseInt(req.params.id));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '找不到指定用戶'
      });
    }

    // 移除密碼信息
    const { password, ...safeUser } = user;

    res.json({
      success: true,
      data: safeUser
    });
  } catch (error) {
    console.error('獲取用戶失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取用戶失敗'
    });
  }
});

module.exports = router;