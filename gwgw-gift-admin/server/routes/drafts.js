const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const path = require('path');

const USERS_DATA_DIR = path.join(__dirname, '../../data/users');

// 確保 users 資料夾存在
fs.ensureDirSync(USERS_DATA_DIR);

/**
 * 獲取用戶資料夾路徑
 */
const getUserDir = (userId) => {
  return path.join(USERS_DATA_DIR, userId);
};

/**
 * 獲取用戶草稿檔案路徑
 */
const getUserDraftsFile = (userId) => {
  return path.join(getUserDir(userId), 'drafts.json');
};

/**
 * 獲取用戶的所有草稿
 * GET /api/drafts/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const draftsFile = getUserDraftsFile(userId);

    // 如果檔案不存在，返回空陣列
    if (!await fs.pathExists(draftsFile)) {
      return res.json([]);
    }

    const drafts = await fs.readJson(draftsFile);
    res.json(drafts);
  } catch (error) {
    console.error('獲取草稿失敗:', error);
    res.status(500).json({ error: '獲取草稿失敗' });
  }
});

/**
 * 儲存草稿
 * POST /api/drafts/:userId
 * Body: { id, productId, name, elements, backgroundColor, timestamp, snapshot3D }
 */
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const draftData = req.body;

    // 驗證必要欄位
    if (!draftData.id || !draftData.productId) {
      return res.status(400).json({ error: '缺少必要欄位: id 或 productId' });
    }

    // 確保用戶資料夾存在
    const userDir = getUserDir(userId);
    await fs.ensureDir(userDir);

    const draftsFile = getUserDraftsFile(userId);

    // 讀取現有草稿
    let drafts = [];
    if (await fs.pathExists(draftsFile)) {
      drafts = await fs.readJson(draftsFile);
    }

    // 檢查是否已存在相同 ID 的草稿
    const existingIndex = drafts.findIndex(d => d.id === draftData.id);
    if (existingIndex >= 0) {
      // 更新現有草稿
      drafts[existingIndex] = {
        ...drafts[existingIndex],
        ...draftData,
        updatedAt: new Date().toISOString()
      };
    } else {
      // 新增草稿
      drafts.push({
        ...draftData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // 儲存到檔案
    await fs.writeJson(draftsFile, drafts, { spaces: 2 });

    res.json({ success: true, draft: draftData });
  } catch (error) {
    console.error('儲存草稿失敗:', error);
    res.status(500).json({ error: '儲存草稿失敗' });
  }
});

/**
 * 刪除草稿
 * DELETE /api/drafts/:userId/:draftId
 */
router.delete('/:userId/:draftId', async (req, res) => {
  try {
    const { userId, draftId } = req.params;
    const draftsFile = getUserDraftsFile(userId);

    if (!await fs.pathExists(draftsFile)) {
      return res.status(404).json({ error: '找不到草稿' });
    }

    let drafts = await fs.readJson(draftsFile);
    const originalLength = drafts.length;

    // 移除指定的草稿
    drafts = drafts.filter(d => d.id !== draftId);

    if (drafts.length === originalLength) {
      return res.status(404).json({ error: '找不到指定的草稿' });
    }

    // 儲存更新後的草稿列表
    await fs.writeJson(draftsFile, drafts, { spaces: 2 });

    res.json({ success: true });
  } catch (error) {
    console.error('刪除草稿失敗:', error);
    res.status(500).json({ error: '刪除草稿失敗' });
  }
});

/**
 * 批量遷移草稿（從 localStorage）
 * POST /api/drafts/:userId/migrate
 * Body: { drafts: [...] }
 */
router.post('/:userId/migrate', async (req, res) => {
  try {
    const { userId } = req.params;
    const { drafts: newDrafts } = req.body;

    if (!Array.isArray(newDrafts)) {
      return res.status(400).json({ error: '無效的草稿資料格式' });
    }

    // 確保用戶資料夾存在
    const userDir = getUserDir(userId);
    await fs.ensureDir(userDir);

    const draftsFile = getUserDraftsFile(userId);

    // 讀取現有草稿
    let existingDrafts = [];
    if (await fs.pathExists(draftsFile)) {
      existingDrafts = await fs.readJson(draftsFile);
    }

    // 合併草稿（避免重複）
    const existingIds = new Set(existingDrafts.map(d => d.id));
    const draftsToAdd = newDrafts.filter(d => !existingIds.has(d.id));

    const allDrafts = [...existingDrafts, ...draftsToAdd];

    // 儲存到檔案
    await fs.writeJson(draftsFile, allDrafts, { spaces: 2 });

    res.json({
      success: true,
      migratedCount: draftsToAdd.length,
      totalCount: allDrafts.length
    });
  } catch (error) {
    console.error('遷移草稿失敗:', error);
    res.status(500).json({ error: '遷移草稿失敗' });
  }
});

module.exports = router;
