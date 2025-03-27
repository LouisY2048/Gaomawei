const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 部署 Token0
  const Token0 = await hre.ethers.getContractFactory("NewToken");
  const token0 = await Token0.deploy("Token0", "T0");
  await token0.waitForDeployment();
  const token0Address = await token0.getAddress();
  console.log("Token0 deployed to:", token0Address);

  // 部署 Token1
  const Token1 = await hre.ethers.getContractFactory("NewToken");
  const token1 = await Token1.deploy("Token1", "T1");
  await token1.waitForDeployment();
  const token1Address = await token1.getAddress();
  console.log("Token1 deployed to:", token1Address);

  // 部署 Pool
  const Pool = await hre.ethers.getContractFactory("Pool");
  const pool = await Pool.deploy(token0Address, token1Address);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("Pool deployed to:", poolAddress);

  // 将合约地址写入文件，便于前端使用
  const addresses = {
    token0: token0Address,
    token1: token1Address,
    pool: poolAddress,
  };

  const fs = require('fs');
  const path = require('path');
  
  // 确保目录存在
  const dir = path.join(__dirname, '../../frontend/src');
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(dir, 'contract-addresses.json'),
    JSON.stringify(addresses, null, 2)
  );
  console.log("Contract addresses written to frontend/src/contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 