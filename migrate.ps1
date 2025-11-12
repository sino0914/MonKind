# ProductMaintenance 遷移腳本
# 用途: 自動化替換舊版組件為新版組件

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ProductMaintenance 組件遷移腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查是否在正確的目錄
if (-not (Test-Path ".\packages")) {
    Write-Host "錯誤: 請在專案根目錄執行此腳本" -ForegroundColor Red
    exit 1
}

Write-Host "步驟 1/4: 備份 Admin App 舊版本..." -ForegroundColor Yellow
if (Test-Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.jsx") {
    Copy-Item -Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.jsx" `
              -Destination ".\packages\admin-app\src\pages\Products\ProductMaintenance.OLD.jsx" `
              -Force
    Write-Host "  ✓ 已備份至 ProductMaintenance.OLD.jsx" -ForegroundColor Green
} else {
    Write-Host "  ! 找不到舊版檔案，跳過備份" -ForegroundColor Gray
}

Write-Host "步驟 2/4: 替換 Admin App 新版本..." -ForegroundColor Yellow
if (Test-Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.NEW.jsx") {
    Copy-Item -Path ".\packages\admin-app\src\pages\Products\ProductMaintenance.NEW.jsx" `
              -Destination ".\packages\admin-app\src\pages\Products\ProductMaintenance.jsx" `
              -Force
    Write-Host "  ✓ 已替換為新版本" -ForegroundColor Green
} else {
    Write-Host "  ✗ 找不到新版檔案 ProductMaintenance.NEW.jsx" -ForegroundColor Red
    exit 1
}

Write-Host "步驟 3/4: 備份 Customer App 舊版本..." -ForegroundColor Yellow
if (Test-Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.jsx") {
    Copy-Item -Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.jsx" `
              -Destination ".\packages\customer-app\src\pages\Admin\ProductMaintenance.OLD.jsx" `
              -Force
    Write-Host "  ✓ 已備份至 ProductMaintenance.OLD.jsx" -ForegroundColor Green
} else {
    Write-Host "  ! 找不到舊版檔案，跳過備份" -ForegroundColor Gray
}

Write-Host "步驟 4/4: 替換 Customer App 新版本..." -ForegroundColor Yellow
if (Test-Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.NEW.jsx") {
    Copy-Item -Path ".\packages\customer-app\src\pages\Admin\ProductMaintenance.NEW.jsx" `
              -Destination ".\packages\customer-app\src\pages\Admin\ProductMaintenance.jsx" `
              -Force
    Write-Host "  ✓ 已替換為新版本" -ForegroundColor Green
} else {
    Write-Host "  ✗ 找不到新版檔案 ProductMaintenance.NEW.jsx" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ 遷移完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "接下來的步驟:" -ForegroundColor Cyan
Write-Host "1. 測試 Admin App 功能" -ForegroundColor White
Write-Host "2. 測試 Customer App 功能" -ForegroundColor White
Write-Host "3. 確認無誤後，執行 cleanup.ps1 清理舊檔案" -ForegroundColor White
Write-Host ""
Write-Host "如需回滾，執行 rollback.ps1" -ForegroundColor Yellow
Write-Host ""
