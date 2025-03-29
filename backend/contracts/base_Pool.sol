// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LPToken.sol";

abstract contract BasePool is LPToken {
    // 常量定义
    uint256 public constant MIN_LIQUIDITY = 1000; // 最小流动性要求
    uint256 public constant MAX_PRICE_IMPACT = 10; // 最大价格影响（10%）
    
    // 代币合约接口
    IERC20 immutable i_token0;
    IERC20 immutable i_token1;

    // 代币地址
    address immutable i_token0_address;
    address immutable i_token1_address;

    // 手续费相关
    uint256 constant FEE_NUMERATOR = 3;    // 手续费分子 (0.3%)
    uint256 constant FEE_DENOMINATOR = 1000; // 手续费分母
    address public feeCollector;           // 手续费接收地址

    // 状态变量
    bool private _poolInitialized;

    // 事件定义
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
        uint256 indexed amountOut,
        uint256 fee
    );

    event ExchangeRateUpdated(
        address token0,
        address token1,
        uint256 rate
    );

    event FeeCollectorUpdated(
        address oldCollector,
        address newCollector
    );

    event PoolInitialized(
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1
    );

    constructor(address token0, address token1) LPToken() {
        require(token0 != address(0), "Invalid token0 address");
        require(token1 != address(0), "Invalid token1 address");
        require(token0 != token1, "Tokens must be different");

        i_token0 = IERC20(token0);
        i_token1 = IERC20(token1);

        i_token0_address = token0;
        i_token1_address = token1;
        
        feeCollector = msg.sender; // 部署者作为初始手续费接收者
        _poolInitialized = false;
    }

    /**
     * @dev 检查池是否已初始化
     */
    modifier whenPoolInitialized() {
        require(_poolInitialized, "Pool not initialized");
        _;
    }

    /**
     * @dev 检查最小流动性
     */
    modifier checkMinLiquidity() {
        _;
        require(totalSupply() >= MIN_LIQUIDITY, "Insufficient liquidity");
    }

    /**
     * @dev 设置手续费接收地址
     * @param newCollector 新的手续费接收地址
     */
    function setFeeCollector(address newCollector) external whenPoolInitialized {
        require(msg.sender == feeCollector, "Only fee collector can update");
        require(newCollector != address(0), "Invalid address");
        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /**
     * @dev 计算当前兑换比率 (token1/token0)
     * @return 兑换比率
     */
    function calculateExchangeRate() public view returns (uint256) {
        (uint256 reserve0, uint256 reserve1) = getReserves();
        if (reserve0 == 0) return 0;
        return (reserve1 * 1e18) / reserve0; // 使用1e18作为精度
    }

    /**
     * @dev 计算手续费
     * @param amount 交易金额
     * @return 手续费金额
     */
    function calculateFee(uint256 amount) public pure returns (uint256) {
        return (amount * FEE_NUMERATOR) / FEE_DENOMINATOR;
    }

    /**
     * @dev 根据兑换比率计算输出代币数量（包含手续费）
     * @param tokenIn 输入代币地址
     * @param amountIn 输入代币数量
     * @param tokenOut 输出代币地址
     * @return 输出代币数量
     */
    function calculateAmountOut(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) public view returns (uint256) {
        require(tokenIn != tokenOut, "Same tokens");
        require(tokenIn == i_token0_address || tokenIn == i_token1_address, "Invalid input token");
        require(tokenOut == i_token0_address || tokenOut == i_token1_address, "Invalid output token");
        require(amountIn > 0, "Zero input amount");

        uint256 exchangeRate = calculateExchangeRate();
        uint256 amountBeforeFee;
        
        if (tokenIn == i_token0_address) {
            amountBeforeFee = (amountIn * exchangeRate) / 1e18;
        } else {
            amountBeforeFee = (amountIn * 1e18) / exchangeRate;
        }
        
        // 扣除手续费
        uint256 fee = calculateFee(amountBeforeFee);
        return amountBeforeFee - fee;
    }

    /**
     * @dev 计算价格影响
     * @param amountIn 输入代币数量
     * @param tokenIn 输入代币地址
     * @return 价格影响百分比
     */
    function calculatePriceImpact(
        uint256 amountIn,
        address tokenIn
    ) public view returns (uint256) {
        (uint256 reserve0, uint256 reserve1) = getReserves();
        uint256 reserve = tokenIn == i_token0_address ? reserve0 : reserve1;
        if (reserve == 0) return 0;
        return (amountIn * 100) / reserve;
    }

    /**
     * @dev 获取代币0地址
     */
    function token0() external view returns (address) {
        return i_token0_address;
    }

    /**
     * @dev 获取代币1地址
     */
    function token1() external view returns (address) {
        return i_token1_address;
    }

    /**
     * @dev 获取池初始化状态
     */
    function poolInitialized() external view returns (bool) {
        return _poolInitialized;
    }

    /**
     * @dev 获取最小流动性要求
     */
    function minLiquidity() external pure returns (uint256) {
        return MIN_LIQUIDITY;
    }

    /**
     * @dev 获取最大价格影响
     */
    function maxPriceImpact() external pure returns (uint256) {
        return MAX_PRICE_IMPACT;
    }

    // 抽象函数声明
    function getAmountOut(address tokenIn, uint256 amountIn, address tokenOut) public virtual view returns (uint256);
    function swap(address tokenIn, uint256 amountIn, address tokenOut) public virtual;
    function getRequiredAmount1(uint256 amount0) public virtual view returns (uint256);
    function addLiquidity(uint256 amount0) public virtual;
    function removeLiquidity(uint256 lpAmount) public virtual;
    function getReserves() public virtual view returns (uint256, uint256);
}