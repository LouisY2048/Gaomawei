import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Tabs, Tab } from 'react-bootstrap';

function LiquidityForm({ web3, account, alphaToken, betaToken, pool, alphaAddress, betaAddress, reloadBalances }) {
  const [mode, setMode] = useState('add'); // 'add' or 'remove'
  const [alphaAmount, setAlphaAmount] = useState('');
  const [betaAmount, setBetaAmount] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [alphaApproved, setAlphaApproved] = useState(false);
  const [betaApproved, setBetaApproved] = useState(false);

  // 计算Beta代币需求量
  const calculateBetaAmount = async () => {
    if (!alphaAmount || isNaN(alphaAmount) || parseFloat(alphaAmount) <= 0) {
      setBetaAmount('');
      return;
    }

    try {
      const amountInWei = web3.utils.toWei(alphaAmount, 'ether');
      const required = await pool.methods.getRequiredAmount1(amountInWei).call();
      setBetaAmount(web3.utils.fromWei(required, 'ether'));
    } catch (error) {
      console.error("Error calculating Beta amount:", error);
      setBetaAmount('');
    }
  };

  // 检查代币授权
  const checkAllowances = async () => {
    if (mode === 'add') {
      try {
        if (alphaAmount && !isNaN(alphaAmount) && parseFloat(alphaAmount) > 0) {
          const alphaAllowance = await alphaToken.methods.allowance(account, pool._address).call();
          const alphaAmountWei = web3.utils.toWei(alphaAmount, 'ether');
          setAlphaApproved(BigInt(alphaAllowance) >= BigInt(alphaAmountWei));
        }
        
        if (betaAmount && !isNaN(betaAmount) && parseFloat(betaAmount) > 0) {
          const betaAllowance = await betaToken.methods.allowance(account, pool._address).call();
          const betaAmountWei = web3.utils.toWei(betaAmount, 'ether');
          setBetaApproved(BigInt(betaAllowance) >= BigInt(betaAmountWei));
        }
      } catch (error) {
        console.error("Error checking allowances:", error);
      }
    }
  };

  // 授权代币
  const approveToken = async (token) => {
    try {
      setApproving(true);
      if (token === 'alpha') {
        const amountInWei = web3.utils.toWei(alphaAmount, 'ether');
        await alphaToken.methods.approve(pool._address, amountInWei).send({ from: account });
        setAlphaApproved(true);
      } else {
        const amountInWei = web3.utils.toWei(betaAmount, 'ether');
        await betaToken.methods.approve(pool._address, amountInWei).send({ from: account });
        setBetaApproved(true);
      }
    } catch (error) {
      console.error(`Error approving ${token}:`, error);
    } finally {
      setApproving(false);
    }
  };

  // 添加流动性
  const addLiquidity = async () => {
    try {
      setLoading(true);
      const amountInWei = web3.utils.toWei(alphaAmount, 'ether');
      await pool.methods.addLiquidity(amountInWei).send({ from: account });
      setAlphaAmount('');
      setBetaAmount('');
      reloadBalances();
    } catch (error) {
      console.error("Error adding liquidity:", error);
    } finally {
      setLoading(false);
    }
  };

  // 移除流动性
  const removeLiquidity = async () => {
    try {
      setLoading(true);
      const amountInWei = web3.utils.toWei(lpAmount, 'ether');
      await pool.methods.removeLiquidity(amountInWei).send({ from: account });
      setLpAmount('');
      reloadBalances();
    } catch (error) {
      console.error("Error removing liquidity:", error);
    } finally {
      setLoading(false);
    }
  };

  // 当Alpha金额或模式改变时，更新计算和检查授权
  useEffect(() => {
    if (mode === 'add') {
      calculateBetaAmount();
    }
    checkAllowances();
  }, [alphaAmount, mode]);

  return (
    <div>
      <h5 className="text-center mb-3">Liquidity Management</h5>
      
      <Tabs 
        activeKey={mode} 
        onSelect={(k) => setMode(k)} 
        className="mb-3"
      >
        <Tab eventKey="add" title="Add Liquidity">
          <Form.Group className="mb-3">
            <Form.Label>Alpha Amount</Form.Label>
            <Form.Control
              type="number"
              placeholder="0.0"
              value={alphaAmount}
              onChange={(e) => setAlphaAmount(e.target.value)}
              disabled={loading || approving}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Beta Amount (calculated)</Form.Label>
            <Form.Control
              type="number"
              placeholder="0.0"
              value={betaAmount}
              disabled
            />
          </Form.Group>
          
          {alphaAmount && parseFloat(alphaAmount) > 0 && !alphaApproved && (
            <Button 
              variant="outline-primary" 
              className="w-100 mb-2" 
              onClick={() => approveToken('alpha')}
              disabled={approving}
            >
              {approving ? <><Spinner animation="border" size="sm" /> Approving Alpha...</> : 'Approve Alpha'}
            </Button>
          )}
          
          {betaAmount && parseFloat(betaAmount) > 0 && !betaApproved && (
            <Button 
              variant="outline-primary" 
              className="w-100 mb-2" 
              onClick={() => approveToken('beta')}
              disabled={approving}
            >
              {approving ? <><Spinner animation="border" size="sm" /> Approving Beta...</> : 'Approve Beta'}
            </Button>
          )}
          
          <Button 
            variant="primary" 
            className="w-100 mt-3" 
            onClick={addLiquidity}
            disabled={
              loading || 
              !alphaAmount || 
              !betaAmount || 
              isNaN(alphaAmount) || 
              isNaN(betaAmount) || 
              parseFloat(alphaAmount) <= 0 || 
              parseFloat(betaAmount) <= 0 || 
              !alphaApproved || 
              !betaApproved
            }
          >
            {loading ? <><Spinner animation="border" size="sm" /> Adding Liquidity...</> : 'Add Liquidity'}
          </Button>
        </Tab>
        
        <Tab eventKey="remove" title="Remove Liquidity">
          <Form.Group className="mb-3">
            <Form.Label>LP Token Amount</Form.Label>
            <Form.Control
              type="number"
              placeholder="0.0"
              value={lpAmount}
              onChange={(e) => setLpAmount(e.target.value)}
              disabled={loading}
            />
          </Form.Group>
          
          <Button 
            variant="primary" 
            className="w-100 mt-3" 
            onClick={removeLiquidity}
            disabled={loading || !lpAmount || isNaN(lpAmount) || parseFloat(lpAmount) <= 0}
          >
            {loading ? <><Spinner animation="border" size="sm" /> Removing Liquidity...</> : 'Remove Liquidity'}
          </Button>
        </Tab>
      </Tabs>
    </div>
  );
}

export default LiquidityForm;