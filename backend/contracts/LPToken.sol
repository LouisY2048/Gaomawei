// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPToken is ERC721Enumerable, Pausable, Ownable {
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
    uint256 private _tokenIdCounter;
    
    // 事件定义
    event PoolSet(address indexed pool);
    event TokenMinted(address indexed to, uint256 tokenId, uint256 amount);
    event TokenBurned(address indexed from, uint256 tokenId);
    event TransferRestricted(address indexed from, address indexed to, uint256 tokenId);
    
    constructor() ERC721("LP Token", "LP") Ownable(msg.sender) {
        _initialized = false;
        _tokenIdCounter = 0;
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
        
        // 为每个代币铸造一个唯一的tokenId
        for (uint256 i = 0; i < amount; i++) {
            _tokenIdCounter++;
            _safeMint(to, _tokenIdCounter);
        }
        
        emit TokenMinted(to, _tokenIdCounter, amount);
    }

    /**
     * @dev 销毁LP代币
     * @param from 持有者地址
     * @param tokenId 代币ID
     */
    function burn(address from, uint256 tokenId) external whenInitialized onlyPool {
        require(from != address(0), "Invalid sender");
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == from, "Not token owner");
        
        _burn(tokenId);
        emit TokenBurned(from, tokenId);
    }

    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev 取消暂停合约
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
     * @dev 检查合约是否已初始化
     */
    function initialized() external view returns (bool) {
        return _initialized;
    }

    /**
     * @dev 重写 _update 函数以支持暂停功能
     */
    function _update(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable) whenNotPaused {
        super._update(from, to, tokenId, batchSize);
    }

    /**
     * @dev 重写 supportsInterface 函数以支持 ERC721Enumerable
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev 获取用户持有的所有代币ID
     * @param owner 用户地址
     * @return tokenIds 代币ID数组
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }
}