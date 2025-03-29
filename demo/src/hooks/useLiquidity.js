import { useState, useCallback } from 'react';
import { useWeb3 } from './useWeb3';
import { POOLS } from '../constants';

export const useLiquidity = () => {
  const { web3, account, tokens, pools, approveToken, checkAllowance } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 查找池子
  const findPool = useCallback((token0Symbol, token1Symbol) => {
    return Object.values(POOLS).find(pool => 
      (pool.token0.symbol === token0Symbol && pool.token1.symbol === token1Symbol) ||
      (pool.token0.symbol === token1Symbol && pool.token1.symbol === token0Symbol)
    );
  }, []);

  // 计算所需的第二个代币数量
  const getRequiredAmount = useCallback(async (token0Symbol, amount0, token1Symbol) => {
    if (!web3 || !pools || !amount0 || amount0 <= 0) return '0';

    try {
      const pool = findPool(token0Symbol, token1Symbol);
      if (!pool) throw new Error('No pool found for token pair');

      const poolContract = pools[pool.name].contract;
      const amount0Wei = web3.utils.toWei(amount0.toString(), 'ether');

      const required = await poolContract.methods
        .getRequiredAmount1(amount0Wei)
        .call();

      return web3.utils.fromWei(required, 'ether');
    } catch (error) {
      console.error('Failed to get required amount:', error);
      return '0';
    }
  }, [web3, pools, findPool]);

  // 添加流动性
  const addLiquidity = useCallback(async (
    token0Symbol,
    amount0,
    token1Symbol,
    amount1
  ) => {
    if (!web3 || !account) throw new Error('Web3 not initialized');
    
    setLoading(true);
    setError(null);

    try {
      const pool = findPool(token0Symbol, token1Symbol);
      if (!pool) throw new Error('No pool found for token pair');

      const poolContract = pools[pool.name].contract;

      // 检查两个代币的授权
      const allowance0 = await checkAllowance(token0Symbol, account, poolContract._address);
      const allowance1 = await checkAllowance(token1Symbol, account, poolContract._address);

      if (parseFloat(allowance0) < parseFloat(amount0)) {
        await approveToken(token0Symbol, poolContract._address, amount0);
      }
      if (parseFloat(allowance1) < parseFloat(amount1)) {
        await approveToken(token1Symbol, poolContract._address, amount1);
      }

      // 添加流动性
      const amount0Wei = web3.utils.toWei(amount0.toString(), 'ether');
      const tx = await poolContract.methods
        .addLiquidity(amount0Wei)
        .send({ from: account });

      return tx;
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [web3, account, pools, findPool, checkAllowance, approveToken]);

  // 移除流动性
  const removeLiquidity = useCallback(async (
    token0Symbol,
    token1Symbol,
    lpAmount
  ) => {
    if (!web3 || !account) throw new Error('Web3 not initialized');
    
    setLoading(true);
    setError(null);

    try {
      const pool = findPool(token0Symbol, token1Symbol);
      if (!pool) throw new Error('No pool found for token pair');

      const poolContract = pools[pool.name].contract;
      const lpAmountWei = web3.utils.toWei(lpAmount.toString(), 'ether');

      const tx = await poolContract.methods
        .removeLiquidity(lpAmountWei)
        .send({ from: account });

      return tx;
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [web3, account, pools, findPool]);

  // 获取池子份额
  const getPoolShare = useCallback(async (token0Symbol, token1Symbol) => {
    if (!web3 || !account || !pools) return '0';

    try {
      const pool = findPool(token0Symbol, token1Symbol);
      if (!pool) throw new Error('No pool found for token pair');

      const poolContract = pools[pool.name].contract;
      const totalSupply = await poolContract.methods.totalSupply().call();
      const userBalance = await poolContract.methods.balanceOf(account).call();

      if (totalSupply === '0') return '0';
      return (parseFloat(userBalance) / parseFloat(totalSupply) * 100).toFixed(2);
    } catch (error) {
      console.error('Failed to get pool share:', error);
      return '0';
    }
  }, [web3, account, pools, findPool]);

  return {
    loading,
    error,
    getRequiredAmount,
    addLiquidity,
    removeLiquidity,
    getPoolShare,
  };
};

export default useLiquidity; 