// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LPToken.sol";

abstract contract BasePool is LPToken {
    // Constants
    uint256 public constant MIN_LIQUIDITY = 1000; // 最小流动性要求
    uint256 public constant MAX_PRICE_IMPACT = 10; // 最大价格影响（10%）
    
    // State variables
    address private immutable _token0;
    address private immutable _token1;
    uint256 private _reserve0;
    uint256 private _reserve1;
    bool private _initialized;

    // Events
    event PoolInitialized(
        address indexed token0,
        address indexed token1,
        uint256 amount0,
        uint256 amount1
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
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );

    constructor(address token0_, address token1_) LPToken() {
        require(token0_ != address(0), "BasePool: ZERO_ADDRESS");
        require(token1_ != address(0), "BasePool: ZERO_ADDRESS");
        require(token0_ != token1_, "BasePool: IDENTICAL_ADDRESSES");

        _token0 = token0_;
        _token1 = token1_;
    }

    // Modifiers
    modifier whenInitialized() virtual override {
        require(_initialized, "BasePool: NOT_INITIALIZED");
        _;
    }

    modifier checkMinLiquidity() virtual {
        require(
            IERC20(_token0).balanceOf(address(this)) >= MIN_LIQUIDITY &&
            IERC20(_token1).balanceOf(address(this)) >= MIN_LIQUIDITY,
            "BasePool: INSUFFICIENT_LIQUIDITY"
        );
        _;
    }

    // View functions
    function getReserves() public view virtual returns (uint256 reserve0, uint256 reserve1) {
        return (_reserve0, _reserve1);
    }

    function token0() public view returns (address) {
        return _token0;
    }

    function token1() public view returns (address) {
        return _token1;
    }

    function isInitialized() public view returns (bool) {
        return _initialized;
    }

    // Internal functions
    function _updateReserves() internal {
        _reserve0 = IERC20(_token0).balanceOf(address(this));
        _reserve1 = IERC20(_token1).balanceOf(address(this));
    }

    function _checkPriceImpact(uint256 oldPrice, uint256 newPrice) internal pure {
        uint256 priceChange;
        if (newPrice > oldPrice) {
            priceChange = ((newPrice - oldPrice) * 100) / oldPrice;
        } else {
            priceChange = ((oldPrice - newPrice) * 100) / oldPrice;
        }
        require(priceChange <= MAX_PRICE_IMPACT, "BasePool: PRICE_IMPACT_TOO_HIGH");
    }

    // Abstract functions to be implemented by derived contracts
    function initialize(uint256 amount0) external virtual;
    function addLiquidity(uint256 amount0) external virtual returns (uint256 liquidity);
    function removeLiquidity(uint256 liquidity) external virtual returns (uint256 amount0, uint256 amount1);
    function swap(address tokenIn, uint256 amountIn, address tokenOut) external virtual returns (uint256 amountOut);
    function getRequiredAmount1(uint256 amount0) public view virtual returns (uint256);
}