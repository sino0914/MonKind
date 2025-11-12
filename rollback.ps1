# ProductMaintenance 回滾腳本
# 用途: 回滾到舊版組件

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ProductMaintenance 回滾腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 確認用戶是否真的要回滾
$confirmation = Read-Host "確定要回滾到舊版本嗎？ (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "已取消回滾操作" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "步驟 1/2: 回滾 Admin App..." -ForegroundColor Yellow
if (Test-Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx") {
    Copy-Item -Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx" `
              -Destination ".\packages\admin-app\src\pages\Products\ProductMaintenance.jsx" `
              -Force
    Write-Host "  ✓ 已回滾至舊版本" -ForegroundColor Green
} else {
    Write-Host "  ✗ 找不到備份檔案 ProductMaintenance.OLD.jsx" -ForegroundColor Red
}

Write-Host "步驟 2/2: 回滾 Customer App..." -ForegroundColor Yellow
if (Test-Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx") {
    Copy-Item -Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx" `
              -Destination ".\packages\customer-app\src\pages\Admin\ProductMaintenance.jsx" `
              -Force
    Write-Host "  ✓ 已回滾至舊版本" -ForegroundColor Green
} else {
    Write-Host "  ✗ 找不到備份檔案 ProductMaintenance.OLD.jsx" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ 回滾完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
