// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./NewToken.sol";
import "./LPToken.sol";

contract Pool_GA is Ownable, ReentrancyGuard {
    // 状态变量
    address public immutable gamma;
    address public immutable alpha;
    LPToken public immutable lpToken;
    mapping(address => uint256) private tokenBalances;
    bool private _initialized;

    // 添加交易费用相关变量
    uint256 public constant FEE_PERCENT = 200; // 2% = 200/10000
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public totalFeesCollected;
    
    // 添加费用分配事件
    event FeesDistributed(uint256 totalAmount, uint256 timestamp);

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
        require(IERC20(gamma).balanceOf(msg.sender) >= amountGamma, "Insufficient Gamma balance");
        
        // 计算需要的Alpha数量
        uint256 requiredAmountAlpha = getRequiredAmountAlpha(amountGamma);
        require(IERC20(alpha).balanceOf(msg.sender) >= requiredAmountAlpha, "Insufficient Alpha balance");
        
        // 检查授权
        require(IERC20(gamma).allowance(msg.sender, address(this)) >= amountGamma, "Gamma allowance too low");
        require(IERC20(alpha).allowance(msg.sender, address(this)) >= requiredAmountAlpha, "Alpha allowance too low");
        
        // 转账代币
        require(IERC20(gamma).transferFrom(msg.sender, address(this), amountGamma), "Gamma transfer failed");
        require(IERC20(alpha).transferFrom(msg.sender, address(this), requiredAmountAlpha), "Alpha transfer failed");
        
        // 更新余额
        tokenBalances[gamma] += amountGamma;
        tokenBalances[alpha] += requiredAmountAlpha;
        
        // 铸造LP代币
        uint256 lpAmount = amountGamma; // 使用gamma数量作为LP代币数量
        lpToken.mint(msg.sender, lpAmount);
        
        emit LiquidityAdded(msg.sender, amountGamma, requiredAmountAlpha, lpAmount);
        
        return lpAmount;
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

        // 计算交易费用
        uint256 feeAmount = (amountIn * FEE_PERCENT) / FEE_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - feeAmount;

        // 执行转账
        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn), "Transfer in failed");
        require(IERC20(tokenOut).transfer(msg.sender, amountOut), "Transfer out failed");

        // 更新余额
        if (tokenIn == gamma) {
            tokenBalances[gamma] += amountInAfterFee;
            tokenBalances[alpha] -= amountOut;
        } else {
            tokenBalances[alpha] += amountInAfterFee;
            tokenBalances[gamma] -= amountOut;
        }

        // 更新总费用
        totalFeesCollected += feeAmount;

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

    // 添加分配费用的函数
    function distributeFees() external nonReentrant {
        require(totalFeesCollected > 0, "No fees to distribute");
        
        uint256 totalLPSupply = lpToken.totalSupply();
        require(totalLPSupply > 0, "No liquidity providers");
        
        // 获取所有LP代币持有者
        uint256 totalFees = totalFeesCollected;
        totalFeesCollected = 0; // 重置费用计数器
        
        // 获取代币合约
        IERC20 gammaToken = IERC20(gamma);
        IERC20 alphaToken = IERC20(alpha);
        
        // 计算每个代币的费用
        uint256 gammaFees = (totalFees * tokenBalances[gamma]) / (tokenBalances[gamma] + tokenBalances[alpha]);
        uint256 alphaFees = totalFees - gammaFees;
        
        // 获取所有LP代币持有者
        uint256[] memory tokenIds = lpToken.tokensOfOwner(address(this));
        
        // 分配费用给LP代币持有者
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            address holder = lpToken.ownerOf(tokenId);
            uint256 holderBalance = lpToken.balanceOf(holder);
            uint256 share = (holderBalance * 1e18) / totalLPSupply;
            
            // 分配gamma代币费用
            if (gammaFees > 0) {
                uint256 gammaShare = (gammaFees * share) / 1e18;
                if (gammaShare > 0) {
                    require(gammaToken.transfer(holder, gammaShare), "Gamma fee transfer failed");
                }
            }
            
            // 分配alpha代币费用
            if (alphaFees > 0) {
                uint256 alphaShare = (alphaFees * share) / 1e18;
                if (alphaShare > 0) {
                    require(alphaToken.transfer(holder, alphaShare), "Alpha fee transfer failed");
                }
            }
        }
        
        emit FeesDistributed(totalFees, block.timestamp);
    }
}
