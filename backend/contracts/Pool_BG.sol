// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./NewToken.sol";
import "./LPToken.sol";

contract Pool_BG {
    // 状态变量
    address public immutable beta;
    address public immutable gamma;
    LPToken public immutable lpToken;
    mapping(address => uint256) private tokenBalances;
    bool private _initialized;

    // 事件
    event PoolInitialized(
        address indexed beta,
        address indexed gamma,
        uint256 amountBeta,
        uint256 amountGamma
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
        uint256 amountBeta,
        uint256 amountGamma,
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountBeta,
        uint256 amountGamma,
        uint256 liquidity
    );

    constructor(address beta_, address gamma_) {
        require(beta_ != address(0), "Beta token is zero address");
        require(gamma_ != address(0), "Gamma token is zero address");
        require(beta_ != gamma_, "Identical addresses");

        beta = beta_;
        gamma = gamma_;
        lpToken = new LPToken();
        lpToken.initialize(address(this));
    }

    // Modifiers
    modifier whenInitialized() {
        require(_initialized, "Pool not initialized");
        _;
    }

    // View functions
    function getReserves() public view returns (uint256 reserveBeta, uint256 reserveGamma) {
        return (tokenBalances[beta], tokenBalances[gamma]);
    }

    function isInitialized() public view returns (bool) {
        return _initialized;
    }

    // External functions
    function initialize(uint256 amountBeta) external {
        require(!_initialized, "Pool already initialized");
        require(amountBeta > 0, "Zero amount");

        uint256 amountGamma = amountBeta; // 1:1 比例用于初始化
        
        // 转入代币
        require(IERC20(beta).transferFrom(msg.sender, address(this), amountBeta), "Transfer Beta failed");
        require(IERC20(gamma).transferFrom(msg.sender, address(this), amountGamma), "Transfer Gamma failed");
        
        // 更新余额
        tokenBalances[beta] = amountBeta;
        tokenBalances[gamma] = amountGamma;
        
        // 铸造LP代币
        lpToken.mint(msg.sender, amountBeta);
        
        _initialized = true;
        emit PoolInitialized(beta, gamma, amountBeta, amountGamma);
    }

    function addLiquidity(uint256 amountBeta) external whenInitialized returns (uint256) {
        require(amountBeta > 0, "Zero amount");
        
        uint256 amountGamma = getRequiredAmountGamma(amountBeta);
        require(amountGamma > 0, "Invalid amountGamma");
        
        // 转入代币
        require(IERC20(beta).transferFrom(msg.sender, address(this), amountBeta), "Transfer Beta failed");
        require(IERC20(gamma).transferFrom(msg.sender, address(this), amountGamma), "Transfer Gamma failed");
        
        // 更新余额
        tokenBalances[beta] += amountBeta;
        tokenBalances[gamma] += amountGamma;
        
        // 计算LP代币数量
        uint256 totalLPSupply = lpToken.totalSupply();
        uint256 amountLP;
        if (totalLPSupply == 0) {
            amountLP = amountBeta;
        } else {
            amountLP = (amountBeta * totalLPSupply) / tokenBalances[beta];
        }
        
        // 铸造LP代币
        lpToken.mint(msg.sender, amountLP);
        
        emit LiquidityAdded(msg.sender, amountBeta, amountGamma, amountLP);
        
        return amountLP;
    }

    function removeLiquidity(uint256 lpAmount) external whenInitialized returns (uint256, uint256) {
        require(lpAmount > 0, "Zero amount");
        require(lpToken.balanceOf(msg.sender) >= lpAmount, "Insufficient LP balance");
        
        // 计算返还金额
        uint256 totalLPSupply = lpToken.totalSupply();
        uint256 amountBeta = (lpAmount * tokenBalances[beta]) / totalLPSupply;
        uint256 amountGamma = (lpAmount * tokenBalances[gamma]) / totalLPSupply;
        
        // 销毁LP代币
        lpToken.burn(msg.sender, lpAmount);
        
        // 更新池余额并转账
        tokenBalances[beta] -= amountBeta;
        tokenBalances[gamma] -= amountGamma;
        
        require(IERC20(beta).transfer(msg.sender, amountBeta), "Transfer Beta failed");
        require(IERC20(gamma).transfer(msg.sender, amountGamma), "Transfer Gamma failed");
        
        emit LiquidityRemoved(msg.sender, amountBeta, amountGamma, lpAmount);
        
        return (amountBeta, amountGamma);
    }

    function swap(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) external whenInitialized returns (uint256) {
        require(tokenIn != tokenOut, "Same tokens");
        require(
            (tokenIn == beta && tokenOut == gamma) ||
            (tokenIn == gamma && tokenOut == beta),
            "Invalid token pair"
        );
        require(amountIn > 0, "Zero input amount");

        // 获取当前价格
        (uint256 reserveBeta, uint256 reserveGamma) = getReserves();
        uint256 currentPrice = tokenIn == beta ? 
            (reserveGamma * 1e18) / reserveBeta : 
            (reserveBeta * 1e18) / reserveGamma;

        // 计算输出金额
        uint256 amountOut;
        if (tokenIn == beta) {
            amountOut = (amountIn * reserveGamma) / (reserveBeta + amountIn);
        } else {
            amountOut = (amountIn * reserveBeta) / (reserveGamma + amountIn);
        }

        // 执行转账
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");

        // 更新余额
        if (tokenIn == beta) {
            tokenBalances[beta] += amountIn;
            tokenBalances[gamma] -= amountOut;
        } else {
            tokenBalances[gamma] += amountIn;
            tokenBalances[beta] -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);

        return amountOut;
    }

    function getRequiredAmountGamma(uint256 amountBeta) public view returns (uint256) {
        if (!_initialized) {
            return amountBeta; // 1:1 比例用于初始化
        }
        
        uint256 balanceBeta = tokenBalances[beta];
        uint256 balanceGamma = tokenBalances[gamma];
        require(balanceBeta > 0 && balanceGamma > 0, "Pool is empty");
        
        return (amountBeta * balanceGamma) / balanceBeta;
    }
}
