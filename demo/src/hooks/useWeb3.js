import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Web3ReactProvider, useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { ethers } from 'ethers';
import { TokenABI, PoolABI } from '../constants/abis';
import { TOKENS, POOLS } from '../constants';

const Web3Context = createContext(null);

// 配置支持的链ID，包括本地测试网
const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 31337], // 31337 是本地 Hardhat 网络的链ID
});

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

const Web3ContextProvider = ({ children }) => {
  const { account, library, active, activate, deactivate } = useWeb3React();
  const [web3, setWeb3] = useState(null);
  const [contracts, setContracts] = useState({});
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 连接钱包
  const connect = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect wallet');
    }
  };

  // 断开连接
  const disconnect = async () => {
    try {
      await deactivate();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      setError('Failed to disconnect wallet');
    }
  };

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

  const value = {
    web3,
    account,
    contracts,
    balances,
    loading,
    error,
    loadBalances,
    connect,
    disconnect,
    isConnected: active
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Function to get Ethereum provider
const getLibrary = (provider) => {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 12000; // 12 seconds
  return library;
};

// Main Web3Provider component
export const Web3Provider = ({ children }) => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ContextProvider>
        {children}
      </Web3ContextProvider>
    </Web3ReactProvider>
  );
}; 