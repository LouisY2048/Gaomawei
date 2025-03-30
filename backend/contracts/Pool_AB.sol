// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./base_Pool.sol";

contract Pool_AB is BasePool {
    // 状态变量
    mapping(address => uint256) private tokenBalances;
    
    constructor(address alpha, address beta) BasePool(alpha, beta) {}

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

    function addLiquidity(uint256 amount0) external override whenInitialized returns (uint256) {
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
        
        emit LiquidityAdded(msg.sender, amount0, amount1, amountLP);
        
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
        require(remainingLiquidity >= MIN_LIQUIDITY, "Would break minimum liquidity");
        
        // 销毁LP代币
        _burn(msg.sender, lpAmount);
        
        // 更新池余额并转账
        tokenBalances[token0()] -= amount0;
        tokenBalances[token1()] -= amount1;
        
        require(IERC20(token0()).transfer(msg.sender, amount0), "Transfer token0 failed");
        require(IERC20(token1()).transfer(msg.sender, amount1), "Transfer token1 failed");
        
        emit LiquidityRemoved(msg.sender, amount0, amount1, lpAmount);
        
        return (amount0, amount1);
    }

    function swap(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) external override whenInitialized returns (uint256) {
        require(tokenIn != tokenOut, "Same tokens");
        require(
            (tokenIn == token0() && tokenOut == token1()) ||
            (tokenIn == token1() && tokenOut == token0()),
            "Invalid token pair"
        );
        require(amountIn > 0, "Zero input amount");

        // 获取当前价格
        (uint256 reserve0, uint256 reserve1) = getReserves();
        uint256 currentPrice = tokenIn == token0() ? 
            (reserve1 * 1e18) / reserve0 : 
            (reserve0 * 1e18) / reserve1;

        // 计算输出金额
        uint256 amountOut;
        if (tokenIn == token0()) {
            amountOut = (amountIn * reserve1) / (reserve0 + amountIn);
        } else {
            amountOut = (amountIn * reserve0) / (reserve1 + amountIn);
        }

        // 检查价格影响
        uint256 newPrice = tokenIn == token0() ?
            ((reserve1 - amountOut) * 1e18) / (reserve0 + amountIn) :
            ((reserve0 - amountOut) * 1e18) / (reserve1 + amountIn);
        _checkPriceImpact(currentPrice, newPrice);

        // 执行转账
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");

        // 更新余额
        if (tokenIn == token0()) {
            tokenBalances[token0()] += amountIn;
            tokenBalances[token1()] -= amountOut;
        } else {
            tokenBalances[token1()] += amountIn;
            tokenBalances[token0()] -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        _updateReserves();

        return amountOut;
    }

    function getRequiredAmount1(uint256 amount0) public view override returns (uint256) {
        if (!isInitialized()) {
            return amount0; // 1:1 比例用于初始化
        }
        
        uint256 balance0 = tokenBalances[token0()];
        uint256 balance1 = tokenBalances[token1()];
        require(balance0 > 0 && balance1 > 0, "Pool is empty");
        
        return (amount0 * balance1) / balance0;
    }

    function getReserves() public view override returns (uint256, uint256) {
        return (tokenBalances[token0()], tokenBalances[token1()]);
    }
}