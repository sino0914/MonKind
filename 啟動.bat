@echo off
echo 啟動三個專案...

start "API伺服器" cmd /k "cd /d %~dp0 && cd gwgw-gift-admin\server && npm start"
start "前後台伺服器" cmd /k "cd /d %~dp0 && pnpm dev:all"

echo 全部啟動完成！

