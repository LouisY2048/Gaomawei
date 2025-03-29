import { useState, useCallback } from 'react';
import { useWeb3 } from './useWeb3';
import { POOLS } from '../constants';

export const useSwap = () => {
  const { web3, account, tokens, pools, approveToken, checkAllowance, executeSwap } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 查找合适的交易池
  const findPool = useCallback((tokenInSymbol, tokenOutSymbol) => {
    return Object.values(POOLS).find(pool => 
      (pool.token0.symbol === tokenInSymbol && pool.token1.symbol === tokenOutSymbol) ||
      (pool.token0.symbol === tokenOutSymbol && pool.token1.symbol === tokenInSymbol)
    );
  }, []);

  // 计算输出金额
  const getAmountOut = useCallback(async (tokenInSymbol, amountIn, tokenOutSymbol) => {
    if (!web3 || !pools || !amountIn || amountIn <= 0) return '0';

    try {
      const pool = findPool(tokenInSymbol, tokenOutSymbol);
      if (!pool) throw new Error('No pool found for token pair');

      const poolContract = pools[pool.name].contract;
      const tokenIn = tokens[tokenInSymbol].address;
      const tokenOut = tokens[tokenOutSymbol].address;
      const amountInWei = web3.utils.toWei(amountIn.toString(), 'ether');

      const amountOut = await poolContract.methods
        .getAmountOut(tokenIn, amountInWei, tokenOut)
        .call();

      return web3.utils.fromWei(amountOut, 'ether');
    } catch (error) {
      console.error('Failed to get amount out:', error);
      return '0';
    }
  }, [web3, pools, tokens, findPool]);

  // 计算价格影响
  const getPriceImpact = useCallback(async (tokenInSymbol, amountIn, tokenOutSymbol) => {
    if (!web3 || !pools || !amountIn || amountIn <= 0) return '0';

    try {
      const pool = findPool(tokenInSymbol, tokenOutSymbol);
      if (!pool) throw new Error('No pool found for token pair');

      const poolContract = pools[pool.name].contract;
      const tokenIn = tokens[tokenInSymbol].address;
      const amountInWei = web3.utils.toWei(amountIn.toString(), 'ether');

      const impact = await poolContract.methods
        .calculatePriceImpact(amountInWei, tokenIn)
        .call();

      return web3.utils.fromWei(impact, 'ether');
    } catch (error) {
      console.error('Failed to get price impact:', error);
      return '0';
    }
  }, [web3, pools, tokens, findPool]);

  // 执行交换
  const swap = useCallback(async (
    tokenInSymbol,
    amountIn,
    tokenOutSymbol,
    slippageTolerance = 0.5
  ) => {
    if (!web3 || !account) throw new Error('Web3 not initialized');
    
    setLoading(true);
    setError(null);

    try {
      const pool = findPool(tokenInSymbol, tokenOutSymbol);
      if (!pool) throw new Error('No pool found for token pair');

      const poolContract = pools[pool.name].contract;
      const tokenIn = tokens[tokenInSymbol].address;
      const tokenOut = tokens[tokenOutSymbol].address;

      // 检查授权
      const allowance = await checkAllowance(tokenInSymbol, account, poolContract._address);
      if (parseFloat(allowance) < parseFloat(amountIn)) {
        await approveToken(tokenInSymbol, poolContract._address, amountIn);
      }

      // 计算最小输出金额（考虑滑点）
      const expectedOutput = await getAmountOut(tokenInSymbol, amountIn, tokenOutSymbol);
      const minOutput = (parseFloat(expectedOutput) * (100 - slippageTolerance) / 100).toString();

      // 执行交换
      const tx = await executeSwap(
        pool.name,
        tokenIn,
        amountIn,
        tokenOut,
        minOutput
      );

      return tx;
    } catch (error) {
      console.error('Swap failed:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [web3, account, pools, tokens, findPool, checkAllowance, approveToken, executeSwap, getAmountOut]);

  return {
    loading,
    error,
    getAmountOut,
    getPriceImpact,
    swap,
  };
};

export default useSwap; 