// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./base_Pool.sol";

contract Pool_BG is BasePool {
    // 状态变量
    mapping(address => uint256) private tokenBalances;
    
    // 事件定义
    event Swapped(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee);
    event PriceImpactExceeded(address indexed token, uint256 amount, uint256 impact);
    event LiquidityBelowMinimum(uint256 currentLiquidity, uint256 requiredMinimum);
    
    constructor(address beta, address gamma) BasePool(beta, gamma) {}

    /**
     * @dev 检查池是否已初始化
     */
    modifier whenInitialized() override {
        require(isInitialized(), "Pool not initialized");
        _;
    }

    /**
     * @dev 检查最小流动性
     */
    modifier checkMinLiquidity() override {
        _;
        require(totalSupply() >= MIN_LIQUIDITY, "Insufficient liquidity");
    }

    function getAmountOut(
        address tokenIn, 
        uint256 amountIn, 
        address tokenOut
    ) public view whenInitialized returns (uint256) {
        require(tokenIn != tokenOut, "Same tokens");
        require(tokenIn == token0() || tokenIn == token1(), "Invalid input token");
        require(tokenOut == token0() || tokenOut == token1(), "Invalid output token");
        require(amountIn > 0, "Zero input amount");
        
        // 获取当前价格
        (uint256 reserve0, uint256 reserve1) = getReserves();
        uint256 reserveIn = tokenIn == token0() ? reserve0 : reserve1;
        uint256 reserveOut = tokenIn == token0() ? reserve1 : reserve0;
        
        // 计算输出金额
        uint256 amountOut = (amountIn * reserveOut) / (reserveIn + amountIn);
        
        // 计算价格影响
        uint256 oldPrice = (reserveOut * 1e18) / reserveIn;
        uint256 newPrice = ((reserveOut - amountOut) * 1e18) / (reserveIn + amountIn);
        uint256 priceImpact;
        if (newPrice > oldPrice) {
            priceImpact = ((newPrice - oldPrice) * 100) / oldPrice;
        } else {
            priceImpact = ((oldPrice - newPrice) * 100) / oldPrice;
        }
        require(priceImpact <= MAX_PRICE_IMPACT, "Price impact too high");
        
        return amountOut;
    }

    function swap(
        address tokenIn, 
        uint256 amountIn, 
        address tokenOut
    ) external override whenInitialized returns (uint256) {
        // 获取输出金额
        uint256 amountOut = getAmountOut(tokenIn, amountIn, tokenOut);
        uint256 fee = amountOut / 100; // 1% fee
        amountOut -= fee;
        
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
            tokenBalances[tokenOut] -= fee;
        }

        // 发出事件
        emit Swapped(tokenIn, tokenOut, amountIn, amountOut, fee);
        
        // 检查价格影响
        (uint256 reserve0, uint256 reserve1) = getReserves();
        uint256 reserveIn = tokenIn == token0() ? reserve0 : reserve1;
        uint256 oldPrice = (reserve1 * 1e18) / reserve0;
        uint256 newPrice = ((reserve1 - amountOut) * 1e18) / (reserve0 + amountIn);
        uint256 priceImpact;
        if (newPrice > oldPrice) {
            priceImpact = ((newPrice - oldPrice) * 100) / oldPrice;
        } else {
            priceImpact = ((oldPrice - newPrice) * 100) / oldPrice;
        }
        if (priceImpact > MAX_PRICE_IMPACT / 2) {
            emit PriceImpactExceeded(tokenIn, amountIn, priceImpact);
        }

        return amountOut;
    }

    function getRequiredAmount1(uint256 amount0) public view override returns(uint256) {
        if (!isInitialized()) {
            return amount0; // 1:1 比例用于初始化
        }
        
        uint256 balance0 = tokenBalances[token0()];
        uint256 balance1 = tokenBalances[token1()];
        require(balance0 > 0 && balance1 > 0, "Pool is empty");
        
        return (amount0 * balance1) / balance0;
    }

    function initialize(uint256 amount0) external override {
        require(!isInitialized(), "Pool already initialized");
        require(amount0 >= MIN_LIQUIDITY, "Initial liquidity too low");

        uint256 amount1 = amount0; // 1:1 比例用于初始化
        
        // 转入代币
        require(IERC20(token0()).transferFrom(msg.sender, address(this), amount0), "Transfer token0 failed");
        require(IERC20(token1()).transferFrom(msg.sender, address(this), amount1), "Transfer token1 failed");
        
        // 更新余额
        tokenBalances[token0()] = amount0;
        tokenBalances[token1()] = amount1;
        
        // 铸造LP代币
        _mint(msg.sender, amount0);
        
        emit PoolInitialized(token0(), token1(), amount0, amount1);
    }

    function addLiquidity(uint256 amount0) external override returns (uint256) {
        require(amount0 > 0, "Zero amount");
        
        uint256 amount1 = getRequiredAmount1(amount0);
        require(amount1 > 0, "Invalid amount1");
        
        // 转入代币
        require(IERC20(token0()).transferFrom(msg.sender, address(this), amount0), "Transfer token0 failed");
        require(IERC20(token1()).transferFrom(msg.sender, address(this), amount1), "Transfer token1 failed");
        
        // 更新余额
        tokenBalances[token0()] += amount0;
        tokenBalances[token1()] += amount1;
        
        // 计算LP代币数量
        uint256 amountLP = (amount0 * totalSupply()) / tokenBalances[token0()];
        
        // 铸造LP代币
        _mint(msg.sender, amountLP);
        
        return amountLP;
    }

    function removeLiquidity(uint256 lpAmount) external override whenInitialized checkMinLiquidity returns (uint256, uint256) {
        require(lpAmount > 0, "Zero amount");
        require(balanceOf(msg.sender) >= lpAmount, "Insufficient LP balance");
        
        // 计算返还金额
        uint256 totalLPSupply = totalSupply();
        uint256 amount0 = (lpAmount * tokenBalances[token0()]) / totalLPSupply;
        uint256 amount1 = (lpAmount * tokenBalances[token1()]) / totalLPSupply;
        
        // 检查最小流动性
        uint256 remainingLiquidity = totalLPSupply - lpAmount;
        if (remainingLiquidity < MIN_LIQUIDITY) {
            emit LiquidityBelowMinimum(remainingLiquidity, MIN_LIQUIDITY);
            revert("Would break minimum liquidity");
        }
        
        // 销毁LP代币
        _burn(msg.sender, lpAmount);
        
        // 更新池余额并转账
        tokenBalances[token0()] -= amount0;
        tokenBalances[token1()] -= amount1;
        
        require(IERC20(token0()).transfer(msg.sender, amount0), "Transfer token0 failed");
        require(IERC20(token1()).transfer(msg.sender, amount1), "Transfer token1 failed");
        
        return (amount0, amount1);
    }

    function getReserves() public view override returns (uint256, uint256) {
        return (tokenBalances[token0()], tokenBalances[token1()]);
    }
}
