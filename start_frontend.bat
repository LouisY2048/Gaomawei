@echo off
echo 正在启动前端服务...

:: 切换到前端目录
cd frontend

:: 启动Python HTTP服务器
start cmd /k "python -m http.server 3000"

echo 前端服务启动完成！
echo 请在浏览器中访问 http://localhost:3000 