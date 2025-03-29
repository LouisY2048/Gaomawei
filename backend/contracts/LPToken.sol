// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LPToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    // 常量定义
    uint256 public constant MAX_SUPPLY = type(uint256).max;
    uint256 public constant MIN_TRANSFER_AMOUNT = 1; // 最小转账金额
    
    // 状态变量
    bool private _initialized;
    address private _pool;
    
    // 事件定义
    event PoolSet(address indexed oldPool, address indexed newPool);
    event TokenMinted(address indexed to, uint256 amount);
    event TokenBurned(address indexed from, uint256 amount);
    event TransferRestricted(address indexed from, address indexed to, uint256 amount);
    
    constructor() ERC20("LPToken", "LPT") Ownable(msg.sender) {
        _initialized = false;
    }

    /**
     * @dev 初始化LP代币
     * @param pool 流动性池地址
     */
    function initialize(address pool) external onlyOwner {
        require(!_initialized, "Already initialized");
        require(pool != address(0), "Invalid pool address");
        _pool = pool;
        _initialized = true;
    }

    /**
     * @dev 检查是否已初始化
     */
    modifier whenInitialized() {
        require(_initialized, "Not initialized");
        _;
    }

    /**
     * @dev 检查调用者是否为池子
     */
    modifier onlyPool() {
        require(msg.sender == _pool, "Only pool can call");
        _;
    }

    /**
     * @dev 铸造LP代币
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) 
        external 
        onlyPool 
        whenNotPaused 
        nonReentrant 
        whenInitialized 
    {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Zero amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        emit TokenMinted(to, amount);
    }

    /**
     * @dev 销毁LP代币
     * @param from 销毁地址
     * @param amount 销毁数量
     */
    function burn(address from, uint256 amount) 
        external 
        onlyPool 
        whenNotPaused 
        nonReentrant 
        whenInitialized 
    {
        require(from != address(0), "Invalid sender");
        require(amount > 0, "Zero amount");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
        emit TokenBurned(from, amount);
    }

    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
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
        require(amount >= MIN_TRANSFER_AMOUNT, "Amount too small");
        
        super._transfer(from, to, amount);
        
        // 记录大额转账
        if (amount > totalSupply() / 100) { // 超过总供应量的1%
            emit TransferRestricted(from, to, amount);
        }
    }

    /**
     * @dev 获取池子地址
     */
    function pool() external view returns (address) {
        return _pool;
    }

    /**
     * @dev 获取初始化状态
     */
    function initialized() external view returns (bool) {
        return _initialized;
    }

    /**
     * @dev 获取最小转账金额
     */
    function minTransferAmount() external pure returns (uint256) {
        return MIN_TRANSFER_AMOUNT;
    }
}