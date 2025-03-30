const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pool_AB", function () {
  let Pool_AB;
  let pool;
  let owner;
  let addr1;
  let addr2;
  let alphaToken;
  let betaToken;
  const INITIAL_LIQUIDITY = ethers.parseEther("1000"); // 1000 tokens

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2] = await ethers.getSigners();

    // 部署测试代币
    const NewToken = await ethers.getContractFactory("NewToken");
    alphaToken = await NewToken.deploy("Alpha Token", "ALPHA", "https://example.com/alpha");
    betaToken = await NewToken.deploy("Beta Token", "BETA", "https://example.com/beta");
    await alphaToken.waitForDeployment();
    await betaToken.waitForDeployment();

    // 部署池合约
    Pool_AB = await ethers.getContractFactory("Pool_AB");
    pool = await Pool_AB.deploy(await alphaToken.getAddress(), await betaToken.getAddress());
    await pool.waitForDeployment();

    // 铸造测试代币
    await alphaToken.mint(owner.address, ethers.parseEther("10000"));
    await betaToken.mint(owner.address, ethers.parseEther("10000"));

    // 授权池合约使用代币
    await alphaToken.approve(await pool.getAddress(), ethers.parseEther("10000"));
    await betaToken.approve(await pool.getAddress(), ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set correct token addresses", async function () {
      expect(await pool.alpha()).to.equal(await alphaToken.getAddress());
      expect(await pool.beta()).to.equal(await betaToken.getAddress());
    });

    it("Should not be initialized initially", async function () {
      expect(await pool.isInitialized()).to.be.false;
    });

    it("Should create LP token with correct name and symbol", async function () {
      const lpToken = await pool.lpToken();
      const lpTokenContract = await ethers.getContractAt("LPToken", lpToken);
      expect(await lpTokenContract.name()).to.equal("LP Token");
      expect(await lpTokenContract.symbol()).to.equal("LP");
    });
  });

  describe("Initialization", function () {
    it("Should initialize with correct liquidity", async function () {
      await pool.initialize(INITIAL_LIQUIDITY);
      expect(await pool.isInitialized()).to.be.true;
      
      const [reserveAlpha, reserveBeta] = await pool.getReserves();
      expect(reserveAlpha).to.equal(INITIAL_LIQUIDITY);
      expect(reserveBeta).to.equal(INITIAL_LIQUIDITY);
    });

    it("Should emit PoolInitialized event", async function () {
      await expect(pool.initialize(INITIAL_LIQUIDITY))
        .to.emit(pool, "PoolInitialized")
        .withArgs(
          await alphaToken.getAddress(),
          await betaToken.getAddress(),
          INITIAL_LIQUIDITY,
          INITIAL_LIQUIDITY
        );
    });

    it("Should not allow initialization with zero amount", async function () {
      await expect(pool.initialize(0))
        .to.be.revertedWith("Zero amount");
    });

    it("Should not allow double initialization", async function () {
      await pool.initialize(INITIAL_LIQUIDITY);
      await expect(pool.initialize(INITIAL_LIQUIDITY))
        .to.be.revertedWith("Pool already initialized");
    });

    it("Should mint correct amount of LP tokens on initialization", async function () {
      const lpToken = await pool.lpToken();
      const lpTokenContract = await ethers.getContractAt("LPToken", lpToken);
      
      await pool.initialize(INITIAL_LIQUIDITY);
      
      expect(await lpTokenContract.balanceOf(owner.address)).to.equal(INITIAL_LIQUIDITY);
    });
  });

  describe("Adding Liquidity", function () {
    beforeEach(async function () {
      await pool.initialize(INITIAL_LIQUIDITY);
      
      // 给 addr1 一些代币并授权
      await alphaToken.transfer(addr1.address, ethers.parseEther("1000"));
      await betaToken.transfer(addr1.address, ethers.parseEther("1000"));
      await alphaToken.connect(addr1).approve(await pool.getAddress(), ethers.parseEther("1000"));
      await betaToken.connect(addr1).approve(await pool.getAddress(), ethers.parseEther("1000"));
    });

    it("Should add liquidity correctly", async function () {
      const amountAlpha = ethers.parseEther("100");
      const amountBeta = await pool.getRequiredAmountBeta(amountAlpha);
      
      await expect(pool.connect(addr1).addLiquidity(amountAlpha))
        .to.emit(pool, "LiquidityAdded")
        .withArgs(addr1.address, amountAlpha, amountBeta, amountAlpha);
      
      const [reserveAlpha, reserveBeta] = await pool.getReserves();
      expect(reserveAlpha).to.equal(INITIAL_LIQUIDITY + amountAlpha);
      expect(reserveBeta).to.equal(INITIAL_LIQUIDITY + amountBeta);
    });

    it("Should not allow adding zero liquidity", async function () {
      await expect(pool.connect(addr1).addLiquidity(0))
        .to.be.revertedWith("Zero amount");
    });

    it("Should not allow adding liquidity before initialization", async function () {
      const newPool = await Pool_AB.deploy(await alphaToken.getAddress(), await betaToken.getAddress());
      await newPool.waitForDeployment();
      
      await expect(newPool.connect(addr1).addLiquidity(ethers.parseEther("100")))
        .to.be.revertedWith("Pool not initialized");
    });

    it("Should calculate LP tokens correctly for first liquidity addition", async function () {
      const amountAlpha = ethers.parseEther("100");
      const lpToken = await pool.lpToken();
      const lpTokenContract = await ethers.getContractAt("LPToken", lpToken);
      
      await pool.connect(addr1).addLiquidity(amountAlpha);
      
      // 第一次添加流动性时，LP代币数量等于amountAlpha
      expect(await lpTokenContract.balanceOf(addr1.address)).to.equal(amountAlpha);
    });

    it("Should calculate LP tokens correctly for subsequent liquidity additions", async function () {
      const amountAlpha = ethers.parseEther("100");
      const lpToken = await pool.lpToken();
      const lpTokenContract = await ethers.getContractAt("LPToken", lpToken);
      
      // 给 addr2 一些代币并授权
      await alphaToken.transfer(addr2.address, ethers.parseEther("1000"));
      await betaToken.transfer(addr2.address, ethers.parseEther("1000"));
      await alphaToken.connect(addr2).approve(await pool.getAddress(), ethers.parseEther("1000"));
      await betaToken.connect(addr2).approve(await pool.getAddress(), ethers.parseEther("1000"));
      
      // 第一次添加流动性
      await pool.connect(addr1).addLiquidity(amountAlpha);
      const firstLPAmount = await lpTokenContract.balanceOf(addr1.address);
      
      // 第二次添加流动性
      await pool.connect(addr2).addLiquidity(amountAlpha);
      const secondLPAmount = await lpTokenContract.balanceOf(addr2.address);
      
      expect(secondLPAmount).to.be.lt(firstLPAmount); // 第二次添加获得的LP代币应该更少
    });
  });

  describe("Removing Liquidity", function () {
    beforeEach(async function () {
      await pool.initialize(INITIAL_LIQUIDITY);
      
      // 给 addr1 一些代币并授权
      await alphaToken.transfer(addr1.address, ethers.parseEther("1000"));
      await betaToken.transfer(addr1.address, ethers.parseEther("1000"));
      await alphaToken.connect(addr1).approve(await pool.getAddress(), ethers.parseEther("1000"));
      await betaToken.connect(addr1).approve(await pool.getAddress(), ethers.parseEther("1000"));
      
      // 添加一些流动性
      await pool.connect(addr1).addLiquidity(ethers.parseEther("100"));
    });

    it("Should remove liquidity correctly", async function () {
      const lpToken = await pool.lpToken();
      const lpTokenContract = await ethers.getContractAt("LPToken", lpToken);
      const lpBalance = await lpTokenContract.balanceOf(addr1.address);
      const totalSupply = await lpTokenContract.totalSupply();
      const [reserveAlpha, reserveBeta] = await pool.getReserves();
      const expectedAmountAlpha = (lpBalance * reserveAlpha) / totalSupply;
      const expectedAmountBeta = (lpBalance * reserveBeta) / totalSupply;
      
      await expect(pool.connect(addr1).removeLiquidity(lpBalance))
        .to.emit(pool, "LiquidityRemoved")
        .withArgs(addr1.address, expectedAmountAlpha, expectedAmountBeta, lpBalance);
      
      expect(await lpTokenContract.balanceOf(addr1.address)).to.equal(0n);
    });

    it("Should not allow removing zero liquidity", async function () {
      await expect(pool.connect(addr1).removeLiquidity(0))
        .to.be.revertedWith("Zero amount");
    });

    it("Should not allow removing more than balance", async function () {
      const lpToken = await pool.lpToken();
      const lpTokenContract = await ethers.getContractAt("LPToken", lpToken);
      const lpBalance = await lpTokenContract.balanceOf(addr1.address);
      await expect(pool.connect(addr1).removeLiquidity(lpBalance + 1n))
        .to.be.revertedWith("Insufficient LP balance");
    });

    it("Should return correct token amounts when removing liquidity", async function () {
      const lpToken = await pool.lpToken();
      const lpTokenContract = await ethers.getContractAt("LPToken", lpToken);
      const lpBalance = await lpTokenContract.balanceOf(addr1.address);
      
      const [amountAlpha, amountBeta] = await pool.connect(addr1).removeLiquidity(lpBalance);
      
      expect(amountAlpha).to.be.gt(0n);
      expect(amountBeta).to.be.gt(0n);
      expect(await alphaToken.balanceOf(addr1.address)).to.be.gt(0n);
      expect(await betaToken.balanceOf(addr1.address)).to.be.gt(0n);
    });
  });

  describe("Swapping", function () {
    beforeEach(async function () {
      await pool.initialize(INITIAL_LIQUIDITY);
      
      // 给 addr1 一些代币并授权
      await alphaToken.transfer(addr1.address, ethers.parseEther("1000"));
      await betaToken.transfer(addr1.address, ethers.parseEther("1000"));
      await alphaToken.connect(addr1).approve(await pool.getAddress(), ethers.parseEther("1000"));
      await betaToken.connect(addr1).approve(await pool.getAddress(), ethers.parseEther("1000"));
    });

    it("Should swap tokens correctly", async function () {
      const amountIn = ethers.parseEther("100");
      const [reserveAlpha, reserveBeta] = await pool.getReserves();
      
      await expect(pool.connect(addr1).swap(
        await alphaToken.getAddress(),
        amountIn,
        await betaToken.getAddress()
      )).to.emit(pool, "Swap")
        .withArgs(
          addr1.address,
          await alphaToken.getAddress(),
          await betaToken.getAddress(),
          amountIn,
          (amountIn * reserveBeta) / (reserveAlpha + amountIn)
        );
    });

    it("Should not allow swapping same tokens", async function () {
      await expect(pool.connect(addr1).swap(
        await alphaToken.getAddress(),
        100,
        await alphaToken.getAddress()
      )).to.be.revertedWith("Same tokens");
    });

    it("Should not allow swapping invalid token pair", async function () {
      const NewToken = await ethers.getContractFactory("NewToken");
      const otherToken = await NewToken.deploy("Other Token", "OTHER", "https://example.com/other");
      await otherToken.waitForDeployment();
      
      await expect(pool.connect(addr1).swap(
        await otherToken.getAddress(),
        100,
        await alphaToken.getAddress()
      )).to.be.revertedWith("Invalid token pair");
    });

    it("Should not allow swapping zero amount", async function () {
      await expect(pool.connect(addr1).swap(
        await alphaToken.getAddress(),
        0,
        await betaToken.getAddress()
      )).to.be.revertedWith("Zero input amount");
    });

    it("Should maintain constant product after swap", async function () {
      const [initialReserveAlpha, initialReserveBeta] = await pool.getReserves();
      const initialProduct = initialReserveAlpha * initialReserveBeta;
      
      const amountIn = ethers.parseEther("100");
      await pool.connect(addr1).swap(
        await alphaToken.getAddress(),
        amountIn,
        await betaToken.getAddress()
      );
      
      const [finalReserveAlpha, finalReserveBeta] = await pool.getReserves();
      const finalProduct = finalReserveAlpha * finalReserveBeta;
      
      expect(finalProduct).to.be.gt(initialProduct); // 由于滑点，最终乘积应该更大
    });

    it("Should handle large swaps correctly", async function () {
      // 给 addr1 更多代币并授权
      await alphaToken.transfer(addr1.address, ethers.parseEther("5000"));
      await alphaToken.connect(addr1).approve(await pool.getAddress(), ethers.parseEther("5000"));
      
      const largeAmount = ethers.parseEther("5000"); // 50% of reserves
      const [reserveAlpha, reserveBeta] = await pool.getReserves();
      
      await pool.connect(addr1).swap(
        await alphaToken.getAddress(),
        largeAmount,
        await betaToken.getAddress()
      );
      
      const [newReserveAlpha, newReserveBeta] = await pool.getReserves();
      expect(newReserveAlpha).to.be.gt(reserveAlpha);
      expect(newReserveBeta).to.be.lt(reserveBeta);
    });
  });

  describe("Price Calculation", function () {
    beforeEach(async function () {
      await pool.initialize(INITIAL_LIQUIDITY);
    });

    it("Should calculate required amountBeta correctly", async function () {
      const amountAlpha = ethers.parseEther("100");
      const requiredAmountBeta = await pool.getRequiredAmountBeta(amountAlpha);
      expect(requiredAmountBeta).to.equal(amountAlpha); // 1:1 ratio for initialization
    });

    it("Should calculate required amountBeta after swaps", async function () {
      // 添加一些流动性
      await pool.addLiquidity(ethers.parseEther("100"));
      
      // 执行一些交换
      await alphaToken.approve(await pool.getAddress(), ethers.parseEther("1000"));
      await pool.swap(
        await alphaToken.getAddress(),
        ethers.parseEther("100"),
        await betaToken.getAddress()
      );
      
      const amountAlpha = ethers.parseEther("50");
      const requiredAmountBeta = await pool.getRequiredAmountBeta(amountAlpha);
      expect(requiredAmountBeta).to.be.gt(0n);
    });

    it("Should revert when calculating required amountBeta for empty pool", async function () {
      const newPool = await Pool_AB.deploy(await alphaToken.getAddress(), await betaToken.getAddress());
      await newPool.waitForDeployment();
      
      await expect(newPool.getRequiredAmountBeta(ethers.parseEther("100")))
        .to.be.revertedWith("Pool is empty");
    });
  });
}); 