// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPToken is ERC20, Pausable, Ownable {
    // 错误定义
    error CallerNotPool();
    error NotInitialized();
    error AlreadyInitialized();
    error ZeroAddress();
    error TransferAmountTooLow();
    
    // 常量定义
    uint256 public constant MAX_SUPPLY = type(uint256).max;
    uint256 public constant MINIMUM_TRANSFER_AMOUNT = 1;
    
    // 状态变量
    bool private _initialized;
    address private _pool;
    
    // 事件定义
    event PoolSet(address indexed pool);
    event TokenMinted(address indexed to, uint256 amount);
    event TokenBurned(address indexed from, uint256 amount);
    event TransferRestricted(address indexed from, address indexed to, uint256 amount);
    
    constructor() ERC20("LP Token", "LP") Ownable(msg.sender) {
        _initialized = false;
    }

    /**
     * @dev 获取最小转账金额
     */
    function minTransferAmount() external pure returns (uint256) {
        return MINIMUM_TRANSFER_AMOUNT;
    }

    /**
     * @dev 检查池是否已初始化
     */
    modifier whenInitialized() virtual {
        if (!_initialized) revert NotInitialized();
        _;
    }

    /**
     * @dev 只允许池合约调用
     */
    modifier onlyPool() {
        if (msg.sender != _pool) revert CallerNotPool();
        _;
    }

    /**
     * @dev 初始化LP代币，设置池合约地址
     * @param pool_ 池合约地址
     */
    function initialize(address pool_) external onlyOwner {
        if (_initialized) revert AlreadyInitialized();
        if (pool_ == address(0)) revert ZeroAddress();
        
        _pool = pool_;
        _initialized = true;
        emit PoolSet(pool_);
    }

    /**
     * @dev 铸造LP代币
     * @param to 接收者地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external whenInitialized onlyPool {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Zero amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        emit TokenMinted(to, amount);
    }

    /**
     * @dev 销毁LP代币
     * @param from 持有者地址
     * @param amount 销毁数量
     */
    function burn(address from, uint256 amount) external whenInitialized onlyPool {
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
     * @dev 获取池合约地址
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
     * @dev 重写转账函数，添加最小转账金额检查
     */
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        if (amount < MINIMUM_TRANSFER_AMOUNT) {
            emit TransferRestricted(msg.sender, to, amount);
            revert TransferAmountTooLow();
        }
        return super.transfer(to, amount);
    }

    /**
     * @dev 重写授权转账函数，添加最小转账金额检查
     */
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        if (amount < MINIMUM_TRANSFER_AMOUNT) {
            emit TransferRestricted(from, to, amount);
            revert TransferAmountTooLow();
        }
        return super.transferFrom(from, to, amount);
    }
}