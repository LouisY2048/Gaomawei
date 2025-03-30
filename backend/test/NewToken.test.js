const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NewToken", function () {
  let NewToken;
  let newToken;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;
  const MIN_BALANCE = ethers.parseEther("1"); // 1 token minimum balance

  beforeEach(async function () {
    // 获取测试账户
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // 部署合约
    NewToken = await ethers.getContractFactory("NewToken");
    newToken = await NewToken.deploy("Test Token", "TEST", "https://example.com/token.json");
    await newToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await newToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await newToken.balanceOf(owner.address);
      expect(await newToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should set correct token name and symbol", async function () {
      expect(await newToken.name()).to.equal("Test Token");
      expect(await newToken.symbol()).to.equal("TEST");
    });

    it("Should set correct initial token URI", async function () {
      expect(await newToken.tokenURI()).to.equal("https://example.com/token.json");
    });

    it("Should initialize with correct transfer restrictions", async function () {
      expect(await newToken.transferRestricted()).to.be.true;
      expect(await newToken.maxTransferAmount()).to.be.gt(0);
      expect(await newToken.MIN_BALANCE()).to.equal(MIN_BALANCE);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // 铸造一些代币给 addr1
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      expect(await newToken.balanceOf(addr1.address)).to.equal(amount);

      // 从 addr1 转账到 addr2
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE);
      expect(await newToken.balanceOf(addr2.address)).to.equal(MIN_BALANCE);
      expect(await newToken.balanceOf(addr1.address)).to.equal(MIN_BALANCE);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await newToken.balanceOf(owner.address);
      await expect(
        newToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Insufficient balance");
      expect(await newToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await newToken.balanceOf(owner.address);
      const amount = MIN_BALANCE * 2n;

      // 铸造代币给 addr1
      await newToken.mint(addr1.address, amount);
      expect(await newToken.balanceOf(addr1.address)).to.equal(amount);

      // 铸造代币给 addr2
      await newToken.mint(addr2.address, amount);
      expect(await newToken.balanceOf(addr2.address)).to.equal(amount);

      const finalOwnerBalance = await newToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance);
    });

    it("Should allow multiple transfers in sequence", async function () {
      const amount = MIN_BALANCE * 5n;
      await newToken.mint(addr1.address, amount);
      
      // First transfer
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE * 2n);
      expect(await newToken.balanceOf(addr2.address)).to.equal(MIN_BALANCE * 2n);
      
      // Second transfer
      await newToken.connect(addr2).transfer(addr3.address, MIN_BALANCE);
      expect(await newToken.balanceOf(addr3.address)).to.equal(MIN_BALANCE);
      
      // Check final balances
      expect(await newToken.balanceOf(addr1.address)).to.equal(MIN_BALANCE * 3n);
      expect(await newToken.balanceOf(addr2.address)).to.equal(MIN_BALANCE);
    });

    it("Should handle zero address transfers correctly", async function () {
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      
      await expect(
        newToken.connect(addr1).transfer(ethers.ZeroAddress, MIN_BALANCE)
      ).to.be.revertedWithCustomError(newToken, "ERC20InvalidReceiver")
        .withArgs(ethers.ZeroAddress);
    });

    it("Should prevent self-transfers", async function () {
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      
      await expect(
        newToken.connect(addr1).transfer(addr1.address, MIN_BALANCE)
      ).to.be.revertedWith("Self transfers not allowed");
    });
  });

  describe("Pausing", function () {
    it("Should pause and unpause the contract", async function () {
      await newToken.pause();
      expect(await newToken.paused()).to.be.true;

      await newToken.unpause();
      expect(await newToken.paused()).to.be.false;
    });

    it("Should not allow transfers when paused", async function () {
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      await newToken.pause();

      await expect(
        newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE)
      ).to.be.revertedWith("Token transfer while paused");
    });

    it("Should not allow minting when paused", async function () {
      await newToken.pause();
      await expect(
        newToken.mint(addr1.address, MIN_BALANCE)
      ).to.be.revertedWith("Token transfer while paused");
    });

    it("Should not allow burning when paused", async function () {
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      await newToken.pause();
      
      await expect(
        newToken.connect(addr1).burn(MIN_BALANCE)
      ).to.be.revertedWith("Token transfer while paused");
    });

    it("Should allow transfers after unpausing", async function () {
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      await newToken.pause();
      await newToken.unpause();
      
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE);
      expect(await newToken.balanceOf(addr2.address)).to.equal(MIN_BALANCE);
    });

    it("Should not allow non-owner to unpause", async function () {
      await newToken.pause();
      await expect(
        newToken.connect(addr1).unpause()
      ).to.be.revertedWithCustomError(newToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Supply Management", function () {
    it("Should track total supply correctly after mint and burn", async function () {
      const initialSupply = await newToken.totalSupply();
      const mintAmount = MIN_BALANCE * 2n;
      
      // Mint tokens
      await newToken.mint(addr1.address, mintAmount);
      expect(await newToken.totalSupply()).to.equal(initialSupply + mintAmount);
      
      // Burn tokens
      await newToken.connect(addr1).burn(MIN_BALANCE);
      expect(await newToken.totalSupply()).to.equal(initialSupply + mintAmount - MIN_BALANCE);
    });

    it("Should not allow burning more than balance", async function () {
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      
      await expect(
        newToken.connect(addr1).burn(amount + 1n)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should not allow burning below minimum balance", async function () {
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      
      // Try to burn tokens that would leave balance below minimum
      await expect(
        newToken.connect(addr1).burn(MIN_BALANCE + 1n)
      ).to.be.revertedWith("Balance would fall below minimum");
    });
  });

  describe("Transfer Restrictions", function () {
    it("Should enforce max transfer amount", async function () {
      const amount = MIN_BALANCE * 10n;
      await newToken.mint(addr1.address, amount);
      await newToken.setMaxTransferAmount(MIN_BALANCE * 2n);

      await expect(
        newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE * 3n)
      ).to.be.revertedWith("Exceeds max transfer amount");
    });

    it("Should enforce minimum balance for new recipients", async function () {
      // 铸造一些代币给 addr1
      const amount = MIN_BALANCE * 3n;
      await newToken.mint(addr1.address, amount);

      // 尝试向新用户转账小于最小余额的数量
      await expect(
        newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE / 2n)
      ).to.be.revertedWith("Transfer amount too low for new recipient");

      // 可以向新用户转账等于最小余额的数量
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE);
      expect(await newToken.balanceOf(addr2.address)).to.equal(MIN_BALANCE);
    });

    it("Should enforce minimum balance for existing recipients", async function () {
      // 给 addr1 和 addr2 铸造代币
      await newToken.mint(addr1.address, MIN_BALANCE * 3n);
      await newToken.mint(addr2.address, MIN_BALANCE / 2n); // 给 addr2 一个小于最小余额的数量

      // 尝试向余额小于最小要求的地址转账
      await expect(
        newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE)
      ).to.be.revertedWith("Recipient balance too low");

      // 先给 addr2 足够的代币使其达到最小余额要求
      await newToken.mint(addr2.address, MIN_BALANCE);
      
      // 现在可以向 addr2 转账了
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE);
      expect(await newToken.balanceOf(addr2.address)).to.equal(MIN_BALANCE * 2n + MIN_BALANCE / 2n);
    });

    it("Should enforce max transfer amount for multiple transfers", async function () {
      const amount = MIN_BALANCE * 10n;
      const maxAmount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      await newToken.setMaxTransferAmount(maxAmount);
      
      // First transfer at max amount
      await newToken.connect(addr1).transfer(addr2.address, maxAmount);
      expect(await newToken.balanceOf(addr2.address)).to.equal(maxAmount);
      
      // Second transfer at max amount
      await newToken.connect(addr1).transfer(addr3.address, maxAmount);
      expect(await newToken.balanceOf(addr3.address)).to.equal(maxAmount);
      
      // Try to transfer more than max amount
      await expect(
        newToken.connect(addr1).transfer(addr2.address, maxAmount + 1n)
      ).to.be.revertedWith("Exceeds max transfer amount");
    });

    it("Should handle minimum balance edge cases", async function () {
      await newToken.mint(addr1.address, MIN_BALANCE * 5n);
      await newToken.mint(addr2.address, MIN_BALANCE);
      
      // Try to transfer that would leave sender at exactly minimum balance
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE * 4n);
      expect(await newToken.balanceOf(addr1.address)).to.equal(MIN_BALANCE);
      
      // Try to transfer that would leave sender below minimum balance
      await expect(
        newToken.connect(addr1).transfer(addr2.address, 1n)
      ).to.be.revertedWith("Balance would fall below minimum");
    });
  });

  describe("Token Metadata", function () {
    it("Should set and get token URI", async function () {
      const newURI = "https://new-example.com/token.json";
      await newToken.setTokenURI(newURI);
      expect(await newToken.tokenURI()).to.equal(newURI);
    });

    it("Should emit TokenURISet event", async function () {
      const newURI = "https://new-example.com/token.json";
      await expect(newToken.setTokenURI(newURI))
        .to.emit(newToken, "TokenURISet")
        .withArgs(newURI);
    });

    it("Should not allow empty token URI", async function () {
      await expect(
        newToken.setTokenURI("")
      ).to.be.revertedWith("URI cannot be empty");
    });

    it("Should maintain token URI after transfers", async function () {
      const newURI = "https://new-example.com/token.json";
      await newToken.setTokenURI(newURI);
      
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE);
      
      expect(await newToken.tokenURI()).to.equal(newURI);
    });
  });

  describe("Supply Limits", function () {
    it("Should not exceed max supply", async function () {
      const maxSupply = await newToken.MAX_SUPPLY();
      const currentSupply = await newToken.totalSupply();
      const remainingSupply = maxSupply - currentSupply;
      
      // 尝试铸造超过剩余供应量的代币
      await expect(
        newToken.mint(addr1.address, remainingSupply + 1n)
      ).to.be.revertedWith("Exceeds max supply");

      // 可以铸造等于剩余供应量的代币
      await newToken.mint(addr1.address, remainingSupply);
      expect(await newToken.totalSupply()).to.equal(maxSupply);
    });
  });

  describe("Transfer Restrictions", function () {
    it("Should toggle transfer restrictions", async function () {
      const amount = MIN_BALANCE * 10n;
      await newToken.mint(addr1.address, amount);
      
      // 设置最大转账金额
      const maxTransferAmount = MIN_BALANCE * 2n;
      await newToken.setMaxTransferAmount(maxTransferAmount);
      
      // 关闭转账限制
      await newToken.setTransferRestriction(false);
      expect(await newToken.transferRestricted()).to.be.false;
      
      // 现在可以转账超过最大限制的金额
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE * 3n);
      
      // 重新开启转账限制
      await newToken.setTransferRestriction(true);
      expect(await newToken.transferRestricted()).to.be.true;
      
      // 现在不能转账超过最大限制的金额
      await expect(
        newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE * 3n)
      ).to.be.revertedWith("Exceeds max transfer amount");
    });

    it("Should update max transfer amount", async function () {
      const newMaxAmount = MIN_BALANCE * 5n;
      const initialMaxAmount = await newToken.maxTransferAmount();
      await expect(newToken.setMaxTransferAmount(newMaxAmount))
        .to.emit(newToken, "MaxTransferAmountUpdated")
        .withArgs(initialMaxAmount, newMaxAmount);
      
      expect(await newToken.maxTransferAmount()).to.equal(newMaxAmount);
    });

    it("Should not set max transfer amount to zero", async function () {
      await expect(
        newToken.setMaxTransferAmount(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });
  });

  describe("Events", function () {
    it("Should emit TokenMinted event", async function () {
      const amount = MIN_BALANCE * 2n;
      await expect(newToken.mint(addr1.address, amount))
        .to.emit(newToken, "TokenMinted")
        .withArgs(addr1.address, amount);
    });

    it("Should emit TokenBurned event", async function () {
      const amount = MIN_BALANCE * 3n;
      await newToken.mint(addr1.address, amount);
      await expect(newToken.connect(addr1).burn(MIN_BALANCE))
        .to.emit(newToken, "TokenBurned")
        .withArgs(addr1.address, MIN_BALANCE);
    });

    it("Should emit TransferRestrictionUpdated event", async function () {
      await expect(newToken.setTransferRestriction(false))
        .to.emit(newToken, "TransferRestrictionUpdated")
        .withArgs(true, false);
    });

    it("Should emit Transfer events for mint and burn", async function () {
      const amount = MIN_BALANCE * 3n;
      
      // Check mint Transfer event
      await expect(newToken.mint(addr1.address, amount))
        .to.emit(newToken, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, amount);
      
      // Check burn Transfer event
      await expect(newToken.connect(addr1).burn(MIN_BALANCE))
        .to.emit(newToken, "Transfer")
        .withArgs(addr1.address, ethers.ZeroAddress, MIN_BALANCE);
    });

    it("Should emit multiple events for state-changing operations", async function () {
      const amount = MIN_BALANCE * 2n;
      const newMaxAmount = MIN_BALANCE * 3n;
      
      // Setting max transfer amount should emit event
      await expect(newToken.setMaxTransferAmount(newMaxAmount))
        .to.emit(newToken, "MaxTransferAmountUpdated")
        .withArgs(await newToken.maxTransferAmount(), newMaxAmount);
      
      // Minting should emit both Transfer and TokenMinted events
      await expect(newToken.mint(addr1.address, amount))
        .to.emit(newToken, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, amount)
        .and.to.emit(newToken, "TokenMinted")
        .withArgs(addr1.address, amount);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to mint", async function () {
      await expect(
        newToken.connect(addr1).mint(addr2.address, MIN_BALANCE)
      ).to.be.revertedWithCustomError(newToken, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to pause", async function () {
      await expect(
        newToken.connect(addr1).pause()
      ).to.be.revertedWithCustomError(newToken, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to set max transfer amount", async function () {
      await expect(
        newToken.connect(addr1).setMaxTransferAmount(MIN_BALANCE * 2n)
      ).to.be.revertedWithCustomError(newToken, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to set transfer restriction", async function () {
      await expect(
        newToken.connect(addr1).setTransferRestriction(false)
      ).to.be.revertedWithCustomError(newToken, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to set token URI", async function () {
      await expect(
        newToken.connect(addr1).setTokenURI("https://example.com/new.json")
      ).to.be.revertedWithCustomError(newToken, "OwnableUnauthorizedAccount");
    });

    it("Should maintain ownership after transfers", async function () {
      const amount = MIN_BALANCE * 2n;
      await newToken.mint(addr1.address, amount);
      await newToken.connect(addr1).transfer(addr2.address, MIN_BALANCE);
      
      expect(await newToken.owner()).to.equal(owner.address);
    });

    it("Should allow owner to execute multiple privileged operations", async function () {
      // Owner can pause
      await newToken.pause();
      expect(await newToken.paused()).to.be.true;
      
      // Owner can set max transfer amount
      const newMaxAmount = MIN_BALANCE * 5n;
      await newToken.setMaxTransferAmount(newMaxAmount);
      expect(await newToken.maxTransferAmount()).to.equal(newMaxAmount);
      
      // Owner can set token URI
      const newURI = "https://new-example.com/token.json";
      await newToken.setTokenURI(newURI);
      expect(await newToken.tokenURI()).to.equal(newURI);
      
      // Owner can unpause
      await newToken.unpause();
      expect(await newToken.paused()).to.be.false;
    });
  });
}); 