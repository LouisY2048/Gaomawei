// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./NewToken.sol";
import "./LPToken.sol";

contract Pool_AB {
    // 状态变量
    address public immutable alpha;
    address public immutable beta;
    LPToken public immutable lpToken;
    mapping(address => uint256) private tokenBalances;
    bool private _initialized;

    // 事件
    event PoolInitialized(
        address indexed alpha,
        address indexed beta,
        uint256 amountAlpha,
        uint256 amountBeta
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
        uint256 amountAlpha,
        uint256 amountBeta,
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountAlpha,
        uint256 amountBeta,
        uint256 liquidity
    );

    constructor(address alpha_, address beta_) {
        require(alpha_ != address(0), "Alpha token is zero address");
        require(beta_ != address(0), "Beta token is zero address");
        require(alpha_ != beta_, "Identical addresses");

        alpha = alpha_;
        beta = beta_;
        lpToken = new LPToken();
        lpToken.initialize(address(this));
    }

    // Modifiers
    modifier whenInitialized() {
        require(_initialized, "Pool not initialized");
        _;
    }

    // View functions
    function getReserves() public view returns (uint256 reserveAlpha, uint256 reserveBeta) {
        return (tokenBalances[alpha], tokenBalances[beta]);
    }

    function isInitialized() public view returns (bool) {
        return _initialized;
    }

    // External functions
    function initialize(uint256 amountAlpha) external {
        require(!_initialized, "Pool already initialized");
        require(amountAlpha > 0, "Zero amount");

        uint256 amountBeta = amountAlpha; // 1:1 比例用于初始化
        
        // 转入代币
        require(IERC20(alpha).transferFrom(msg.sender, address(this), amountAlpha), "Transfer Alpha failed");
        require(IERC20(beta).transferFrom(msg.sender, address(this), amountBeta), "Transfer Beta failed");
        
        // 更新余额
        tokenBalances[alpha] = amountAlpha;
        tokenBalances[beta] = amountBeta;
        
        // 铸造LP代币
        lpToken.mint(msg.sender, amountAlpha);
        
        _initialized = true;
        emit PoolInitialized(alpha, beta, amountAlpha, amountBeta);
    }

    function addLiquidity(uint256 amountAlpha) external whenInitialized returns (uint256) {
        require(amountAlpha > 0, "Zero amount");
        
        uint256 amountBeta = getRequiredAmountBeta(amountAlpha);
        require(amountBeta > 0, "Invalid amountBeta");
        
        // 转入代币
        require(IERC20(alpha).transferFrom(msg.sender, address(this), amountAlpha), "Transfer Alpha failed");
        require(IERC20(beta).transferFrom(msg.sender, address(this), amountBeta), "Transfer Beta failed");
        
        // 更新余额
        tokenBalances[alpha] += amountAlpha;
        tokenBalances[beta] += amountBeta;
        
        // 计算LP代币数量
        uint256 totalLPSupply = lpToken.totalSupply();
        uint256 amountLP;
        if (totalLPSupply == 0) {
            amountLP = amountAlpha;
        } else {
            amountLP = (amountAlpha * totalLPSupply) / tokenBalances[alpha];
        }
        
        // 铸造LP代币
        lpToken.mint(msg.sender, amountLP);
        
        emit LiquidityAdded(msg.sender, amountAlpha, amountBeta, amountLP);
        
        return amountLP;
    }

    function removeLiquidity(uint256 lpAmount) external whenInitialized returns (uint256, uint256) {
        require(lpAmount > 0, "Zero amount");
        require(lpToken.balanceOf(msg.sender) >= lpAmount, "Insufficient LP balance");
        
        // 计算返还金额
        uint256 totalLPSupply = lpToken.totalSupply();
        uint256 amountAlpha = (lpAmount * tokenBalances[alpha]) / totalLPSupply;
        uint256 amountBeta = (lpAmount * tokenBalances[beta]) / totalLPSupply;
        
        // 销毁LP代币
        lpToken.burn(msg.sender, lpAmount);
        
        // 更新池余额并转账
        tokenBalances[alpha] -= amountAlpha;
        tokenBalances[beta] -= amountBeta;
        
        require(IERC20(alpha).transfer(msg.sender, amountAlpha), "Transfer Alpha failed");
        require(IERC20(beta).transfer(msg.sender, amountBeta), "Transfer Beta failed");
        
        emit LiquidityRemoved(msg.sender, amountAlpha, amountBeta, lpAmount);
        
        return (amountAlpha, amountBeta);
    }

    function swap(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) external whenInitialized returns (uint256) {
        require(tokenIn != tokenOut, "Same tokens");
        require(
            (tokenIn == alpha && tokenOut == beta) ||
            (tokenIn == beta && tokenOut == alpha),
            "Invalid token pair"
        );
        require(amountIn > 0, "Zero input amount");

        // 获取当前价格
        (uint256 reserveAlpha, uint256 reserveBeta) = getReserves();
        uint256 currentPrice = tokenIn == alpha ? 
            (reserveBeta * 1e18) / reserveAlpha : 
            (reserveAlpha * 1e18) / reserveBeta;

        // 计算输出金额
        uint256 amountOut;
        if (tokenIn == alpha) {
            amountOut = (amountIn * reserveBeta) / (reserveAlpha + amountIn);
        } else {
            amountOut = (amountIn * reserveAlpha) / (reserveBeta + amountIn);
        }

        // 执行转账
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");

        // 更新余额
        if (tokenIn == alpha) {
            tokenBalances[alpha] += amountIn;
            tokenBalances[beta] -= amountOut;
        } else {
            tokenBalances[beta] += amountIn;
            tokenBalances[alpha] -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);

        return amountOut;
    }

    function getRequiredAmountBeta(uint256 amountAlpha) public view returns (uint256) {
        if (!_initialized) {
            return amountAlpha; // 1:1 比例用于初始化
        }
        
        uint256 balanceAlpha = tokenBalances[alpha];
        uint256 balanceBeta = tokenBalances[beta];
        require(balanceAlpha > 0 && balanceBeta > 0, "Pool is empty");
        
        return (amountAlpha * balanceBeta) / balanceAlpha;
    }
}