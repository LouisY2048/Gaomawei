// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract NewToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit, ERC20Votes {
    // 代币元数据
    string private _tokenMetadataURI;
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
        string memory metadataURI
    ) ERC20(name, symbol) ERC20Permit(name) Ownable(msg.sender) {
        _tokenMetadataURI = metadataURI;
        maxTransferAmount = MAX_SUPPLY / 100; // 默认最大转账额为总供应量的1%
        transferRestricted = true; // 默认开启转账限制
    }

    /**
     * @dev 铸造代币
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit TokenMinted(to, amount);
    }

    /**
     * @dev 销毁代币
     * @param amount 销毁数量
     */
    function burn(uint256 amount) public override(ERC20Burnable) {
        uint256 senderBalance = balanceOf(msg.sender);
        require(senderBalance >= amount, "ERC20: burn amount exceeds balance");
        require(senderBalance - amount >= MIN_BALANCE, "Balance would fall below minimum");
        _burn(msg.sender, amount);
        emit TokenBurned(msg.sender, amount);
    }

    /**
     * @dev 设置最大转账金额
     * @param newAmount 新的最大转账金额
     */
    function setMaxTransferAmount(uint256 newAmount) public onlyOwner {
        require(newAmount > 0, "Amount must be greater than 0");
        uint256 oldAmount = maxTransferAmount;
        maxTransferAmount = newAmount;
        emit MaxTransferAmountUpdated(oldAmount, newAmount);
    }

    /**
     * @dev 更新转账限制状态
     * @param newStatus 新的限制状态
     */
    function setTransferRestriction(bool newStatus) public onlyOwner {
        bool oldStatus = transferRestricted;
        transferRestricted = newStatus;
        emit TransferRestrictionUpdated(oldStatus, newStatus);
    }

    /**
     * @dev 设置代币URI
     * @param newTokenURI 新的URI
     */
    function setTokenURI(string memory newTokenURI) public onlyOwner {
        require(bytes(newTokenURI).length > 0, "URI cannot be empty");
        _tokenMetadataURI = newTokenURI;
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
     * @dev 获取代币URI
     */
    function tokenURI() public view returns (string memory) {
        return _tokenMetadataURI;
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20, ERC20Pausable, ERC20Votes) {
        require(!paused(), "Token transfer while paused");
        require(from != to, "Self transfers not allowed");
        
        if (from != address(0) && to != address(0)) { // 只在转账时检查，不在铸造和销毁时检查
            require(value > 0, "Amount must be greater than 0");
            
            if (transferRestricted) {
                require(value <= maxTransferAmount, "Exceeds max transfer amount");
            }
            
            // 检查发送者余额
            uint256 fromBalance = balanceOf(from);
            require(fromBalance >= value, "Insufficient balance");
            require(fromBalance - value >= MIN_BALANCE, "Balance would fall below minimum");
            
            uint256 toBalance = balanceOf(to);
            if (toBalance > 0) {
                // 如果接收者已经有余额，那么转账后的余额必须大于等于最小余额
                require(toBalance >= MIN_BALANCE, "Recipient balance too low");
            } else {
                // 如果接收者是新用户，那么转账金额必须大于等于最小余额
                require(value >= MIN_BALANCE, "Transfer amount too low for new recipient");
            }
        }
        
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