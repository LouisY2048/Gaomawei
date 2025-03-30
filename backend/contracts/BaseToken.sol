// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract BaseToken is ERC20, ERC20Burnable, ERC20Pausable, ERC20Permit, ERC20Votes, Ownable {
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
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC20Permit(name) Ownable(msg.sender) {
        _initialized = false;
    }

    // Modifiers
    modifier whenInitialized() virtual {
        if (!_initialized) revert("Not initialized");
        _;
    }

    modifier onlyPool() {
        if (msg.sender != _pool) revert("Caller is not the pool");
        _;
    }

    // Functions
    function initialize(address pool_) external onlyOwner {
        if (_initialized) revert("Already initialized");
        if (pool_ == address(0)) revert("Zero address");
        
        _pool = pool_;
        _initialized = true;
        emit PoolSet(pool_);
    }

    function mint(address to, uint256 amount) public virtual {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Zero amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        emit TokenMinted(to, amount);
    }

    function burn(uint256 amount) public virtual override {
        require(amount > 0, "Zero amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        emit TokenBurned(msg.sender, amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function pool() external view returns (address) {
        return _pool;
    }

    function initialized() external view returns (bool) {
        return _initialized;
    }

    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        if (amount < MINIMUM_TRANSFER_AMOUNT) {
            emit TransferRestricted(msg.sender, to, amount);
            revert("Transfer amount too low");
        }
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        if (amount < MINIMUM_TRANSFER_AMOUNT) {
            emit TransferRestricted(from, to, amount);
            revert("Transfer amount too low");
        }
        return super.transferFrom(from, to, amount);
    }

    // Required overrides
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20, ERC20Pausable, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
} 