const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const dataDir = path.join(__dirname, '../../data');
const productsFile = path.join(dataDir, 'products.json');

// 讀取產品數據
const readProducts = async () => {
  try {
    if (await fs.pathExists(productsFile)) {
      return await fs.readJson(productsFile);
    }
    return [];
  } catch (error) {
    console.error('讀取產品數據失敗:', error);
    return [];
  }
};

// 寫入產品數據
const writeProducts = async (products) => {
  try {
    await fs.writeJson(productsFile, products, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('寫入產品數據失敗:', error);
    return false;
  }
};

// GET /api/products - 獲取所有產品
router.get('/', async (req, res) => {
  try {
    const products = await readProducts();

    // 支持查詢參數
    const { category, featured, active } = req.query;

    let filteredProducts = products;

    if (category) {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }

    if (featured !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.featured === (featured === 'true'));
    }

    if (active !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.isActive !== false);
    }

    res.json({
      success: true,
      data: filteredProducts,
      count: filteredProducts.length
    });
  } catch (error) {
    console.error('獲取產品列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取產品列表失敗'
    });
  }
});

// GET /api/products/stats - 獲取產品統計（必須放在 /:id 之前）
router.get('/stats', async (req, res) => {
  try {
    const products = await readProducts();

    const stats = {
      total: products.length,
      featured: products.filter(p => p.featured).length,
      active: products.filter(p => p.isActive !== false).length,
      with3D: products.filter(p => p.type === '3D').length,
      categories: {}
    };

    // 統計分類
    products.forEach(product => {
      if (product.category) {
        stats.categories[product.category] = (stats.categories[product.category] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('獲取產品統計失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取產品統計失敗'
    });
  }
});

// GET /api/products/:id - 獲取單個產品
router.get('/:id', async (req, res) => {
  try {
    const products = await readProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '找不到指定產品'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('獲取產品失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取產品失敗'
    });
  }
});

// POST /api/products - 創建新產品
router.post('/', async (req, res) => {
  try {
    const products = await readProducts();

    // 生成新的 ID
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    const newProduct = {
      ...req.body,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);

    if (await writeProducts(products)) {
      res.status(201).json({
        success: true,
        data: newProduct,
        message: '產品創建成功'
      });
    } else {
      throw new Error('保存產品數據失敗');
    }
  } catch (error) {
    console.error('創建產品失敗:', error);
    res.status(500).json({
      success: false,
      message: '創建產品失敗'
    });
  }
});

// PUT /api/products/:id - 更新產品
router.put('/:id', async (req, res) => {
  try {
    const products = await readProducts();
    const index = products.findIndex(p => p.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '找不到指定產品'
      });
    }

    // 更新產品數據
    products[index] = {
      ...products[index],
      ...req.body,
      id: parseInt(req.params.id), // 確保 ID 不被覆蓋
      updatedAt: new Date().toISOString()
    };

    if (await writeProducts(products)) {
      res.json({
        success: true,
        data: products[index],
        message: '產品更新成功'
      });
    } else {
      throw new Error('保存產品數據失敗');
    }
  } catch (error) {
    console.error('更新產品失敗:', error);
    res.status(500).json({
      success: false,
      message: '更新產品失敗'
    });
  }
});

// DELETE /api/products/:id - 刪除產品
router.delete('/:id', async (req, res) => {
  try {
    const products = await readProducts();
    const index = products.findIndex(p => p.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: '找不到指定產品'
      });
    }

    const deletedProduct = products[index];

    // TODO: 清理相關的 GLB 文件和圖片
    if (deletedProduct.model3D?.glbUrl) {
      // 未來可以在這裡添加文件清理邏輯
    }

    products.splice(index, 1);

    if (await writeProducts(products)) {
      res.json({
        success: true,
        data: deletedProduct,
        message: '產品刪除成功'
      });
    } else {
      throw new Error('保存產品數據失敗');
    }
  } catch (error) {
    console.error('刪除產品失敗:', error);
    res.status(500).json({
      success: false,
      message: '刪除產品失敗'
    });
  }
});

module.exports = router;