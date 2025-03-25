import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';

function SwapForm({ web3, account, alphaToken, betaToken, pool, alphaAddress, betaAddress, reloadBalances }) {
  const [fromToken, setFromToken] = useState('alpha');
  const [amount, setAmount] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('0');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // 计算预期输出
  const calculateOutput = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setExpectedOutput('0');
      return;
    }

    try {
      const amountInWei = web3.utils.toWei(amount, 'ether');
      const tokenIn = fromToken === 'alpha' ? alphaAddress : betaAddress;
      const tokenOut = fromToken === 'alpha' ? betaAddress : alphaAddress;
      
      const output = await pool.methods.getAmountOut(tokenIn, amountInWei, tokenOut).call();
      setExpectedOutput(web3.utils.fromWei(output, 'ether'));
    } catch (error) {
      console.error("Error calculating output:", error);
      setExpectedOutput('0');
    }
  };

  // 检查代币授权
  const checkAllowance = async () => {
    try {
      const token = fromToken === 'alpha' ? alphaToken : betaToken;
      const allowance = await token.methods.allowance(account, pool._address).call();
      const amountInWei = web3.utils.toWei(amount || '0', 'ether');
      setIsApproved(BigInt(allowance) >= BigInt(amountInWei));
    } catch (error) {
      console.error("Error checking allowance:", error);
      setIsApproved(false);
    }
  };

  // 授权代币
  const approveToken = async () => {
    try {
      setApproving(true);
      const token = fromToken === 'alpha' ? alphaToken : betaToken;
      const amountInWei = web3.utils.toWei(amount, 'ether');
      
      await token.methods.approve(pool._address, amountInWei).send({ from: account });
      setIsApproved(true);
    } catch (error) {
      console.error("Error approving token:", error);
    } finally {
      setApproving(false);
    }
  };

  // 执行交换
  const executeSwap = async () => {
    try {
      setLoading(true);
      const amountInWei = web3.utils.toWei(amount, 'ether');
      const tokenIn = fromToken === 'alpha' ? alphaAddress : betaAddress;
      const tokenOut = fromToken === 'alpha' ? betaAddress : alphaAddress;
      
      await pool.methods.swap(tokenIn, amountInWei, tokenOut).send({ from: account });
      setAmount('');
      setExpectedOutput('0');
      reloadBalances();
    } catch (error) {
      console.error("Error executing swap:", error);
    } finally {
      setLoading(false);
    }
  };

  // 当输入金额或代币选择改变时，计算输出
  useEffect(() => {
    calculateOutput();
    checkAllowance();
  }, [amount, fromToken]);

  return (
    <div>
      <h5 className="text-center mb-3">Swap Tokens</h5>
      
      <Form.Group className="mb-3">
        <Form.Label>From</Form.Label>
        <div className="d-flex">
          <Form.Control
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading || approving}
          />
          <Form.Select
            className="ms-2"
            style={{ width: '120px' }}
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            disabled={loading || approving}
          >
            <option value="alpha">ALPHA</option>
            <option value="beta">BETA</option>
          </Form.Select>
        </div>
      </Form.Group>
      
      <div className="text-center my-2">↓</div>
      
      <Form.Group className="mb-3">
        <Form.Label>To (estimated)</Form.Label>
        <div className="d-flex">
          <Form.Control
            type="text"
            value={expectedOutput}
            disabled
          />
          <Form.Control
            className="ms-2"
            style={{ width: '120px' }}
            value={fromToken === 'alpha' ? 'BETA' : 'ALPHA'}
            disabled
          />
        </div>
      </Form.Group>
      
      {amount && parseFloat(amount) > 0 && !isApproved ? (
        <Button 
          variant="primary" 
          className="w-100 mt-3" 
          onClick={approveToken}
          disabled={approving || !amount || isNaN(amount) || parseFloat(amount) <= 0}
        >
          {approving ? <><Spinner animation="border" size="sm" /> Approving...</> : 'Approve'}
        </Button>
      ) : (
        <Button 
          variant="primary" 
          className="w-100 mt-3" 
          onClick={executeSwap}
          disabled={loading || !amount || isNaN(amount) || parseFloat(amount) <= 0 || !isApproved}
        >
          {loading ? <><Spinner animation="border" size="sm" /> Swapping...</> : 'Swap'}
        </Button>
      )}
    </div>
  );
}

export default SwapForm;