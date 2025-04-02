@echo off
echo 正在启动后端服务...

:: 切换到后端目录
cd backend

:: 启动本地节点
start cmd /k "npx hardhat node"

:: 等待几秒钟确保节点启动
timeout /t 5

:: 部署合约
start cmd /k "npx hardhat run scripts/deploy.js --network localhost"

echo 后端服务启动完成！
echo 请保持此窗口打开，并在另一个窗口中运行 start_frontend.bat 