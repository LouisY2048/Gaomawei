// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./base_Pool.sol";

contract Pool_BG is BasePool {
    // 常量定义
    uint256 public constant MIN_LIQUIDITY = 1000; // 最小流动性要求
    uint256 public constant MAX_PRICE_IMPACT = 10; // 最大价格影响（10%）
    
    // 状态变量
    mapping(address => uint256) private tokenBalances;
    bool private initialized;
    
    // 事件定义
    event PoolInitialized(address indexed token0, address indexed token1, uint256 amount0, uint256 amount1);
    event PriceImpactExceeded(address indexed token, uint256 amount, uint256 impact);
    event LiquidityBelowMinimum(uint256 currentLiquidity, uint256 requiredMinimum);
    
    constructor(address beta, address gamma) BasePool(beta, gamma) {
        initialized = false;
    }

    /**
     * @dev 检查池是否已初始化
     */
    modifier whenInitialized() {
        require(initialized, "Pool not initialized");
        _;
    }

    /**
     * @dev 检查最小流动性
     */
    modifier checkMinLiquidity() {
        _;
        require(totalSupply() >= MIN_LIQUIDITY, "Insufficient liquidity");
    }

    function getAmountOut(
        address tokenIn, 
        uint256 amountIn, 
        address tokenOut
    ) public view override whenInitialized returns (uint256) {
        require(tokenIn != tokenOut, "Same tokens");
        require(tokenIn == i_token0_address || tokenIn == i_token1_address, "Invalid input token");
        require(tokenOut == i_token0_address || tokenOut == i_token1_address, "Invalid output token");
        require(amountIn > 0, "Zero input amount");
        
        // 使用动态兑换比率计算输出数量
        uint256 amountOut = calculateAmountOut(tokenIn, amountIn, tokenOut);
        
        // 计算并检查价格影响
        uint256 priceImpact = calculatePriceImpact(amountIn, tokenIn);
        require(priceImpact <= MAX_PRICE_IMPACT, "Price impact too high");
        
        return amountOut;
    }

    function swap(
        address tokenIn, 
        uint256 amountIn, 
        address tokenOut
    ) public override nonReentrant whenInitialized {
        // 获取输出金额
        uint256 amountOut = getAmountOut(tokenIn, amountIn, tokenOut);
        uint256 fee = calculateFee(amountOut);
        
        // 检查池余额
        require(tokenBalances[tokenOut] >= amountOut + fee, "Insufficient pool balance");
        
        // 执行转账
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");
        
        // 更新池余额
        tokenBalances[tokenIn] += amountIn;
        tokenBalances[tokenOut] -= amountOut;

        // 处理手续费
        if (fee > 0) {
            require(IERC20(tokenOut).transfer(feeCollector, fee), "Fee transfer failed");
            tokenBalances[tokenOut] -= fee;
        }

        // 发出事件
        emit Swapped(tokenIn, amountIn, tokenOut, amountOut, fee);
        emit ExchangeRateUpdated(i_token0_address, i_token1_address, calculateExchangeRate());
        
        // 检查价格影响
        uint256 priceImpact = calculatePriceImpact(amountIn, tokenIn);
        if (priceImpact > MAX_PRICE_IMPACT / 2) {
            emit PriceImpactExceeded(tokenIn, amountIn, priceImpact);
        }
    }

    function getRequiredAmount1(uint256 amount0) public view override returns(uint256) {
        if (!initialized) {
            return amount0; // 1:1 比例用于初始化
        }
        
        uint256 balance0 = tokenBalances[i_token0_address];
        uint256 balance1 = tokenBalances[i_token1_address];
        require(balance0 > 0 && balance1 > 0, "Pool is empty");
        
        return (amount0 * balance1) / balance0;
    }

    function addLiquidity(uint256 amount0) public override nonReentrant {
        require(amount0 > 0, "Zero amount");
        
        uint256 amount1 = getRequiredAmount1(amount0);
        require(amount1 > 0, "Invalid amount1");
        
        // 转入代币
        require(i_token0.transferFrom(msg.sender, address(this), amount0), "Transfer token0 failed");
        require(i_token1.transferFrom(msg.sender, address(this), amount1), "Transfer token1 failed");
        
        // 更新余额
        tokenBalances[i_token0_address] += amount0;
        tokenBalances[i_token1_address] += amount1;
        
        // 计算LP代币数量
        uint256 amountLP;
        if (!initialized) {
            require(amount0 >= MIN_LIQUIDITY, "Initial liquidity too low");
            amountLP = amount0;
            initialized = true;
            emit PoolInitialized(i_token0_address, i_token1_address, amount0, amount1);
        } else {
            amountLP = (amount0 * totalSupply()) / tokenBalances[i_token0_address];
        }
        
        // 铸造LP代币
        _mint(msg.sender, amountLP);
        
        emit AddedLiquidity(amountLP, i_token0_address, amount0, i_token1_address, amount1);
        emit ExchangeRateUpdated(i_token0_address, i_token1_address, calculateExchangeRate());
    }

    function removeLiquidity(uint256 lpAmount) public override nonReentrant whenInitialized checkMinLiquidity {
        require(lpAmount > 0, "Zero amount");
        require(balanceOf(msg.sender) >= lpAmount, "Insufficient LP balance");
        
        // 计算返还金额
        uint256 totalLPSupply = totalSupply();
        uint256 amount0 = (lpAmount * tokenBalances[i_token0_address]) / totalLPSupply;
        uint256 amount1 = (lpAmount * tokenBalances[i_token1_address]) / totalLPSupply;
        
        // 检查最小流动性
        uint256 remainingLiquidity = totalLPSupply - lpAmount;
        if (remainingLiquidity < MIN_LIQUIDITY) {
            emit LiquidityBelowMinimum(remainingLiquidity, MIN_LIQUIDITY);
            revert("Would break minimum liquidity");
        }
        
        // 销毁LP代币
        _burn(msg.sender, lpAmount);
        
        // 更新池余额并转账
        tokenBalances[i_token0_address] -= amount0;
        tokenBalances[i_token1_address] -= amount1;
        
        require(i_token0.transfer(msg.sender, amount0), "Transfer token0 failed");
        require(i_token1.transfer(msg.sender, amount1), "Transfer token1 failed");
        
        emit RemovedLiquidity(lpAmount, i_token0_address, amount0, i_token1_address, amount1);
        emit ExchangeRateUpdated(i_token0_address, i_token1_address, calculateExchangeRate());
    }

    function getReserves() public view override returns (uint256, uint256) {
        return (tokenBalances[i_token0_address], tokenBalances[i_token1_address]);
    }
}
