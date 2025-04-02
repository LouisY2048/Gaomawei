import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';

function LiquidityForm({ web3, account, alphaToken, betaToken, pool, alphaAddress, betaAddress, reloadBalances }) {
  const [mode, setMode] = useState('add'); // 'add' or 'remove'
  const [alphaAmount, setAlphaAmount] = useState('');
  const [betaAmount, setBetaAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [alphaApproved, setAlphaApproved] = useState(false);
  const [betaApproved, setBetaApproved] = useState(false);
  const [fees, setFees] = useState({ gamma: '0', alpha: '0' });
  const [claimingFees, setClaimingFees] = useState(false);

  // ... existing code ...

  // 获取费用信息
  const getFeesInfo = useCallback(async () => {
    try {
      const totalFees = await pool.methods.totalFeesCollected().call();
      const gammaBalance = await pool.methods.tokenBalances(alphaAddress).call();
      const alphaBalance = await pool.methods.tokenBalances(betaAddress).call();
      
      const totalBalance = BigInt(gammaBalance) + BigInt(alphaBalance);
      if (totalBalance > 0n) {
        const gammaFees = (BigInt(totalFees) * BigInt(gammaBalance)) / totalBalance;
        const alphaFees = BigInt(totalFees) - gammaFees;
        
        setFees({
          gamma: web3.utils.fromWei(gammaFees.toString(), 'ether'),
          alpha: web3.utils.fromWei(alphaFees.toString(), 'ether')
        });
      }
    } catch (error) {
      console.error("Error getting fees info:", error);
    }
  }, [pool, alphaAddress, betaAddress, web3]);

  // 领取费用
  const claimFees = async () => {
    try {
      setClaimingFees(true);
      await pool.methods.distributeFees().send({ from: account });
      await getFeesInfo();
      await reloadBalances();
    } catch (error) {
      console.error("Error claiming fees:", error);
    } finally {
      setClaimingFees(false);
    }
  };

  // 在组件加载时获取费用信息
  useEffect(() => {
    if (pool && account) {
      getFeesInfo();
    }
  }, [pool, account, getFeesInfo]);

  return (
    <LiquidityContainer>
      {/* ... existing code ... */}
      
      {/* 添加费用显示和领取部分 */}
      <FeesSection>
        <h3>流动性提供者费用</h3>
        <FeesInfo>
          <div>
            <span>Gamma代币费用:</span>
            <span>{fees.gamma} GAMMA</span>
          </div>
          <div>
            <span>Alpha代币费用:</span>
            <span>{fees.alpha} ALPHA</span>
          </div>
        </FeesInfo>
        <ClaimButton
          onClick={claimFees}
          disabled={claimingFees || (fees.gamma === '0' && fees.alpha === '0')}
        >
          {claimingFees ? '领取中...' : '领取费用'}
        </ClaimButton>
      </FeesSection>
    </LiquidityContainer>
  );
}

// 添加新的样式组件
const FeesSection = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border-radius: 12px;
  
  h3 {
    margin-bottom: 15px;
    color: ${({ theme }) => theme.colors.text};
  }
`;

const FeesInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
  
  div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const ClaimButton = styled.button`
  width: 100%;
  padding: 10px;
  background: ${({ theme, disabled }) => disabled ? theme.colors.disabled : theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
  
  &:hover {
    background: ${({ theme, disabled }) => disabled ? theme.colors.disabled : theme.colors.primaryBright};
  }
`;

export default LiquidityForm; 