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
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error formatting balance:', error);
    return '0.00';
  }
};

// Helper function to get token addresses and pool type based on pool name
const getPoolInfo = (poolName) => {
  const tokens = CONTRACT_ADDRESSES.tokens;
  switch (poolName) {
    case 'alphaBeta':
      return {
        type: 'AB',
        token0: { address: tokens.alpha, name: 'alpha' },
        token1: { address: tokens.beta, name: 'beta' }
      };
    case 'betaGamma':
      return {
        type: 'BG',
        token0: { address: tokens.beta, name: 'beta' },
        token1: { address: tokens.gamma, name: 'gamma' }
      };
    case 'gammaAlpha':
      return {
        type: 'GA',
        token0: { address: tokens.gamma, name: 'gamma' },
        token1: { address: tokens.alpha, name: 'alpha' }
      };
    default:
      throw new Error(`Unknown pool name: ${poolName}`);
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
      const poolAddresses = CONTRACT_ADDRESSES.pools;
      
      // Get details for each pool
      const poolsData = await Promise.all(
        Object.entries(poolAddresses).map(async ([poolName, address]) => {
          try {
            console.log(`Loading pool ${poolName} at address ${address}`);
            
            // Get pool info based on pool name
            const poolInfo = getPoolInfo(poolName);
            
            // Create contract instances
            const pool = new ethers.Contract(address, POOL_ABI.abi, web3);
            
            // Create token contracts
            const token0Contract = new ethers.Contract(poolInfo.token0.address, ERC20_ABI.abi, web3);
            const token1Contract = new ethers.Contract(poolInfo.token1.address, ERC20_ABI.abi, web3);

            // Get token details and reserves
            const [
              token0Symbol,
              token1Symbol,
              token0Decimals,
              token1Decimals,
              reserves
            ] = await Promise.all([
              token0Contract.symbol(),
              token1Contract.symbol(),
              token0Contract.decimals(),
              token1Contract.decimals(),
              pool.getReserves()
            ]);

            console.log(`Pool ${poolName} reserves:`, {
              [`reserve${poolInfo.token0.name}`]: reserves[0].toString(),
              [`reserve${poolInfo.token1.name}`]: reserves[1].toString()
            });

            return {
              name: poolName,
              address,
              type: poolInfo.type,
              token0: {
                address: poolInfo.token0.address,
                symbol: token0Symbol,
                decimals: token0Decimals,
                reserve: formatBalance(reserves[0], token0Decimals)
              },
              token1: {
                address: poolInfo.token1.address,
                symbol: token1Symbol,
                decimals: token1Decimals,
                reserve: formatBalance(reserves[1], token1Decimals)
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
      console.log('Valid pools loaded:', validPools);
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
        FACTORY_ABI.abi,
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

  const addLiquidity = async (poolAddress, amount0) => {
    if (!web3 || !account || !isConnected) {
      throw new Error('Please connect your wallet');
    }

    try {
      const signer = web3.getSigner();
      const pool = new ethers.Contract(poolAddress, POOL_ABI.abi, signer);

      const tx = await pool.addLiquidity(amount0);
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
      const pool = new ethers.Contract(poolAddress, POOL_ABI.abi, signer);

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