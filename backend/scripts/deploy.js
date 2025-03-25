const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 部署 Token0
  const Token0 = await hre.ethers.getContractFactory("NewToken");
  const token0 = await Token0.deploy("Token0", "T0");
  await token0.waitForDeployment();
  console.log("Token0 deployed to:", await token0.getAddress());

  // 部署 Token1
  const Token1 = await hre.ethers.getContractFactory("NewToken");
  const token1 = await Token1.deploy("Token1", "T1");
  await token1.waitForDeployment();
  console.log("Token1 deployed to:", await token1.getAddress());

  // 部署 Pool
  const Pool = await hre.ethers.getContractFactory("Pool");
  const pool = await Pool.deploy(
    await token0.getAddress(),
    await token1.getAddress()
  );
  await pool.waitForDeployment();
  console.log("Pool deployed to:", await pool.getAddress());

  // 为测试用户提供一些代币
  const token0Amount = hre.ethers.parseUnits("1000", 18);
  const token1Amount = hre.ethers.parseUnits("1000", 18);
  
  await token0.transfer(deployer.address, token0Amount);
  await token1.transfer(deployer.address, token1Amount);
  
  console.log("Transferred test tokens to deployer");

  // 将合约地址写入文件，便于前端使用
  const addresses = {
    token0: await token0.getAddress(),
    token1: await token1.getAddress(),
    pool: await pool.getAddress(),
  };

  const fs = require('fs');
  fs.writeFileSync(
    'frontend/src/contract-addresses.json',
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