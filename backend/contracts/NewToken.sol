// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NewToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    // 代币元数据
    string private _tokenURI;
    uint256 public constant MAX_SUPPLY = 1000000 * 10**18; // 最大供应量
    uint256 public constant MIN_BALANCE = 1 * 10**18; // 最小余额要求
    
    // 转账限制
    uint256 public maxTransferAmount;
    bool public transferRestricted;
    
    // 事件定义
    event TokenMinted(address indexed to, uint256 amount);
    event TokenBurned(address indexed from, uint256 amount);
    event MaxTransferAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event TransferRestrictionUpdated(bool oldStatus, bool newStatus);
    event TokenURISet(string newTokenURI);

    constructor(
        string memory name,
        string memory symbol,
        string memory tokenURI
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _tokenURI = tokenURI;
        maxTransferAmount = MAX_SUPPLY / 100; // 默认最大转账额为总供应量的1%
        transferRestricted = true; // 默认开启转账限制
    }

    /**
     * @dev 铸造代币
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) 
        public 
        onlyOwner 
        whenNotPaused 
        nonReentrant 
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
        emit TokenMinted(to, amount);
    }

    /**
     * @dev 销毁代币
     * @param amount 销毁数量
     */
    function burn(uint256 amount) 
        public 
        whenNotPaused 
        nonReentrant 
    {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be greater than 0");
        
        _burn(msg.sender, amount);
        emit TokenBurned(msg.sender, amount);
    }

    /**
     * @dev 设置最大转账金额
     * @param newAmount 新的最大转账金额
     */
    function setMaxTransferAmount(uint256 newAmount) 
        public 
        onlyOwner 
        whenNotPaused 
    {
        require(newAmount > 0, "Amount must be greater than 0");
        uint256 oldAmount = maxTransferAmount;
        maxTransferAmount = newAmount;
        emit MaxTransferAmountUpdated(oldAmount, newAmount);
    }

    /**
     * @dev 更新转账限制状态
     * @param newStatus 新的限制状态
     */
    function setTransferRestriction(bool newStatus) 
        public 
        onlyOwner 
        whenNotPaused 
    {
        bool oldStatus = transferRestricted;
        transferRestricted = newStatus;
        emit TransferRestrictionUpdated(oldStatus, newStatus);
    }

    /**
     * @dev 设置代币URI
     * @param newTokenURI 新的URI
     */
    function setTokenURI(string memory newTokenURI) 
        public 
        onlyOwner 
        whenNotPaused 
    {
        _tokenURI = newTokenURI;
        emit TokenURISet(newTokenURI);
    }

    /**
     * @dev 暂停合约
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复合约
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev 重写转账函数，添加限制
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {
        require(from != address(0), "Invalid sender");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        
        if (transferRestricted) {
            require(amount <= maxTransferAmount, "Exceeds max transfer amount");
        }
        
        require(balanceOf(from) >= amount, "Insufficient balance");
        require(balanceOf(to) + amount >= MIN_BALANCE, "Recipient balance too low");
        
        super._transfer(from, to, amount);
    }

    /**
     * @dev 获取代币URI
     */
    function tokenURI() public view returns (string memory) {
        return _tokenURI;
    }
}