import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Card, Tabs, Tab } from 'react-bootstrap';
import { ArrowDown } from 'react-bootstrap-icons';

function LiquidityForm({ web3, account, alphaToken, betaToken, pool, alphaAddress, betaAddress, reloadBalances }) {
  const [mode, setMode] = useState('add'); // 'add' or 'remove'
  const [alphaAmount, setAlphaAmount] = useState('');
  const [betaAmount, setBetaAmount] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [alphaApproved, setAlphaApproved] = useState(false);
  const [betaApproved, setBetaApproved] = useState(false);
  const [shareOfPool, setShareOfPool] = useState('0');

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
      
      // 计算池子份额
      const totalSupply = await pool.methods.totalSupply().call();
      const newShare = (parseFloat(alphaAmount) / (parseFloat(web3.utils.fromWei(totalSupply, 'ether')) + parseFloat(alphaAmount))) * 100;
      setShareOfPool(newShare.toFixed(2));
    } catch (error) {
      console.error("Error calculating Beta amount:", error);
      setBetaAmount('');
      setShareOfPool('0');
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
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <Tabs 
          activeKey={mode} 
          onSelect={(k) => setMode(k)} 
          className="mb-4"
        >
          <Tab eventKey="add" title="Add Liquidity">
            <div className="liquidity-container">
              {/* Alpha Token Input */}
              <div className="swap-input-container mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Alpha Amount</span>
                  <span className="text-muted">Balance: {balances.alpha}</span>
                </div>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="number"
                    placeholder="0.0"
                    value={alphaAmount}
                    onChange={(e) => setAlphaAmount(e.target.value)}
                    className="border-0 bg-light"
                    disabled={loading || approving}
                  />
                  <div className="ms-3">
                    <Form.Control
                      className="border-0 bg-light"
                      value="ALPHA"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Plus Icon */}
              <div className="text-center my-2">
                <div className="swap-arrow">
                  <ArrowDown size={24} />
                </div>
              </div>

              {/* Beta Token Input */}
              <div className="swap-input-container mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">Beta Amount</span>
                  <span className="text-muted">Balance: {balances.beta}</span>
                </div>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="text"
                    value={betaAmount}
                    className="border-0 bg-light"
                    disabled
                  />
                  <div className="ms-3">
                    <Form.Control
                      className="border-0 bg-light"
                      value="BETA"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Pool Share */}
              {parseFloat(shareOfPool) > 0 && (
                <div className="pool-share mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Pool Share</span>
                    <span className="text-primary">{shareOfPool}%</span>
                  </div>
                </div>
              )}

              {/* Approve Buttons */}
              {alphaAmount && parseFloat(alphaAmount) > 0 && !alphaApproved && (
                <Button 
                  variant="outline-primary" 
                  className="w-100 mb-2" 
                  onClick={() => approveToken('alpha')}
                  disabled={approving}
                >
                  {approving ? (
                    <><Spinner animation="border" size="sm" className="me-2" /> Approving Alpha...</>
                  ) : (
                    'Approve Alpha'
                  )}
                </Button>
              )}
              
              {betaAmount && parseFloat(betaAmount) > 0 && !betaApproved && (
                <Button 
                  variant="outline-primary" 
                  className="w-100 mb-2" 
                  onClick={() => approveToken('beta')}
                  disabled={approving}
                >
                  {approving ? (
                    <><Spinner animation="border" size="sm" className="me-2" /> Approving Beta...</>
                  ) : (
                    'Approve Beta'
                  )}
                </Button>
              )}

              {/* Add Liquidity Button */}
              <Button 
                variant="primary" 
                className="w-100 py-3" 
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
                {loading ? (
                  <><Spinner animation="border" size="sm" className="me-2" /> Adding Liquidity...</>
                ) : (
                  'Add Liquidity'
                )}
              </Button>
            </div>
          </Tab>
          
          <Tab eventKey="remove" title="Remove Liquidity">
            <div className="liquidity-container">
              {/* LP Token Input */}
              <div className="swap-input-container mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted">LP Token Amount</span>
                  <span className="text-muted">Balance: {balances.lp}</span>
                </div>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="number"
                    placeholder="0.0"
                    value={lpAmount}
                    onChange={(e) => setLpAmount(e.target.value)}
                    className="border-0 bg-light"
                    disabled={loading}
                  />
                  <div className="ms-3">
                    <Form.Control
                      className="border-0 bg-light"
                      value="LPT"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Remove Liquidity Button */}
              <Button 
                variant="primary" 
                className="w-100 py-3" 
                onClick={removeLiquidity}
                disabled={loading || !lpAmount || isNaN(lpAmount) || parseFloat(lpAmount) <= 0}
              >
                {loading ? (
                  <><Spinner animation="border" size="sm" className="me-2" /> Removing Liquidity...</>
                ) : (
                  'Remove Liquidity'
                )}
              </Button>
            </div>
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

export default LiquidityForm;