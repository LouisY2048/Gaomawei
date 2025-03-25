const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // 获取签名者
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 部署Alpha代币
  const NewToken = await hre.ethers.getContractFactory("NewToken");
  const token0 = await NewToken.deploy("Alpha", "ALPHA");
  await token0.waitForDeployment();
  console.log("Alpha deployed to:", await token0.getAddress());

  // 部署Beta代币
  const token1 = await NewToken.deploy("Beta", "BETA");
  await token1.waitForDeployment();
  console.log("Beta deployed to:", await token1.getAddress());

  // 部署流动性池
  const Pool = await hre.ethers.getContractFactory("Pool");
  const pool = await Pool.deploy(
    await token0.getAddress(),
    await token1.getAddress()
  );
  await pool.waitForDeployment();
  console.log("Pool deployed to:", await pool.getAddress());

  // 为测试用户提供一些代币
  const alphaAmount = hre.ethers.parseUnits("10000", 18);
  const betaAmount = hre.ethers.parseUnits("20000", 18);
  
  await token0.transfer(deployer.address, alphaAmount);
  await token1.transfer(deployer.address, betaAmount);
  
  console.log("Tokens transferred to deployer");
  
  // 创建utils目录如果它不存在
  const utilsPath = path.join(__dirname, "../../frontend/src/utils");
  if (!fs.existsSync(utilsPath)) {
    fs.mkdirSync(utilsPath, { recursive: true });
  }

  // 将合约地址写入文件，便于前端使用
  const addresses = {
    token0: await token0.getAddress(),
    token1: await token1.getAddress(),
    pool: await pool.getAddress(),
  };

  // 将数据写入文件（如果文件不存在则创建）
  fs.writeFileSync(path.join(utilsPath, "deployed-addresses.json"),
  JSON.stringify(addresses, null, 2), { flag: 'w' }); // 'w' flag确保文件被创建或覆盖
  console.log("\nContract addresses have been written to deployed-addresses.json");

  // 导出ABIs
  const artifacts = {
    NewToken: await hre.artifacts.readArtifact("NewToken"),
    LPToken: await hre.artifacts.readArtifact("LPToken"),
    Pool: await hre.artifacts.readArtifact("Pool")
  };

  const abis = {
    NewToken: artifacts.NewToken.abi,
    LPToken: artifacts.LPToken.abi,
    Pool: artifacts.Pool.abi
  };

  // 将数据写入文件（如果文件不存在则创建）
  fs.writeFileSync(path.join(utilsPath, "contract-abis.json"),
  JSON.stringify(abis, null, 2), { flag: 'w' }); // 'w' flag确保文件被创建或覆盖
  console.log("Contract ABIs have been written to contract-abis.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 