// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./NewToken.sol";
import "./LPToken.sol";

contract Pool_GA {
    // 状态变量
    address public immutable gamma;
    address public immutable alpha;
    LPToken public immutable lpToken;
    mapping(address => uint256) private tokenBalances;
    bool private _initialized;

    // 事件
    event PoolInitialized(
        address indexed gamma,
        address indexed alpha,
        uint256 amountGamma,
        uint256 amountAlpha
    );
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event LiquidityAdded(
        address indexed provider,
        uint256 amountGamma,
        uint256 amountAlpha,
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountGamma,
        uint256 amountAlpha,
        uint256 liquidity
    );

    constructor(address gamma_, address alpha_) {
        require(gamma_ != address(0), "Gamma token is zero address");
        require(alpha_ != address(0), "Alpha token is zero address");
        require(gamma_ != alpha_, "Identical addresses");

        gamma = gamma_;
        alpha = alpha_;
        lpToken = new LPToken();
        lpToken.initialize(address(this));
    }

    // Modifiers
    modifier whenInitialized() {
        require(_initialized, "Pool not initialized");
        _;
    }

    // View functions
    function getReserves() public view returns (uint256 reserveGamma, uint256 reserveAlpha) {
        return (tokenBalances[gamma], tokenBalances[alpha]);
    }

    function isInitialized() public view returns (bool) {
        return _initialized;
    }

    // External functions
    function initialize(uint256 amountGamma) external {
        require(!_initialized, "Pool already initialized");
        require(amountGamma > 0, "Zero amount");

        uint256 amountAlpha = amountGamma; // 1:1 比例用于初始化
        
        // 转入代币
        require(IERC20(gamma).transferFrom(msg.sender, address(this), amountGamma), "Transfer Gamma failed");
        require(IERC20(alpha).transferFrom(msg.sender, address(this), amountAlpha), "Transfer Alpha failed");
        
        // 更新余额
        tokenBalances[gamma] = amountGamma;
        tokenBalances[alpha] = amountAlpha;
        
        // 铸造LP代币
        lpToken.mint(msg.sender, amountGamma);
        
        _initialized = true;
        emit PoolInitialized(gamma, alpha, amountGamma, amountAlpha);
    }

    function addLiquidity(uint256 amountGamma) external whenInitialized returns (uint256) {
        require(amountGamma > 0, "Zero amount");
        
        uint256 amountAlpha = getRequiredAmountAlpha(amountGamma);
        require(amountAlpha > 0, "Invalid amountAlpha");
        
        // 转入代币
        require(IERC20(gamma).transferFrom(msg.sender, address(this), amountGamma), "Transfer Gamma failed");
        require(IERC20(alpha).transferFrom(msg.sender, address(this), amountAlpha), "Transfer Alpha failed");
        
        // 更新余额
        tokenBalances[gamma] += amountGamma;
        tokenBalances[alpha] += amountAlpha;
        
        // 计算LP代币数量
        uint256 totalLPSupply = lpToken.totalSupply();
        uint256 amountLP;
        if (totalLPSupply == 0) {
            amountLP = amountGamma;
        } else {
            amountLP = (amountGamma * totalLPSupply) / tokenBalances[gamma];
        }
        
        // 铸造LP代币
        lpToken.mint(msg.sender, amountLP);
        
        emit LiquidityAdded(msg.sender, amountGamma, amountAlpha, amountLP);
        
        return amountLP;
    }

    function removeLiquidity(uint256 lpAmount) external whenInitialized returns (uint256, uint256) {
        require(lpAmount > 0, "Zero amount");
        require(lpToken.balanceOf(msg.sender) >= lpAmount, "Insufficient LP balance");
        
        // 计算返还金额
        uint256 totalLPSupply = lpToken.totalSupply();
        uint256 amountGamma = (lpAmount * tokenBalances[gamma]) / totalLPSupply;
        uint256 amountAlpha = (lpAmount * tokenBalances[alpha]) / totalLPSupply;
        
        // 销毁LP代币
        lpToken.burn(msg.sender, lpAmount);
        
        // 更新池余额并转账
        tokenBalances[gamma] -= amountGamma;
        tokenBalances[alpha] -= amountAlpha;
        
        require(IERC20(gamma).transfer(msg.sender, amountGamma), "Transfer Gamma failed");
        require(IERC20(alpha).transfer(msg.sender, amountAlpha), "Transfer Alpha failed");
        
        emit LiquidityRemoved(msg.sender, amountGamma, amountAlpha, lpAmount);
        
        return (amountGamma, amountAlpha);
    }

    function swap(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) external whenInitialized returns (uint256) {
        require(tokenIn != tokenOut, "Same tokens");
        require(
            (tokenIn == gamma && tokenOut == alpha) ||
            (tokenIn == alpha && tokenOut == gamma),
            "Invalid token pair"
        );
        require(amountIn > 0, "Zero input amount");

        // 获取当前价格
        (uint256 reserveGamma, uint256 reserveAlpha) = getReserves();
        uint256 currentPrice = tokenIn == gamma ? 
            (reserveAlpha * 1e18) / reserveGamma : 
            (reserveGamma * 1e18) / reserveAlpha;

        // 计算输出金额
        uint256 amountOut;
        if (tokenIn == gamma) {
            amountOut = (amountIn * reserveAlpha) / (reserveGamma + amountIn);
        } else {
            amountOut = (amountIn * reserveGamma) / (reserveAlpha + amountIn);
        }

        // 执行转账
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");

        // 更新余额
        if (tokenIn == gamma) {
            tokenBalances[gamma] += amountIn;
            tokenBalances[alpha] -= amountOut;
        } else {
            tokenBalances[alpha] += amountIn;
            tokenBalances[gamma] -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);

        return amountOut;
    }

    function getRequiredAmountAlpha(uint256 amountGamma) public view returns (uint256) {
        if (!_initialized) {
            return amountGamma; // 1:1 比例用于初始化
        }
        
        uint256 balanceGamma = tokenBalances[gamma];
        uint256 balanceAlpha = tokenBalances[alpha];
        require(balanceGamma > 0 && balanceAlpha > 0, "Pool is empty");
        
        return (amountGamma * balanceAlpha) / balanceGamma;
    }
}
