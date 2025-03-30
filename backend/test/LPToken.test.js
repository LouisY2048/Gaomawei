const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LPToken", function () {
  let LPToken;
  let lpToken;
  let owner;
  let addr1;
  let addr2;
  let pool;
  const MIN_TRANSFER_AMOUNT = 1n;
  const INITIAL_AMOUNT = ethers.parseEther("1000"); // 1000 tokens

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2, pool] = await ethers.getSigners();

    // 部署合约
    LPToken = await ethers.getContractFactory("LPToken");
    lpToken = await LPToken.deploy();
    await lpToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lpToken.owner()).to.equal(owner.address);
    });

    it("Should set correct token name and symbol", async function () {
      expect(await lpToken.name()).to.equal("LP Token");
      expect(await lpToken.symbol()).to.equal("LP");
    });

    it("Should initialize with correct minimum transfer amount", async function () {
      expect(await lpToken.minTransferAmount()).to.equal(MIN_TRANSFER_AMOUNT);
    });

    it("Should not be initialized initially", async function () {
      expect(await lpToken.initialized()).to.be.false;
    });
  });

  describe("Initialization", function () {
    it("Should initialize with pool address", async function () {
      await lpToken.initialize(pool.address);
      expect(await lpToken.initialized()).to.be.true;
      expect(await lpToken.pool()).to.equal(pool.address);
    });

    it("Should emit PoolSet event on initialization", async function () {
      await expect(lpToken.initialize(pool.address))
        .to.emit(lpToken, "PoolSet")
        .withArgs(pool.address);
    });

    it("Should not allow initialization with zero address", async function () {
      await expect(lpToken.initialize(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(lpToken, "ZeroAddress");
    });

    it("Should not allow double initialization", async function () {
      await lpToken.initialize(pool.address);
      await expect(lpToken.initialize(pool.address))
        .to.be.revertedWithCustomError(lpToken, "AlreadyInitialized");
    });

    it("Should not allow non-owner to initialize", async function () {
      await expect(
        lpToken.connect(addr1).initialize(pool.address)
      ).to.be.revertedWithCustomError(lpToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Minting", function () {
    it("Should not allow minting before initialization", async function () {
      await expect(lpToken.connect(pool).mint(owner.address, 100))
        .to.be.revertedWithCustomError(lpToken, "NotInitialized");
    });

    describe("After initialization", function () {
      beforeEach(async function () {
        await lpToken.initialize(pool.address);
      });

      it("Should allow pool to mint tokens", async function () {
        await lpToken.connect(pool).mint(addr1.address, INITIAL_AMOUNT);
        expect(await lpToken.balanceOf(addr1.address)).to.equal(INITIAL_AMOUNT);
      });

      it("Should emit TokenMinted event", async function () {
        await expect(lpToken.connect(pool).mint(addr1.address, INITIAL_AMOUNT))
          .to.emit(lpToken, "TokenMinted")
          .withArgs(addr1.address, INITIAL_AMOUNT);
      });

      it("Should not allow minting to zero address", async function () {
        await expect(
          lpToken.connect(pool).mint(ethers.ZeroAddress, INITIAL_AMOUNT)
        ).to.be.revertedWith("Invalid recipient");
      });

      it("Should not allow zero amount minting", async function () {
        await expect(
          lpToken.connect(pool).mint(addr1.address, 0)
        ).to.be.revertedWith("Zero amount");
      });

      it("Should not allow non-pool to mint", async function () {
        await expect(lpToken.connect(owner).mint(owner.address, 100))
          .to.be.revertedWithCustomError(lpToken, "CallerNotPool");
      });
    });
  });

  describe("Burning", function () {
    it("Should not allow burning before initialization", async function () {
      await expect(lpToken.connect(pool).burn(owner.address, 100))
        .to.be.revertedWithCustomError(lpToken, "NotInitialized");
    });

    describe("After initialization", function () {
      beforeEach(async function () {
        await lpToken.initialize(pool.address);
        await lpToken.connect(pool).mint(addr1.address, INITIAL_AMOUNT);
      });

      it("Should allow pool to burn tokens", async function () {
        await lpToken.connect(pool).burn(addr1.address, INITIAL_AMOUNT / 2n);
        expect(await lpToken.balanceOf(addr1.address)).to.equal(INITIAL_AMOUNT / 2n);
      });

      it("Should emit TokenBurned event", async function () {
        await expect(lpToken.connect(pool).burn(addr1.address, INITIAL_AMOUNT / 2n))
          .to.emit(lpToken, "TokenBurned")
          .withArgs(addr1.address, INITIAL_AMOUNT / 2n);
      });

      it("Should not allow burning from zero address", async function () {
        await expect(
          lpToken.connect(pool).burn(ethers.ZeroAddress, INITIAL_AMOUNT)
        ).to.be.revertedWith("Invalid sender");
      });

      it("Should not allow zero amount burning", async function () {
        await expect(
          lpToken.connect(pool).burn(addr1.address, 0)
        ).to.be.revertedWith("Zero amount");
      });

      it("Should not allow burning more than balance", async function () {
        await expect(
          lpToken.connect(pool).burn(addr1.address, INITIAL_AMOUNT + 1n)
        ).to.be.revertedWith("Insufficient balance");
      });

      it("Should not allow non-pool to burn", async function () {
        await expect(lpToken.connect(owner).burn(owner.address, 100))
          .to.be.revertedWithCustomError(lpToken, "CallerNotPool");
      });
    });
  });

  describe("Pausing", function () {
    it("Should allow owner to pause and unpause", async function () {
      await lpToken.pause();
      expect(await lpToken.paused()).to.be.true;

      await lpToken.unpause();
      expect(await lpToken.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        lpToken.connect(addr1).pause()
      ).to.be.revertedWithCustomError(lpToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow non-owner to unpause", async function () {
      await lpToken.pause();
      await expect(
        lpToken.connect(addr1).unpause()
      ).to.be.revertedWithCustomError(lpToken, "OwnableUnauthorizedAccount");
    });

    it("Should not allow transfers when paused", async function () {
      await lpToken.pause();
      await expect(lpToken.transfer(addr1.address, 100))
        .to.be.revertedWithCustomError(lpToken, "EnforcedPause");
    });

    it("Should allow transfers after unpausing", async function () {
      await lpToken.initialize(pool.address);
      await lpToken.connect(pool).mint(addr1.address, INITIAL_AMOUNT);
      await lpToken.pause();
      await lpToken.unpause();

      await lpToken.connect(addr1).transfer(addr2.address, INITIAL_AMOUNT / 2n);
      expect(await lpToken.balanceOf(addr2.address)).to.equal(INITIAL_AMOUNT / 2n);
    });
  });

  describe("Transfer Restrictions", function () {
    beforeEach(async function () {
      await lpToken.initialize(pool.address);
      await lpToken.connect(pool).mint(addr1.address, INITIAL_AMOUNT);
    });

    it("Should enforce minimum transfer amount", async function () {
      await expect(
        lpToken.connect(addr1).transfer(addr2.address, 0)
      ).to.be.revertedWithCustomError(lpToken, "TransferAmountTooLow");
    });

    it("Should allow transfers above minimum amount", async function () {
      await lpToken.connect(addr1).transfer(addr2.address, MIN_TRANSFER_AMOUNT);
      expect(await lpToken.balanceOf(addr2.address)).to.equal(MIN_TRANSFER_AMOUNT);
    });

    it("Should emit TransferRestricted event for restricted transfers", async function () {
      // Create a filter for the event before attempting the transfer
      const filter = lpToken.filters.TransferRestricted();
      
      // Attempt the transfer and expect it to revert
      await expect(
        lpToken.connect(addr1).transfer(addr2.address, 0)
      ).to.be.revertedWithCustomError(lpToken, "TransferAmountTooLow");
      
      // Get events from the filter
      const events = await lpToken.queryFilter(filter);
      
      // Verify that the event was emitted with the correct data
      expect(events.length).to.equal(1);
      const event = events[0];
      expect(event.args.from).to.equal(addr1.address);
      expect(event.args.to).to.equal(addr2.address);
      expect(event.args.amount).to.equal(0n);
    });

    it("Should emit TransferRestricted event for transferFrom with restricted amount", async function () {
      // Create a filter for the event before attempting the transfer
      const filter = lpToken.filters.TransferRestricted();
      
      // Approve transfer
      await lpToken.connect(addr1).approve(addr2.address, 100);
      
      // Attempt the transferFrom and expect it to revert
      await expect(
        lpToken.connect(addr2).transferFrom(addr1.address, addr2.address, 0)
      ).to.be.revertedWithCustomError(lpToken, "TransferAmountTooLow");
      
      // Get events from the filter
      const events = await lpToken.queryFilter(filter);
      
      // Verify that the event was emitted with the correct data
      expect(events.length).to.equal(1);
      const event = events[0];
      expect(event.args.from).to.equal(addr1.address);
      expect(event.args.to).to.equal(addr2.address);
      expect(event.args.amount).to.equal(0n);
    });
  });

  describe("Security Tests", function () {
    it("Should prevent unauthorized access to pool functions", async function () {
      // Initialize LP token
      await lpToken.initialize(pool.address);

      // Try to mint tokens from non-pool address
      await expect(
        lpToken.connect(addr1).mint(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(lpToken, "CallerNotPool");

      // Try to burn tokens from non-pool address
      await expect(
        lpToken.connect(addr1).burn(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(lpToken, "CallerNotPool");
    });

    it("Should prevent operations before initialization", async function () {
      // Try to mint tokens before initialization
      await expect(
        lpToken.connect(pool).mint(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(lpToken, "NotInitialized");

      // Try to burn tokens before initialization
      await expect(
        lpToken.connect(pool).burn(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(lpToken, "NotInitialized");
    });

    it("Should prevent double initialization", async function () {
      // Initialize LP token
      await lpToken.initialize(pool.address);

      // Try to initialize again
      await expect(
        lpToken.initialize(pool.address)
      ).to.be.revertedWithCustomError(lpToken, "AlreadyInitialized");
    });

    it("Should prevent zero address initialization", async function () {
      // Try to initialize with zero address
      await expect(
        lpToken.initialize(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(lpToken, "ZeroAddress");
    });

    it("Should prevent non-owner from initializing", async function () {
      // Try to initialize from non-owner address
      await expect(
        lpToken.connect(addr1).initialize(pool.address)
      ).to.be.revertedWithCustomError(lpToken, "OwnableUnauthorizedAccount");
    });

    it("Should prevent non-owner from pausing", async function () {
      // Try to pause from non-owner address
      await expect(
        lpToken.connect(addr1).pause()
      ).to.be.revertedWithCustomError(lpToken, "OwnableUnauthorizedAccount");
    });

    it("Should prevent non-owner from unpausing", async function () {
      // Pause the contract
      await lpToken.pause();

      // Try to unpause from non-owner address
      await expect(
        lpToken.connect(addr1).unpause()
      ).to.be.revertedWithCustomError(lpToken, "OwnableUnauthorizedAccount");
    });

    it("Should prevent transfers when paused", async function () {
      // Initialize and mint some tokens
      await lpToken.initialize(pool.address);
      await lpToken.connect(pool).mint(addr1.address, ethers.parseEther("1000"));

      // Pause the contract
      await lpToken.pause();

      // Try to transfer tokens
      await expect(
        lpToken.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(lpToken, "EnforcedPause");
    });

    it("Should prevent transfers below minimum amount", async function () {
      // Initialize and mint some tokens
      await lpToken.initialize(pool.address);
      await lpToken.connect(pool).mint(addr1.address, ethers.parseEther("1000"));

      // Try to transfer less than minimum amount
      await expect(
        lpToken.connect(addr1).transfer(addr2.address, 0)
      ).to.be.revertedWithCustomError(lpToken, "TransferAmountTooLow");
    });

    it("Should prevent transfers to zero address", async function () {
      // Initialize and mint some tokens
      await lpToken.initialize(pool.address);
      await lpToken.connect(pool).mint(addr1.address, ethers.parseEther("1000"));

      // Try to transfer to zero address
      await expect(
        lpToken.connect(addr1).transfer(ethers.ZeroAddress, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(lpToken, "ERC20InvalidReceiver");
    });

    it("Should prevent burning more than balance", async function () {
      // Initialize and mint some tokens
      await lpToken.initialize(pool.address);
      await lpToken.connect(pool).mint(addr1.address, ethers.parseEther("1000"));

      // Try to burn more than balance
      await expect(
        lpToken.connect(pool).burn(addr1.address, ethers.parseEther("2000"))
      ).to.be.revertedWith("Insufficient balance");
    });
  });
}); 