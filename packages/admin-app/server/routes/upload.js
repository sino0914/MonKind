const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const uploadsDir = path.join(__dirname, '../data/uploads');

// 配置 multer 用於文件上傳
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    // 根據文件類型決定存儲目錄
    if (file.fieldname === 'glb' || file.originalname.toLowerCase().endsWith('.glb') || file.originalname.toLowerCase().endsWith('.gltf')) {
      uploadPath = path.join(uploadsDir, 'glb');
    } else if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadsDir, 'images');
    } else {
      uploadPath = uploadsDir;
    }

    // 確保目錄存在
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名但保持原始擴展名
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

// 文件類型和大小限制
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'model/gltf-binary',    // .glb
    'model/gltf+json',      // .gltf
    'application/octet-stream', // 通用二進制文件（包括 .glb）
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ];

  const allowedExtensions = ['.glb', '.gltf', '.jpg', '.jpeg', '.png', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件類型: ${file.mimetype} (${ext})`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB 限制
    files: 5 // 最多 5 個文件
  }
});

// 獲取文件信息的輔助函數
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      sizeKB: (stats.size / 1024).toFixed(2),
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    return null;
  }
};

// POST /api/upload/glb - 上傳 GLB 文件
router.post('/glb', upload.single('glb'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '沒有接收到文件'
      });
    }

    const fileInfo = await getFileInfo(req.file.path);

    res.json({
      success: true,
      message: 'GLB 文件上傳成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeKB: (req.file.size / 1024).toFixed(2),
        sizeMB: (req.file.size / (1024 * 1024)).toFixed(2),
        mimetype: req.file.mimetype,
        url: `/uploads/glb/${req.file.filename}`,
        uploadedAt: new Date().toISOString(),
        fileInfo
      }
    });
  } catch (error) {
    console.error('GLB 上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'GLB 文件上傳失敗'
    });
  }
});

// POST /api/upload/image - 上傳圖片文件
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '沒有接收到圖片文件'
      });
    }

    const fileInfo = await getFileInfo(req.file.path);

    res.json({
      success: true,
      message: '圖片上傳成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeKB: (req.file.size / 1024).toFixed(2),
        mimetype: req.file.mimetype,
        url: `/uploads/images/${req.file.filename}`,
        uploadedAt: new Date().toISOString(),
        fileInfo
      }
    });
  } catch (error) {
    console.error('圖片上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '圖片上傳失敗'
    });
  }
});

// POST /api/upload/element - 上傳元素圖片（與 /image 相同，但使用 element 字段名）
router.post('/element', upload.single('element'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '沒有接收到元素圖片文件'
      });
    }

    const fileInfo = await getFileInfo(req.file.path);

    res.json({
      success: true,
      message: '元素圖片上傳成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeKB: (req.file.size / 1024).toFixed(2),
        mimetype: req.file.mimetype,
        url: `/uploads/images/${req.file.filename}`,
        uploadedAt: new Date().toISOString(),
        fileInfo
      }
    });
  } catch (error) {
    console.error('元素圖片上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '元素圖片上傳失敗'
    });
  }
});

// POST /api/upload/editor-image - 上傳編輯器圖片（使用者專屬目錄）
router.post('/editor-image', upload.single('editorImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '沒有接收到編輯器圖片文件'
      });
    }

    // 從 body 取得 userId（預設為 guest）
    const userId = req.body.userId || 'guest';

    // 建立使用者專屬資料夾 /data/users/{userId}/images/
    const userImagesDir = path.join(__dirname, '../data/users', userId, 'images');
    await fs.ensureDir(userImagesDir);

    // 移動檔案到使用者資料夾
    const newFilePath = path.join(userImagesDir, req.file.filename);
    await fs.move(req.file.path, newFilePath, { overwrite: true });

    const fileInfo = await getFileInfo(newFilePath);
    const url = `/data/users/${userId}/images/${req.file.filename}`;

    console.log('✅ 編輯器圖片已儲存:', {
      filename: req.file.filename,
      userId,
      path: newFilePath
    });

    res.json({
      success: true,
      message: '編輯器圖片上傳成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeKB: (req.file.size / 1024).toFixed(2),
        mimetype: req.file.mimetype,
        url,
        userId,
        uploadedAt: new Date().toISOString(),
        fileInfo
      }
    });
  } catch (error) {
    console.error('編輯器圖片上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '編輯器圖片上傳失敗'
    });
  }
});

// POST /api/upload/snapshot - 上傳 3D 快照（接收 base64）
router.post('/snapshot', async (req, res) => {
  try {
    const { base64Image, productId } = req.body;

    if (!base64Image) {
      return res.status(400).json({
        success: false,
        message: '沒有接收到快照資料'
      });
    }

    // 解析 base64（移除 data:image/... 前綴）
    const matches = base64Image.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: '無效的 base64 圖片格式'
      });
    }

    const imageType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 建立 snapshots 資料夾
    const snapshotsDir = path.join(uploadsDir, 'snapshots');
    await fs.ensureDir(snapshotsDir);

    // 生成唯一檔名
    const filename = `${uuidv4()}.jpg`;
    const filePath = path.join(snapshotsDir, filename);

    // 儲存圖片
    await fs.writeFile(filePath, buffer);

    const fileSize = buffer.length;
    const url = `/uploads/snapshots/${filename}`;

    console.log('✅ 3D 快照已儲存:', {
      filename,
      size: (fileSize / 1024).toFixed(2) + ' KB',
      productId
    });

    res.json({
      success: true,
      message: '快照上傳成功',
      data: {
        filename,
        size: fileSize,
        sizeKB: (fileSize / 1024).toFixed(2),
        url,
        uploadedAt: new Date().toISOString(),
        productId
      }
    });
  } catch (error) {
    console.error('快照上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '快照上傳失敗'
    });
  }
});

// POST /api/upload/print-file - 上傳高解析度列印檔案
router.post('/print-file', upload.single('printFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '沒有接收到列印檔案'
      });
    }

    const { productId } = req.body;

    // 建立 print-files 資料夾
    const printFilesDir = path.join(uploadsDir, 'print-files');
    await fs.ensureDir(printFilesDir);

    // 移動檔案到 print-files 資料夾（因為 multer 可能先存到 images）
    const newFilePath = path.join(printFilesDir, req.file.filename);
    if (req.file.path !== newFilePath) {
      await fs.move(req.file.path, newFilePath, { overwrite: true });
    }

    const fileInfo = await getFileInfo(newFilePath);
    const url = `/uploads/print-files/${req.file.filename}`;

    console.log('✅ 列印檔案已儲存:', {
      filename: req.file.filename,
      size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
      productId
    });

    // 上傳完成後，觸發清理舊的列印檔案
    const { cleanupOldPrintFiles } = require('../utils/cleanupPrintFiles');
    cleanupOldPrintFiles().catch(err => {
      console.error('清理列印檔案失敗:', err);
    });

    res.json({
      success: true,
      message: '列印檔案上傳成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        sizeMB: (req.file.size / (1024 * 1024)).toFixed(2),
        url,
        uploadedAt: new Date().toISOString(),
        productId,
        fileInfo
      }
    });
  } catch (error) {
    console.error('列印檔案上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '列印檔案上傳失敗'
    });
  }
});

// POST /api/upload/multiple - 批量上傳文件
router.post('/multiple', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '沒有接收到文件'
      });
    }

    const fileResults = [];

    for (const file of req.files) {
      const fileInfo = await getFileInfo(file.path);
      const fileType = file.fieldname === 'glb' || file.originalname.toLowerCase().match(/\.(glb|gltf)$/) ? 'glb' : 'image';

      fileResults.push({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        sizeKB: (file.size / 1024).toFixed(2),
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        mimetype: file.mimetype,
        url: `/uploads/${fileType}s/${file.filename}`,
        type: fileType,
        uploadedAt: new Date().toISOString(),
        fileInfo
      });
    }

    res.json({
      success: true,
      message: `成功上傳 ${req.files.length} 個文件`,
      data: fileResults
    });
  } catch (error) {
    console.error('批量上傳失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '批量上傳失敗'
    });
  }
});

// GET /api/upload/files - 獲取上傳的文件列表
router.get('/files', async (req, res) => {
  try {
    const { type, userId } = req.query; // glb, images, editor-image, element, all

    // 如果請求的是 editor-image，返回使用者專屬資料夾的文件
    if (type === 'editor-image') {
      const actualUserId = userId || 'guest';
      const userImagesDir = path.join(__dirname, '../data/users', actualUserId, 'images');
      const filesList = [];

      if (await fs.pathExists(userImagesDir)) {
        const userFiles = await fs.readdir(userImagesDir);
        for (const filename of userFiles) {
          const filePath = path.join(userImagesDir, filename);
          const stats = await fs.stat(filePath);

          // 只返回圖片檔案
          if (stats.isFile() && /\.(jpg|jpeg|png|webp|svg)$/i.test(filename)) {
            const fileInfo = await getFileInfo(filePath);
            if (fileInfo) {
              filesList.push({
                filename,
                url: `/data/users/${actualUserId}/images/${filename}`,
                userId: actualUserId,
                ...fileInfo
              });
            }
          }
        }
      }

      console.log(`📂 載入使用者圖片 (userId: ${actualUserId}):`, filesList.length, '張圖片');
      return res.json(filesList);
    }

    // 如果請求的是 element，都返回 images 目錄的文件
    if (type === 'element') {
      const imagesDir = path.join(uploadsDir, 'images');
      const filesList = [];

      if (await fs.pathExists(imagesDir)) {
        const imageFiles = await fs.readdir(imagesDir);
        for (const filename of imageFiles) {
          const filePath = path.join(imagesDir, filename);
          const fileInfo = await getFileInfo(filePath);
          if (fileInfo) {
            filesList.push({
              filename,
              url: `/uploads/images/${filename}`,
              ...fileInfo
            });
          }
        }
      }

      return res.json(filesList);
    }

    // 原有的邏輯
    const result = {
      success: true,
      data: {
        glb: [],
        images: []
      }
    };

    // 獲取 GLB 文件
    if (!type || type === 'glb' || type === 'all') {
      const glbDir = path.join(uploadsDir, 'glb');
      if (await fs.pathExists(glbDir)) {
        const glbFiles = await fs.readdir(glbDir);
        for (const filename of glbFiles) {
          const filePath = path.join(glbDir, filename);
          const fileInfo = await getFileInfo(filePath);
          if (fileInfo) {
            result.data.glb.push({
              filename,
              url: `/uploads/glb/${filename}`,
              ...fileInfo
            });
          }
        }
      }
    }

    // 獲取圖片文件
    if (!type || type === 'images' || type === 'all') {
      const imagesDir = path.join(uploadsDir, 'images');
      if (await fs.pathExists(imagesDir)) {
        const imageFiles = await fs.readdir(imagesDir);
        for (const filename of imageFiles) {
          const filePath = path.join(imagesDir, filename);
          const fileInfo = await getFileInfo(filePath);
          if (fileInfo) {
            result.data.images.push({
              filename,
              url: `/uploads/images/${filename}`,
              ...fileInfo
            });
          }
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error('獲取文件列表失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取文件列表失敗'
    });
  }
});

// DELETE /api/upload/file/:type/:filename - 刪除文件
router.delete('/file/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    const { userId } = req.query;

    let filePath;

    // 如果是 editor-image 且有 userId，從使用者資料夾刪除
    if (type === 'editor-image' && userId) {
      const userImagesDir = path.join(__dirname, '../data/users', userId, 'images');
      filePath = path.join(userImagesDir, filename);
    } else {
      // 將 editor-image 和 element 映射到 images 目錄
      let actualType = type;
      if (type === 'editor-image' || type === 'element') {
        actualType = 'images';
      }

      if (!['glb', 'images'].includes(actualType)) {
        return res.status(400).json({
          success: false,
          message: '無效的文件類型'
        });
      }

      filePath = path.join(uploadsDir, actualType, filename);
    }

    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      console.log(`✅ 文件已刪除: ${filePath}`);
      res.json({
        success: true,
        message: '文件刪除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
  } catch (error) {
    console.error('刪除文件失敗:', error);
    res.status(500).json({
      success: false,
      message: '刪除文件失敗'
    });
  }
});

// GET /api/upload/storage - 獲取存儲使用情況
router.get('/storage', async (req, res) => {
  try {
    const calculateDirSize = async (dirPath) => {
      if (!await fs.pathExists(dirPath)) return 0;

      let totalSize = 0;
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return totalSize;
    };

    const glbSize = await calculateDirSize(path.join(uploadsDir, 'glb'));
    const imagesSize = await calculateDirSize(path.join(uploadsDir, 'images'));
    const totalSize = glbSize + imagesSize;

    res.json({
      success: true,
      data: {
        total: {
          bytes: totalSize,
          kb: (totalSize / 1024).toFixed(2),
          mb: (totalSize / (1024 * 1024)).toFixed(2),
          gb: (totalSize / (1024 * 1024 * 1024)).toFixed(2)
        },
        glb: {
          bytes: glbSize,
          mb: (glbSize / (1024 * 1024)).toFixed(2)
        },
        images: {
          bytes: imagesSize,
          mb: (imagesSize / (1024 * 1024)).toFixed(2)
        }
      }
    });
  } catch (error) {
    console.error('獲取存儲信息失敗:', error);
    res.status(500).json({
      success: false,
      message: '獲取存儲信息失敗'
    });
  }
});

// 錯誤處理中間件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超過限制 (最大 200MB)'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '文件數量超過限制 (最多 5 個)'
      });
    }
  }

  res.status(500).json({
    success: false,
    message: error.message || '文件上傳失敗'
  });
});

module.exports = router;