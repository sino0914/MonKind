# ProductMaintenance 清理腳本
# 用途: 刪除舊版檔案和不再需要的本地組件

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ProductMaintenance 清理腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 警告訊息
Write-Host "⚠️  警告: 此操作將刪除以下檔案:" -ForegroundColor Red
Write-Host ""
Write-Host "Admin App:" -ForegroundColor Yellow
Write-Host "  - packages/admin-app/src/pages/Products/hooks/" -ForegroundColor Gray
Write-Host "  - packages/admin-app/src/pages/Products/components/" -ForegroundColor Gray
Write-Host "  - packages/admin-app/src/utils/bleedAreaUtils.js" -ForegroundColor Gray
Write-Host "  - packages/admin-app/src/pages/Products/ProductMaintenance.OLD.jsx" -ForegroundColor Gray
Write-Host ""
Write-Host "Customer App:" -ForegroundColor Yellow
Write-Host "  - packages/customer-app/src/pages/Admin/ProductMaintenance.OLD.jsx" -ForegroundColor Gray
Write-Host ""

# 確認用戶是否真的要清理
$confirmation = Read-Host "確定要刪除這些檔案嗎？此操作無法復原！ (yes/no)"
if ($confirmation -ne 'yes') {
    Write-Host "已取消清理操作" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
$deletedCount = 0
$failedCount = 0

# 刪除 Admin App 本地 hooks
Write-Host "清理 Admin App hooks..." -ForegroundColor Yellow
if (Test-Path ".\packages\admin-app\src\pages\Products\hooks") {
    try {
        Remove-Item -Path ".\packages\admin-app\src\pages\Products\hooks" -Recurse -Force
        Write-Host "  ✓ 已刪除 hooks 目錄" -ForegroundColor Green
        $deletedCount++
    } catch {
        Write-Host "  ✗ 刪除失敗: $_" -ForegroundColor Red
        $failedCount++
    }
} else {
    Write-Host "  - hooks 目錄不存在，跳過" -ForegroundColor Gray
}

# 刪除 Admin App 本地 components
Write-Host "清理 Admin App components..." -ForegroundColor Yellow
if (Test-Path ".\packages\admin-app\src\pages\Products\components") {
    try {
        Remove-Item -Path ".\packages\admin-app\src\pages\Products\components" -Recurse -Force
        Write-Host "  ✓ 已刪除 components 目錄" -ForegroundColor Green
        $deletedCount++
    } catch {
        Write-Host "  ✗ 刪除失敗: $_" -ForegroundColor Red
        $failedCount++
    }
} else {
    Write-Host "  - components 目錄不存在，跳過" -ForegroundColor Gray
}

# 刪除 Admin App bleedAreaUtils.js
Write-Host "清理 Admin App bleedAreaUtils.js..." -ForegroundColor Yellow
if (Test-Path ".\packages\admin-app\src\utils\bleedAreaUtils.js") {
    try {
        Remove-Item -Path ".\packages\admin-app\src\utils\bleedAreaUtils.js" -Force
        Write-Host "  ✓ 已刪除 bleedAreaUtils.js" -ForegroundColor Green
        $deletedCount++
    } catch {
        Write-Host "  ✗ 刪除失敗: $_" -ForegroundColor Red
        $failedCount++
    }
} else {
    Write-Host "  - bleedAreaUtils.js 不存在，跳過" -ForegroundColor Gray
}

# 刪除 Admin App 舊版備份
Write-Host "清理 Admin App 舊版備份..." -ForegroundColor Yellow
if (Test-Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx") {
    try {
        Remove-Item -Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx" -Force
        Write-Host "  ✓ 已刪除 ProductMaintenance.OLD.jsx" -ForegroundColor Green
        $deletedCount++
    } catch {
        Write-Host "  ✗ 刪除失敗: $_" -ForegroundColor Red
        $failedCount++
    }
} else {
    Write-Host "  - 舊版備份不存在，跳過" -ForegroundColor Gray
}

# 刪除 Customer App 舊版備份
Write-Host "清理 Customer App 舊版備份..." -ForegroundColor Yellow
if (Test-Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx") {
    try {
        Remove-Item -Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx" -Force
        Write-Host "  ✓ 已刪除 ProductMaintenance.OLD.jsx" -ForegroundColor Green
        $deletedCount++
    } catch {
        Write-Host "  ✗ 刪除失敗: $_" -ForegroundColor Red
        $failedCount++
    }
} else {
    Write-Host "  - 舊版備份不存在，跳過" -ForegroundColor Gray
}

# 刪除 .NEW.jsx 檔案（如果還存在）
Write-Host "清理暫存的 .NEW.jsx 檔案..." -ForegroundColor Yellow
if (Test-Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.NEW.jsx") {
    try {
        Remove-Item -Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.NEW.jsx" -Force
        Write-Host "  ✓ 已刪除 Admin App .NEW.jsx" -ForegroundColor Green
        $deletedCount++
    } catch {
        Write-Host "  ✗ 刪除失敗: $_" -ForegroundColor Red
        $failedCount++
    }
}

if (Test-Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.NEW.jsx") {
    try {
        Remove-Item -Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.NEW.jsx" -Force
        Write-Host "  ✓ 已刪除 Customer App .NEW.jsx" -ForegroundColor Green
        $deletedCount++
    } catch {
        Write-Host "  ✗ 刪除失敗: $_" -ForegroundColor Red
        $failedCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "清理完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "統計:" -ForegroundColor Cyan
Write-Host "  已刪除: $deletedCount 個項目" -ForegroundColor Green
if ($failedCount -gt 0) {
    Write-Host "  失敗: $failedCount 個項目" -ForegroundColor Red
}
Write-Host ""
Write-Host "估計節省: ~3,400 行代碼 (70%)" -ForegroundColor Cyan
Write-Host ""
