const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs-extra');

// Routes
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const templateRoutes = require('./routes/templates');
const uploadRoutes = require('./routes/upload');
const elementRoutes = require('./routes/elements');
const cartRoutes = require('./routes/cart');
const draftRoutes = require('./routes/drafts');
const orderRoutes = require('./routes/orders');
const vendorRoutes = require('./routes/vendors');
const authRoutes = require('./routes/auth');
const pricingSettingsRoutes = require('./routes/pricing-settings');

const app = express();
const PORT = process.env.PORT || 3002;

// 確保數據目錄存在
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(dataDir, 'uploads');
const glbDir = path.join(uploadsDir, 'glb');
const imagesDir = path.join(uploadsDir, 'images');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');

// 創建必要的目錄
[dataDir, uploadsDir, glbDir, imagesDir, thumbnailsDir].forEach(dir => {
  fs.ensureDirSync(dir);
});

// 初始化數據文件（如果不存在）
const initDataFile = async (filename, defaultData) => {
  const filePath = path.join(dataDir, filename);
  if (!await fs.pathExists(filePath)) {
    await fs.writeJson(filePath, defaultData, { spaces: 2 });
  }
};

// 初始化所有數據文件
const initializeData = async () => {
  try {
    // 從前端的數據文件中讀取初始數據
    const frontendDataDir = path.join(__dirname, '../src/data');

    // 初始化產品數據
    const productsPath = path.join(frontendDataDir, 'products.json');
    let initialProducts = [];
    if (await fs.pathExists(productsPath)) {
      initialProducts = await fs.readJson(productsPath);
    }
    await initDataFile('products.json', initialProducts);

    // 初始化用戶數據（管理員帳號）
    await initDataFile('users.json', [
      {
        id: 1,
        username: 'admin',
        email: 'admin@monkind.com',
        password: 'admin123',
        isAdmin: true,
        name: '系統管理員',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);

    // 初始化模板數據
    await initDataFile('templates.json', []);

    // 初始化元素數據
    await initDataFile('elements.json', []);

    // 初始化購物車數據
    await initDataFile('carts.json', {});

    console.log('✅ 數據文件初始化完成');
  } catch (error) {
    console.error('❌ 數據文件初始化失敗:', error);
  }
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3003', 'http://127.0.0.1:3003'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 靜態文件服務 - 提供上傳的文件
app.use('/uploads', express.static(uploadsDir));
// 提供訂單資料（包含快照）
app.use('/data', express.static(dataDir));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/elements', elementRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pricing-settings', pricingSettingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: '服務器內部錯誤',
    message: process.env.NODE_ENV === 'development' ? err.message : '請稍後重試'
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    error: '找不到請求的資源',
    path: req.path
  });
});

// 啟動服務器
const startServer = async () => {
  try {
    await initializeData();

    app.listen(PORT, () => {
      console.log(`🚀 MonKind API Server 啟動成功!`);
      console.log(`📍 服務地址: http://localhost:${PORT}`);
      console.log(`📁 數據目錄: ${dataDir}`);
      console.log(`📤 上傳目錄: ${uploadsDir}`);
      console.log(`🏥 健康檢查: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
    process.exit(1);
  }
};

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n🛑 正在關閉服務器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到終止信號，正在關閉服務器...');
  process.exit(0);
});

startServer();

module.exports = app;