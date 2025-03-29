const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // 读取合约地址
  const contractAddressesPath = path.join(__dirname, '../../frontend/src/contract-addresses.json');
  const contractAddresses = JSON.parse(fs.readFileSync(contractAddressesPath, 'utf8'));
  
  // 用户2的地址
  const user2Address = "0x3527fEFc412c4982bFBf67f7b5debb40B464B9FD";
  
  // 获取签名者
  const [deployer] = await hre.ethers.getSigners();
  console.log("使用部署者账户:", deployer.address);
  
  // 给用户2转账以太币
  console.log(`向用户2 (${user2Address}) 转账以太币...`);
  const ethAmount = hre.ethers.parseEther("10");
  const txETH = await deployer.sendTransaction({
    to: user2Address,
    value: ethAmount
  });
  await txETH.wait();
  console.log(`成功转账 10 ETH 给用户2，交易哈希: ${txETH.hash}`);
  
  // 连接代币合约
  const tokenAbi = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)"
  ];
  
  const token0 = new hre.ethers.Contract(
    contractAddresses.token0 || contractAddresses.Token0, 
    tokenAbi, 
    deployer
  );
  
  const token1 = new hre.ethers.Contract(
    contractAddresses.token1 || contractAddresses.Token1, 
    tokenAbi, 
    deployer
  );
  
  // 获取代币符号
  const token0Symbol = await token0.symbol();
  const token1Symbol = await token1.symbol();
  
  // 转账Token0给用户2
  console.log(`向用户2转账 ${token0Symbol}...`);
  const token0Amount = hre.ethers.parseEther("100");
  const txToken0 = await token0.transfer(user2Address, token0Amount);
  await txToken0.wait();
  console.log(`成功转账 100 ${token0Symbol} 给用户2，交易哈希: ${txToken0.hash}`);
  
  // 转账Token1给用户2
  console.log(`向用户2转账 ${token1Symbol}...`);
  const token1Amount = hre.ethers.parseEther("100");
  const txToken1 = await token1.transfer(user2Address, token1Amount);
  await txToken1.wait();
  console.log(`成功转账 100 ${token1Symbol} 给用户2，交易哈希: ${txToken1.hash}`);
  
  // 打印用户2余额
  const ethBalance = hre.ethers.formatEther(await deployer.provider.getBalance(user2Address));
  const token0Balance = hre.ethers.formatEther(await token0.balanceOf(user2Address));
  const token1Balance = hre.ethers.formatEther(await token1.balanceOf(user2Address));
  
  console.log("\n用户2余额:");
  console.log(`ETH: ${ethBalance}`);
  console.log(`${token0Symbol}: ${token0Balance}`);
  console.log(`${token1Symbol}: ${token1Balance}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 