@echo off
echo �ҰʤT�ӱM��...

start "API���A��" cmd /k "cd /d %~dp0 && cd gwgw-gift-admin\server && npm start"
start "��x���A��" cmd /k "cd /d %~dp0 && cd gwgw-gift-admin && npm start"
start "�e�x���A��" cmd /k "cd /d %~dp0 && cd my-react-app && npm start"

echo �����Ұʧ����I

