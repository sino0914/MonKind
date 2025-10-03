const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const CART_FILE = path.join(DATA_DIR, 'carts.json');

// 確保資料目錄存在
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// 讀取所有購物車資料
async function readCarts() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(CART_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 如果檔案不存在，返回空物件
    return {};
  }
}

// 寫入購物車資料
async function writeCarts(carts) {
  await ensureDataDir();
  await fs.writeFile(CART_FILE, JSON.stringify(carts, null, 2), 'utf8');
}

// 獲取用戶購物車（基於 session ID）
router.get('/', async (req, res) => {
  try {
    const sessionId = req.sessionID || 'guest';
    const carts = await readCarts();
    const cart = carts[sessionId] || [];

    res.json({ success: true, cart });
  } catch (error) {
    console.error('獲取購物車失敗:', error);
    res.status(500).json({ success: false, message: '獲取購物車失敗' });
  }
});

// 更新用戶購物車（完整替換）
router.post('/', async (req, res) => {
  try {
    const sessionId = req.sessionID || 'guest';
    const { cart } = req.body;

    if (!Array.isArray(cart)) {
      return res.status(400).json({
        success: false,
        message: '無效的購物車資料'
      });
    }

    const carts = await readCarts();
    carts[sessionId] = cart;
    await writeCarts(carts);

    res.json({ success: true, cart });
  } catch (error) {
    console.error('更新購物車失敗:', error);
    res.status(500).json({ success: false, message: '更新購物車失敗' });
  }
});

// 添加商品到購物車
router.post('/add', async (req, res) => {
  try {
    const sessionId = req.sessionID || 'guest';
    const { product } = req.body;

    const carts = await readCarts();
    const cart = carts[sessionId] || [];

    // 檢查商品是否已存在
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex !== -1) {
      // 增加數量
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
      // 新增商品
      cart.push({ ...product, quantity: 1 });
    }

    carts[sessionId] = cart;
    await writeCarts(carts);

    res.json({ success: true, cart });
  } catch (error) {
    console.error('添加商品失敗:', error);
    res.status(500).json({ success: false, message: '添加商品失敗' });
  }
});

// 移除商品
router.delete('/:productId', async (req, res) => {
  try {
    const sessionId = req.sessionID || 'guest';
    const { productId } = req.params;

    const carts = await readCarts();
    const cart = carts[sessionId] || [];

    const updatedCart = cart.filter(item => item.id !== productId);
    carts[sessionId] = updatedCart;
    await writeCarts(carts);

    res.json({ success: true, cart: updatedCart });
  } catch (error) {
    console.error('移除商品失敗:', error);
    res.status(500).json({ success: false, message: '移除商品失敗' });
  }
});

// 更新商品數量
router.put('/:productId', async (req, res) => {
  try {
    const sessionId = req.sessionID || 'guest';
    const { productId } = req.params;
    const { quantity } = req.body;

    const carts = await readCarts();
    const cart = carts[sessionId] || [];

    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
      if (quantity <= 0) {
        // 數量為 0 時移除
        cart.splice(itemIndex, 1);
      } else {
        cart[itemIndex].quantity = quantity;
      }
    }

    carts[sessionId] = cart;
    await writeCarts(carts);

    res.json({ success: true, cart });
  } catch (error) {
    console.error('更新數量失敗:', error);
    res.status(500).json({ success: false, message: '更新數量失敗' });
  }
});

// 清空購物車
router.delete('/', async (req, res) => {
  try {
    const sessionId = req.sessionID || 'guest';

    const carts = await readCarts();
    carts[sessionId] = [];
    await writeCarts(carts);

    res.json({ success: true, cart: [] });
  } catch (error) {
    console.error('清空購物車失敗:', error);
    res.status(500).json({ success: false, message: '清空購物車失敗' });
  }
});

module.exports = router;
