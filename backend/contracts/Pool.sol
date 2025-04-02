// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LPToken.sol";

contract Pool is LPToken, ReentrancyGuard {

    IERC20 immutable i_token0;
    IERC20 immutable i_token1;

    address immutable i_token0_address;
    address immutable i_token1_address;

    uint256 constant INITIAL_RATIO = 2; //token0:token1 = 1:2

    mapping(address => uint256) tokenBalances;

    uint256 public constant FEE_PERCENTAGE = 100; // 1% 的交易费用
    uint256 public constant FEE_DENOMINATOR = 10000; // 用于计算百分比的基数
    mapping(address => uint256) public rewards; // 记录每个地址的奖励

    mapping(address => bool) public isLiquidityProvider;
    address[] public liquidityProviders;

    event AddedLiquidity(
        uint256 indexed lpToken,
        address token0,
        uint256 indexed amount0,
        address token1,
        uint256 indexed amount1
    );

    event RemovedLiquidity(
        uint256 indexed lpToken,
        address token0,
        uint256 indexed amount0,
        address token1,
        uint256 indexed amount1
    );

    event Swapped(
        address tokenIn,
        uint256 indexed amountIn,
        address tokenOut,
        uint256 indexed amountOut
    );

    constructor(address token0, address token1) LPToken("LPToken", "LPT") {
        i_token0 = IERC20(token0);
        i_token1 = IERC20(token1);

        i_token0_address = token0;
        i_token1_address = token1;
    }

    function getAmountOut(address tokenIn, uint256 amountIn, address tokenOut) public view returns (uint256) {
        uint256 balanceOut = tokenBalances[tokenOut];
        uint256 balanceIn = tokenBalances[tokenIn];
        uint256 amountOut = (balanceOut * amountIn) / (balanceIn + amountIn);
        
        return amountOut;
    }

    function swap(address tokenIn, uint256 amountIn, address tokenOut) public nonReentrant {
        // 输入有效性检查
        require(tokenIn != tokenOut, "Same tokens");
        require(tokenIn == i_token0_address || tokenIn == i_token1_address, "Invalid token");
        require(tokenOut == i_token0_address || tokenOut == i_token1_address, "Invalid token");
        require(amountIn > 0, "Zero amount");

        // 计算交易费用
        uint256 fee = (amountIn * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - fee;
        
        uint256 amountOut = getAmountOut(tokenIn, amountInAfterFee, tokenOut);

        // 交换代币
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Swap Failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Swap Failed");
        
        // 更新池余额
        tokenBalances[tokenIn] += amountInAfterFee;
        tokenBalances[tokenOut] -= amountOut;
        
        // 将交易费用添加到奖励池
        _distributeFee(tokenIn, fee);

        emit Swapped(tokenIn, amountIn, tokenOut, amountOut);
    }

    function getRequiredAmount1(uint256 amount0) public view returns(uint256) {
        uint256 balance0 = tokenBalances[i_token0_address];
        uint256 balance1 = tokenBalances[i_token1_address];
        
        if (balance0 == 0 || balance1 == 0) {
            return amount0 * INITIAL_RATIO;
        }
        return (amount0 * balance1) / balance0;
    }

    function addLiquidity(uint256 amount0) public nonReentrant {
        // 输入有效性检查
        require(amount0 > 0, "Amount must be greater than 0");
        
        uint256 amount1 = getRequiredAmount1(amount0);
        
        // 存入token0
        require(i_token0.transferFrom(msg.sender, address(this), amount0), "Transfer token0 failed");
        tokenBalances[i_token0_address] += amount0;
        
        // 存入token1
        require(i_token1.transferFrom(msg.sender, address(this), amount1), "Transfer token1 failed");
        tokenBalances[i_token1_address] += amount1;
        
        // 计算并铸造流动性代币
        uint256 amountLP = amount0;
        if (totalSupply() > 0) {
            amountLP = (amount0 * totalSupply()) / tokenBalances[i_token0_address];
        } else {
            amountLP = amount0;
        }
        _mint(msg.sender, amountLP);

        // 更新流动性提供者列表
        if (!isLiquidityProvider[msg.sender]) {
            isLiquidityProvider[msg.sender] = true;
            liquidityProviders.push(msg.sender);
        }

        emit AddedLiquidity(amountLP, i_token0_address, amount0, i_token1_address, amount1);
    }

    function removeLiquidity(uint256 lpAmount) public nonReentrant {
        // 检查输入有效性
        require(lpAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= lpAmount, "Insufficient LP token balance");
        
        // 计算用户应该获得的token0和token1数量
        uint256 totalLPSupply = totalSupply();
        uint256 amount0 = (lpAmount * tokenBalances[i_token0_address]) / totalLPSupply;
        uint256 amount1 = (lpAmount * tokenBalances[i_token1_address]) / totalLPSupply;
        
        // 销毁LP代币
        _burn(msg.sender, lpAmount);
        
        // 更新池中的余额
        tokenBalances[i_token0_address] -= amount0;
        tokenBalances[i_token1_address] -= amount1;
        
        // 将代币转回用户
        require(i_token0.transfer(msg.sender, amount0), "Transfer token0 failed");
        require(i_token1.transfer(msg.sender, amount1), "Transfer token1 failed");
        
        // 如果用户不再持有LP代币，从提供者列表中移除
        if (balanceOf(msg.sender) == 0) {
            isLiquidityProvider[msg.sender] = false;
            // 从数组中移除（这里简化处理，实际项目中需要更复杂的逻辑）
            for (uint256 i = 0; i < liquidityProviders.length; i++) {
                if (liquidityProviders[i] == msg.sender) {
                    liquidityProviders[i] = liquidityProviders[liquidityProviders.length - 1];
                    liquidityProviders.pop();
                    break;
                }
            }
        }
        
        emit RemovedLiquidity(lpAmount, i_token0_address, amount0, i_token1_address, amount1);
    }

    // 辅助函数，用于测试
    function getReserves() public view returns (uint256, uint256) {
        return (tokenBalances[i_token0_address], tokenBalances[i_token1_address]);
    }

    // 新增函数：分配交易费用给流动性提供者
    function _distributeFee(address token, uint256 fee) internal {
        uint256 totalLPSupply = totalSupply();
        if (totalLPSupply == 0) return;
        
        uint256 rewardAmount = fee;
        
        for (uint256 i = 0; i < liquidityProviders.length; i++) {
            address lpProvider = liquidityProviders[i];
            uint256 lpBalance = balanceOf(lpProvider);
            uint256 share = (lpBalance * rewardAmount) / totalLPSupply;
            rewards[lpProvider] += share;
        }
    }
    
    // 新增函数：领取奖励
    function claimRewards() public nonReentrant {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        rewards[msg.sender] = 0;
        require(IERC20(i_token0_address).transfer(msg.sender, reward), "Reward transfer failed");
    }
    
    // 新增函数：查询奖励
    function getRewards(address account) public view returns (uint256) {
        return rewards[account];
    }

    // 新增函数：查询流动性提供者的贡献度
    function getLiquidityContribution(address provider) public view returns (
        uint256 lpBalance,        // LP代币持有量
        uint256 totalLPSupply,    // 总LP供应量
        uint256 contribution      // 贡献度（百分比，精确到小数点后4位）
    ) {
        lpBalance = balanceOf(provider);
        totalLPSupply = totalSupply();
        
        if (totalLPSupply == 0) {
            contribution = 0;
        } else {
            // 计算贡献度百分比（乘以10000以保留4位小数）
            contribution = (lpBalance * 10000) / totalLPSupply;
        }
        
        return (lpBalance, totalLPSupply, contribution);
    }
    
    // 新增函数：查询流动性提供者的奖励信息
    function getRewardInfo(address provider) public view returns (
        uint256 currentRewards,   // 当前可领取的奖励
        uint256 lpBalance,        // LP代币持有量
        uint256 contribution      // 贡献度（百分比，精确到小数点后4位）
    ) {
        currentRewards = rewards[provider];
        (lpBalance, , contribution) = getLiquidityContribution(provider);
        
        return (currentRewards, lpBalance, contribution);
    }
}