import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import Web3 from 'web3';
import styled from 'styled-components';

// 组件导入
import Header from './components/Header';
import SwapForm from './components/SwapForm';
import LiquidityForm from './components/LiquidityForm';
import ConnectWallet from './components/ConnectWallet';

// 样式和主题导入
import { theme, GlobalStyle } from './styles/theme';
import 'bootstrap/dist/css/bootstrap.min.css';

// 合约导入
import NewTokenABI from './utils/contract-abis.json';
import PoolABI from './utils/contract-abis.json';
import addresses from './contract-addresses.json';

const AppWrapper = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
  padding: 2rem 0;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

function App() {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [tokens, setTokens] = useState({
    alpha: { contract: null, address: '', balance: '0' },
    beta: { contract: null, address: '', balance: '0' },
    gamma: { contract: null, address: '', balance: '0' }
  });
  const [pools, setPools] = useState({
    alphabeta: null,
    betagamma: null,
    gammaalpha: null
  });
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
        
        // 初始化合约
        const alphaContract = new web3Instance.eth.Contract(NewTokenABI.NewToken, addresses.tokens.alpha);
        const betaContract = new web3Instance.eth.Contract(NewTokenABI.NewToken, addresses.tokens.beta);
        const gammaContract = new web3Instance.eth.Contract(NewTokenABI.NewToken, addresses.tokens.gamma);
        
        const poolABContract = new web3Instance.eth.Contract(PoolABI.Pool_AB, addresses.pools.alphaBeta);
        const poolBGContract = new web3Instance.eth.Contract(PoolABI.Pool_BG, addresses.pools.betaGamma);
        const poolGAContract = new web3Instance.eth.Contract(PoolABI.Pool_GA, addresses.pools.gammaAlpha);

        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setTokens({
          alpha: { 
            contract: alphaContract, 
            address: addresses.tokens.alpha,
            balance: '0'
          },
          beta: { 
            contract: betaContract, 
            address: addresses.tokens.beta,
            balance: '0'
          },
          gamma: { 
            contract: gammaContract, 
            address: addresses.tokens.gamma,
            balance: '0'
          }
        });
        setPools({
          alphabeta: poolABContract,
          betagamma: poolBGContract,
          gammaalpha: poolGAContract
        });
        setIsConnected(true);

        await loadBalances(accounts[0], alphaContract, betaContract, gammaContract);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const loadBalances = async (account, alpha, beta, gamma) => {
    try {
      const [alphaBalance, betaBalance, gammaBalance] = await Promise.all([
        alpha.methods.balanceOf(account).call(),
        beta.methods.balanceOf(account).call(),
        gamma.methods.balanceOf(account).call()
      ]);

      setTokens(prev => ({
        alpha: { 
          ...prev.alpha, 
          balance: web3.utils.fromWei(alphaBalance, 'ether')
        },
        beta: { 
          ...prev.beta, 
          balance: web3.utils.fromWei(betaBalance, 'ether')
        },
        gamma: { 
          ...prev.gamma, 
          balance: web3.utils.fromWei(gammaBalance, 'ether')
        }
      }));
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  useEffect(() => {
    if (isConnected && web3 && account) {
      loadBalances(account, tokens.alpha.contract, tokens.beta.contract, tokens.gamma.contract);
    }
  }, [isConnected, web3, account]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <AppWrapper>
          <Header />
          <ContentContainer>
            {!isConnected ? (
              <ConnectWallet onConnect={connectWallet} />
            ) : (
              <Routes>
                <Route path="/" element={
                  <SwapForm 
                    web3={web3}
                    account={account}
                    tokens={tokens}
                    pools={pools}
                    reloadBalances={() => loadBalances(account, tokens.alpha.contract, tokens.beta.contract, tokens.gamma.contract)}
                  />
                } />
                <Route path="/swap" element={
                  <SwapForm 
                    web3={web3}
                    account={account}
                    tokens={tokens}
                    pools={pools}
                    reloadBalances={() => loadBalances(account, tokens.alpha.contract, tokens.beta.contract, tokens.gamma.contract)}
                  />
                } />
                <Route path="/pools" element={
                  <LiquidityForm 
                    web3={web3}
                    account={account}
                    tokens={tokens}
                    pools={pools}
                    reloadBalances={() => loadBalances(account, tokens.alpha.contract, tokens.beta.contract, tokens.gamma.contract)}
                  />
                } />
              </Routes>
            )}
          </ContentContainer>
        </AppWrapper>
      </Router>
    </ThemeProvider>
  );
}

export default App;