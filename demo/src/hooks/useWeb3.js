import { useState, useEffect, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { TokenABI, PoolABI } from '../constants/abis';
import { TOKENS, POOLS } from '../constants';

export const useWeb3 = () => {
  const { account, library, active } = useWeb3React();
  const [web3, setWeb3] = useState(null);
  const [contracts, setContracts] = useState({});
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Web3 and contracts
  useEffect(() => {
    if (active && library) {
      const web3Instance = new ethers.providers.Web3Provider(library.provider);
      setWeb3(web3Instance);

      // Initialize token contracts
      const tokenContracts = {};
      Object.entries(TOKENS).forEach(([symbol, token]) => {
        tokenContracts[symbol] = new ethers.Contract(token.address, TokenABI, web3Instance.getSigner());
      });

      // Initialize pool contracts
      const poolContracts = {};
      Object.entries(POOLS).forEach(([name, pool]) => {
        poolContracts[name] = new ethers.Contract(pool.address, PoolABI, web3Instance.getSigner());
      });

      setContracts({ tokens: tokenContracts, pools: poolContracts });
    }
  }, [active, library]);

  // Load balances
  const loadBalances = useCallback(async () => {
    if (!account || !contracts.tokens) return;

    try {
      setLoading(true);
      const newBalances = {};

      // Load token balances
      for (const [symbol, contract] of Object.entries(contracts.tokens)) {
        const balance = await contract.balanceOf(account);
        newBalances[symbol] = ethers.utils.formatEther(balance);
      }

      // Load LP token balances
      for (const [name, contract] of Object.entries(contracts.pools)) {
        const balance = await contract.balanceOf(account);
        newBalances[`${name}_LP`] = ethers.utils.formatEther(balance);
      }

      setBalances(newBalances);
      setError(null);
    } catch (err) {
      console.error('Failed to load balances:', err);
      setError('Failed to load balances');
    } finally {
      setLoading(false);
    }
  }, [account, contracts]);

  // Load balances on mount and when account changes
  useEffect(() => {
    if (active) {
      loadBalances();
    }
  }, [active, loadBalances]);

  return {
    web3,
    account,
    contracts,
    balances,
    loading,
    error,
    loadBalances
  };
}; 