import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Web3 from 'web3';
import { ethers } from 'ethers';

// 组件导入
import Header from './components/Header';
import ConnectWallet from './components/ConnectWallet';
import SwapForm from './components/SwapForm';
import LiquidityForm from './components/LiquidityForm';
import Balance from './components/Balance';

// 合约ABI导入
import NewTokenABI from './utils/contract-abis.json';
import PoolABI from './utils/contract-abis.json';
import addresses from './utils/deployed-addresses.json';

function App() {
  // 状态变量
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [alphaToken, setAlphaToken] = useState(null);
  const [betaToken, setBetaToken] = useState(null);
  const [pool, setPool] = useState(null);
  const [balances, setBalances] = useState({
    alpha: '0',
    beta: '0',
    lp: '0'
  });
  const [poolBalances, setPoolBalances] = useState({
    alpha: '0',
    beta: '0'
  });
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('swap');

  // 合约地址 - 从导入的地址文件中获取
  const ALPHA_ADDRESS = addresses.token0;
  const BETA_ADDRESS = addresses.token1;
  const POOL_ADDRESS = addresses.pool;

  // 连接钱包
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
        
        // 初始化合约
        const alphaContract = new web3Instance.eth.Contract(NewTokenABI.NewToken, ALPHA_ADDRESS);
        const betaContract = new web3Instance.eth.Contract(NewTokenABI.NewToken, BETA_ADDRESS);
        const poolContract = new web3Instance.eth.Contract(PoolABI.Pool, POOL_ADDRESS);
        
        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setAlphaToken(alphaContract);
        setBetaToken(betaContract);
        setPool(poolContract);
        setIsConnected(true);
        
        // 加载余额
        await loadBalances(accounts[0], alphaContract, betaContract, poolContract);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // 加载余额
  const loadBalances = async (account, alpha, beta, pool) => {
    try {
      const alphaBalance = await alpha.methods.balanceOf(account).call();
      const betaBalance = await beta.methods.balanceOf(account).call();
      const lpBalance = await pool.methods.balanceOf(account).call();
      
      const poolAlphaBalance = await alpha.methods.balanceOf(POOL_ADDRESS).call();
      const poolBetaBalance = await beta.methods.balanceOf(POOL_ADDRESS).call();
      
      setBalances({
        alpha: web3.utils.fromWei(alphaBalance, 'ether'),
        beta: web3.utils.fromWei(betaBalance, 'ether'),
        lp: web3.utils.fromWei(lpBalance, 'ether')
      });
      
      setPoolBalances({
        alpha: web3.utils.fromWei(poolAlphaBalance, 'ether'),
        beta: web3.utils.fromWei(poolBetaBalance, 'ether')
      });
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  };

  // 若连接状态改变，重新加载余额
  useEffect(() => {
    if (isConnected && account && alphaToken && betaToken && pool) {
      loadBalances(account, alphaToken, betaToken, pool);
    }
  }, [isConnected, account]);

  return (
    <Container fluid>
      <Header />
      <Row className="mt-4">
        <Col md={4} className="mx-auto">
          <Card className="shadow">
            <Card.Body>
              {!isConnected ? (
                <ConnectWallet onConnect={connectWallet} />
              ) : (
                <>
                  <Balance 
                    balances={balances} 
                    poolBalances={poolBalances} 
                    account={account} 
                  />
                  <div className="d-flex justify-content-center mt-3 mb-3">
                    <button 
                      className={`btn ${activeTab === 'swap' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                      onClick={() => setActiveTab('swap')}
                    >
                      Swap
                    </button>
                    <button 
                      className={`btn ${activeTab === 'liquidity' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setActiveTab('liquidity')}
                    >
                      Liquidity
                    </button>
                  </div>
                  
                  {activeTab === 'swap' ? (
                    <SwapForm 
                      web3={web3}
                      account={account}
                      alphaToken={alphaToken}
                      betaToken={betaToken}
                      pool={pool}
                      alphaAddress={ALPHA_ADDRESS}
                      betaAddress={BETA_ADDRESS}
                      reloadBalances={() => loadBalances(account, alphaToken, betaToken, pool)}
                    />
                  ) : (
                    <LiquidityForm 
                      web3={web3}
                      account={account}
                      alphaToken={alphaToken}
                      betaToken={betaToken}
                      pool={pool}
                      alphaAddress={ALPHA_ADDRESS}
                      betaAddress={BETA_ADDRESS}
                      reloadBalances={() => loadBalances(account, alphaToken, betaToken, pool)}
                    />
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;