import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { ethers } from 'ethers';
import PoolABI from '../utils/contract-abis.json';
import addresses from '../utils/deployed-addresses.json';

function Swap() {
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [fromToken, setFromToken] = useState(addresses.token0);
  const [toToken, setToToken] = useState(addresses.token1);
  const [amountOut, setAmountOut] = useState('0');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
      } catch (error) {
        setError('连接钱包失败：' + error.message);
      }
    } else {
      setError('请安装 MetaMask!');
    }
  };

  const calculateAmountOut = async () => {
    if (!amount || !fromToken || !toToken) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const poolContract = new ethers.Contract(
        addresses.pool,
        PoolABI.Pool,
        provider
      );

      const amountIn = ethers.utils.parseEther(amount);
      const amountOut = await poolContract.getAmountOut(fromToken, amountIn, toToken);
      setAmountOut(ethers.utils.formatEther(amountOut));
    } catch (error) {
      setError('计算输出金额失败：' + error.message);
    }
  };

  const handleSwap = async () => {
    if (!amount || !fromToken || !toToken) {
      setError('请填写完整信息');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const poolContract = new ethers.Contract(
        addresses.pool,
        PoolABI.Pool,
        signer
      );

      const amountIn = ethers.utils.parseEther(amount);
      const tx = await poolContract.swap(fromToken, amountIn, toToken);
      await tx.wait();
      setSuccess('交换成功！');
      setAmount('');
      setAmountOut('0');
    } catch (error) {
      setError('交换失败：' + error.message);
    }
  };

  useEffect(() => {
    calculateAmountOut();
  }, [amount, fromToken, toToken]);

  return (
    <Card className="shadow">
      <Card.Body>
        <h3 className="text-center mb-4">代币交换</h3>
        
        {!account ? (
          <Button variant="primary" onClick={connectWallet} className="w-100">
            连接钱包
          </Button>
        ) : (
          <>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>从</Form.Label>
                <Form.Select value={fromToken} onChange={(e) => setFromToken(e.target.value)}>
                  <option value={addresses.token0}>Token 0</option>
                  <option value={addresses.token1}>Token 1</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>输入数量</Form.Label>
                <Form.Control
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="输入数量"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>到</Form.Label>
                <Form.Select value={toToken} onChange={(e) => setToToken(e.target.value)}>
                  <option value={addresses.token0}>Token 0</option>
                  <option value={addresses.token1}>Token 1</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>预计输出</Form.Label>
                <Form.Control
                  type="text"
                  value={amountOut}
                  readOnly
                  placeholder="预计输出数量"
                />
              </Form.Group>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Button variant="primary" onClick={handleSwap} className="w-100">
                交换
              </Button>
            </Form>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default Swap; 