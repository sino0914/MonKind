@echo off
echo �ҰʤT�ӱM��...

start "API���A��" cmd /k "cd /d %~dp0 && cd gwgw-gift-admin\server && npm start"
start "�e��x���A��" cmd /k "cd /d %~dp0 && pnpm dev:all"

echo �����Ұʧ����I

