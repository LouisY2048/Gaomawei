import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';

// Import contract addresses
import CONTRACT_ADDRESSES from '../contracts/contract-addresses.json';

// Import your contract ABIs
import FACTORY_ABI from '../contracts/Factory.json';
import POOL_ABI from '../contracts/Pool.json';
import ERC20_ABI from '../contracts/ERC20.json';

// Helper function to format balance
const formatBalance = (balance, decimals = 18) => {
  try {
    return parseFloat(ethers.utils.formatUnits(balance, decimals)).toFixed(6);
  } catch (error) {
    console.error('Error formatting balance:', error);
    return '0.00';
  }
};

export const usePools = () => {
  const { web3, account, isConnected } = useWeb3();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPools = useCallback(async () => {
    if (!web3 || !isConnected) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all pools from contract-addresses.json
      const poolEntries = Object.entries(CONTRACT_ADDRESSES.pools);
      
      // Get details for each pool
      const poolsData = await Promise.all(
        poolEntries.map(async ([poolName, address]) => {
          try {
            const pool = new ethers.Contract(address, POOL_ABI, web3);
            
            // Get token addresses
            const [token0Address, token1Address] = await Promise.all([
              pool.token0(),
              pool.token1()
            ]);

            // Get token contracts
            const token0 = new ethers.Contract(token0Address, ERC20_ABI, web3);
            const token1 = new ethers.Contract(token1Address, ERC20_ABI, web3);

            // Get token details
            const [
              token0Symbol,
              token1Symbol,
              token0Decimals,
              token1Decimals,
              reserve0,
              reserve1
            ] = await Promise.all([
              token0.symbol(),
              token1.symbol(),
              token0.decimals(),
              token1.decimals(),
              pool.reserve0(),
              pool.reserve1()
            ]);

            return {
              name: poolName,
              address,
              token0: {
                address: token0Address,
                symbol: token0Symbol,
                decimals: token0Decimals,
                reserve: formatBalance(reserve0, token0Decimals)
              },
              token1: {
                address: token1Address,
                symbol: token1Symbol,
                decimals: token1Decimals,
                reserve: formatBalance(reserve1, token1Decimals)
              }
            };
          } catch (err) {
            console.error(`Error loading pool ${poolName}:`, err);
            return null;
          }
        })
      );

      // Filter out failed pools
      const validPools = poolsData.filter(pool => pool !== null);
      setPools(validPools);

      if (validPools.length === 0) {
        setError('No valid pools found');
      }
    } catch (err) {
      console.error('Error loading pools:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [web3, isConnected]);

  useEffect(() => {
    if (isConnected) {
      loadPools();
    }
  }, [isConnected, loadPools]);

  const createPool = async (token0Address, token1Address, fee) => {
    if (!web3 || !account || !isConnected) {
      throw new Error('Please connect your wallet');
    }

    try {
      const signer = web3.getSigner();
      const factory = new ethers.Contract(
        CONTRACT_ADDRESSES.factory,
        FACTORY_ABI,
        signer
      );

      const tx = await factory.createPool(token0Address, token1Address, fee);
      await tx.wait();
      await loadPools();
    } catch (err) {
      console.error('Error creating pool:', err);
      throw err;
    }
  };

  const addLiquidity = async (poolAddress, amount0, amount1) => {
    if (!web3 || !account || !isConnected) {
      throw new Error('Please connect your wallet');
    }

    try {
      const signer = web3.getSigner();
      const pool = new ethers.Contract(poolAddress, POOL_ABI, signer);

      const tx = await pool.addLiquidity(amount0, amount1);
      await tx.wait();
      await loadPools();
    } catch (err) {
      console.error('Error adding liquidity:', err);
      throw err;
    }
  };

  const removeLiquidity = async (poolAddress, liquidity) => {
    if (!web3 || !account || !isConnected) {
      throw new Error('Please connect your wallet');
    }

    try {
      const signer = web3.getSigner();
      const pool = new ethers.Contract(poolAddress, POOL_ABI, signer);

      const tx = await pool.removeLiquidity(liquidity);
      await tx.wait();
      await loadPools();
    } catch (err) {
      console.error('Error removing liquidity:', err);
      throw err;
    }
  };

  return {
    pools,
    loading,
    error,
    createPool,
    addLiquidity,
    removeLiquidity,
    refreshPools: loadPools
  };
}; 