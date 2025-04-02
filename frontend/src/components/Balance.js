import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';

function Balance({ balances, poolBalances, account, pool, web3 }) {
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState('0');
  const [contribution, setContribution] = useState('0');

  // 加载奖励和计算贡献度
  const loadRewardsAndContribution = async () => {
    try {
      // 加载奖励
      const reward = await pool.methods.getRewards(account).call();
      setRewards(web3.utils.fromWei(reward, 'ether'));
      
      // 计算贡献度
      const totalSupply = await pool.methods.totalSupply().call();
      const lpBalance = await pool.methods.balanceOf(account).call();
      
      if (totalSupply > 0) {
        // 计算贡献度百分比（保留2位小数）
        const contributionValue = (Number(lpBalance) / Number(totalSupply)) * 100;
        setContribution(contributionValue.toFixed(2));
      } else {
        setContribution('0');
      }
    } catch (error) {
      console.error("Error loading rewards and contribution:", error);
    }
  };

  // 领取奖励
  const claimRewards = async () => {
    try {
      setLoading(true);
      await pool.methods.claimRewards().send({ from: account });
      await loadRewardsAndContribution();
    } catch (error) {
      console.error("Error claiming rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  // 当组件加载时获取奖励和贡献度
  useEffect(() => {
    if (account && pool) {
      loadRewardsAndContribution();
    }
  }, [account, pool]);

  return (
    <div className="mb-3">
      <h5>您的钱包</h5>
      <p className="small text-muted mb-2">
        {account.slice(0, 6)}...{account.slice(-4)}
      </p>
      <div className="d-flex justify-content-between mb-2">
        <span>Alpha 余额:</span>
        <span>{parseFloat(balances.alpha).toFixed(4)} ALPHA</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Beta 余额:</span>
        <span>{parseFloat(balances.beta).toFixed(4)} BETA</span>
      </div>
      <div className="d-flex justify-content-between mb-3">
        <span>LP 代币:</span>
        <span>{parseFloat(balances.lp).toFixed(4)} LPT</span>
      </div>
      
      <h5>流动性信息</h5>
      <div className="d-flex justify-content-between mb-2">
        <span>流动性贡献度:</span>
        <span>{contribution}%</span>
      </div>
      
      <h5>奖励信息</h5>
      <div className="d-flex justify-content-between mb-2">
        <span>可领取奖励:</span>
        <span>{parseFloat(rewards).toFixed(4)} ALPHA</span>
      </div>
      {parseFloat(rewards) > 0 && (
        <Button 
          variant="success" 
          className="w-100 mb-3" 
          onClick={claimRewards}
          disabled={loading}
        >
          {loading ? <><Spinner animation="border" size="sm" /> 领取中...</> : '领取奖励'}
        </Button>
      )}
      
      <h5>池子信息</h5>
      <div className="d-flex justify-content-between mb-2">
        <span>池中 Alpha:</span>
        <span>{parseFloat(poolBalances.alpha).toFixed(4)} ALPHA</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>池中 Beta:</span>
        <span>{parseFloat(poolBalances.beta).toFixed(4)} BETA</span>
      </div>
      {parseFloat(poolBalances.alpha) > 0 && parseFloat(poolBalances.beta) > 0 && (
        <div className="d-flex justify-content-between mb-2">
          <span>当前比率:</span>
          <span>1 ALPHA = {(parseFloat(poolBalances.beta) / parseFloat(poolBalances.alpha)).toFixed(4)} BETA</span>
        </div>
      )}
    </div>
  );
}

export default Balance;