@echo off
echo 啟動三個專案...

start "API伺服器" cmd /k "cd /d %~dp0 && cd gwgw-gift-admin\server && npm start"
start "後台伺服器" cmd /k "cd /d %~dp0 && cd gwgw-gift-admin && npm start"
start "前台伺服器" cmd /k "cd /d %~dp0 && cd my-react-app && npm start"

echo 全部啟動完成！

