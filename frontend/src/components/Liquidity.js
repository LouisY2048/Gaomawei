import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { ethers } from 'ethers';
import PoolABI from '../utils/contract-abis.json';
import addresses from '../utils/deployed-addresses.json';

function Liquidity() {
  const [account, setAccount] = useState('');
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [key, setKey] = useState('add');

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

  const calculateRequiredAmount1 = async () => {
    if (!amount0) return;

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const poolContract = new ethers.Contract(
        addresses.pool,
        PoolABI.Pool,
        provider
      );

      const amount0In = ethers.utils.parseEther(amount0);
      const requiredAmount1 = await poolContract.getRequiredAmount1(amount0In);
      setAmount1(ethers.utils.formatEther(requiredAmount1));
    } catch (error) {
      setError('计算所需Token1数量失败：' + error.message);
    }
  };

  const handleAddLiquidity = async () => {
    if (!amount0 || !amount1) {
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

      const amount0In = ethers.utils.parseEther(amount0);
      const tx = await poolContract.addLiquidity(amount0In);
      await tx.wait();
      setSuccess('添加流动性成功！');
      setAmount0('');
      setAmount1('');
    } catch (error) {
      setError('添加流动性失败：' + error.message);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!lpAmount) {
      setError('请输入LP代币数量');
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

      const lpAmountIn = ethers.utils.parseEther(lpAmount);
      const tx = await poolContract.removeLiquidity(lpAmountIn);
      await tx.wait();
      setSuccess('移除流动性成功！');
      setLpAmount('');
    } catch (error) {
      setError('移除流动性失败：' + error.message);
    }
  };

  useEffect(() => {
    if (key === 'add') {
      calculateRequiredAmount1();
    }
  }, [amount0, key]);

  return (
    <Card className="shadow">
      <Card.Body>
        <h3 className="text-center mb-4">流动性管理</h3>
        
        {!account ? (
          <Button variant="primary" onClick={connectWallet} className="w-100">
            连接钱包
          </Button>
        ) : (
          <>
            <Tabs
              id="liquidity-tabs"
              activeKey={key}
              onSelect={(k) => setKey(k)}
              className="mb-3"
            >
              <Tab eventKey="add" title="添加流动性">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Token 0 数量</Form.Label>
                    <Form.Control
                      type="number"
                      value={amount0}
                      onChange={(e) => setAmount0(e.target.value)}
                      placeholder="输入Token 0数量"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Token 1 数量</Form.Label>
                    <Form.Control
                      type="number"
                      value={amount1}
                      onChange={(e) => setAmount1(e.target.value)}
                      placeholder="输入Token 1数量"
                    />
                  </Form.Group>

                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}

                  <Button variant="primary" onClick={handleAddLiquidity} className="w-100">
                    添加流动性
                  </Button>
                </Form>
              </Tab>

              <Tab eventKey="remove" title="移除流动性">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>LP代币数量</Form.Label>
                    <Form.Control
                      type="number"
                      value={lpAmount}
                      onChange={(e) => setLpAmount(e.target.value)}
                      placeholder="输入LP代币数量"
                    />
                  </Form.Group>

                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}

                  <Button variant="primary" onClick={handleRemoveLiquidity} className="w-100">
                    移除流动性
                  </Button>
                </Form>
              </Tab>
            </Tabs>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default Liquidity; 