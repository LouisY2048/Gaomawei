const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 部署 Alpha 代币
  const Alpha = await hre.ethers.getContractFactory("NewToken");
  const alpha = await Alpha.deploy("Alpha Token", "ALPHA", "https://api.example.com/token/alpha");
  await alpha.waitForDeployment();
  const alphaAddress = await alpha.getAddress();
  console.log("Alpha Token deployed to:", alphaAddress);

  // 部署 Beta 代币
  const Beta = await hre.ethers.getContractFactory("NewToken");
  const beta = await Beta.deploy("Beta Token", "BETA", "https://api.example.com/token/beta");
  await beta.waitForDeployment();
  const betaAddress = await beta.getAddress();
  console.log("Beta Token deployed to:", betaAddress);

  // 部署 Gamma 代币
  const Gamma = await hre.ethers.getContractFactory("NewToken");
  const gamma = await Gamma.deploy("Gamma Token", "GAMMA", "https://api.example.com/token/gamma");
  await gamma.waitForDeployment();
  const gammaAddress = await gamma.getAddress();
  console.log("Gamma Token deployed to:", gammaAddress);

  // 部署 Alpha-Beta 池
  const PoolAB = await hre.ethers.getContractFactory("Pool_AB");
  const poolAB = await PoolAB.deploy(alphaAddress, betaAddress);
  await poolAB.waitForDeployment();
  const poolABAddress = await poolAB.getAddress();
  console.log("Alpha-Beta Pool deployed to:", poolABAddress);

  // 部署 Beta-Gamma 池
  const PoolBG = await hre.ethers.getContractFactory("Pool_BG");
  const poolBG = await PoolBG.deploy(betaAddress, gammaAddress);
  await poolBG.waitForDeployment();
  const poolBGAddress = await poolBG.getAddress();
  console.log("Beta-Gamma Pool deployed to:", poolBGAddress);

  // 部署 Gamma-Alpha 池
  const PoolGA = await hre.ethers.getContractFactory("Pool_GA");
  const poolGA = await PoolGA.deploy(gammaAddress, alphaAddress);
  await poolGA.waitForDeployment();
  const poolGAAddress = await poolGA.getAddress();
  console.log("Gamma-Alpha Pool deployed to:", poolGAAddress);

  // 将合约地址写入文件，便于前端使用
  const addresses = {
    tokens: {
      alpha: alphaAddress,
      beta: betaAddress,
      gamma: gammaAddress
    },
    pools: {
      alphaBeta: poolABAddress,
      betaGamma: poolBGAddress,
      gammaAlpha: poolGAAddress
    }
  };

  const fs = require('fs');
  const path = require('path');
  
  // 确保目录存在
  const dir = path.join(__dirname, '../../demo/src');
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(dir, 'contract-addresses.json'),
    JSON.stringify(addresses, null, 2)
  );
  console.log("Contract addresses written to demo/src/contract-addresses.json");

  // 打印部署信息
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("Tokens:");
  console.log("- Alpha Token:", alphaAddress);
  console.log("- Beta Token:", betaAddress);
  console.log("- Gamma Token:", gammaAddress);
  console.log("\nPools:");
  console.log("- Alpha-Beta Pool:", poolABAddress);
  console.log("- Beta-Gamma Pool:", poolBGAddress);
  console.log("- Gamma-Alpha Pool:", poolGAAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 