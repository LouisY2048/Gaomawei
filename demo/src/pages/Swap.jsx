import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ArrowDown, Settings } from 'react-feather';
import Card from '../components/Card/Card.jsx';
import Button from '../components/Button/Button.jsx';
import { Web3Connect } from '../components/Web3Connect/Web3Connect.jsx';
import Navigation from '../components/Navigation/Navigation.jsx';
import SettingsModal from '../components/Settings/SettingsModal.jsx';
import TokenSelect from '../components/TokenSelect/TokenSelect.jsx';
import { useWeb3 } from '../hooks/useWeb3.js';
import { theme } from '../styles/theme.js';

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  padding-top: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  padding: 0 24px;
  background: ${({ theme }) => theme.colors.bg1};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 600;
  background: ${({ theme }) => theme.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const SwapCard = styled(Card)`
  width: 100%;
  max-width: 480px;
  padding: 24px;
  margin-top: 24px;
`;

const SwapHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const SwapTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text1};
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text2};
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text1};
    background: ${({ theme }) => theme.colors.bg3};
  }
`;

const TokenInput = styled.div`
  background: ${({ theme }) => theme.colors.bg3};
  border-radius: 12px;
  padding: 16px;
  margin: 8px 0;
`;

const InputRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const AmountInput = styled.input`
  background: transparent;
  border: none;
  font-size: 28px;
  width: 100%;
  margin-right: 12px;
  color: ${({ theme }) => theme.colors.text1};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text3};
  }
`;

const SwapArrow = styled.button`
  width: 32px;
  height: 32px;
  background: ${({ theme }) => theme.colors.bg2};
  border: 4px solid ${({ theme }) => theme.colors.bg1};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px auto;
  cursor: pointer;
  transition: all 0.2s;
  color: ${({ theme }) => theme.colors.text2};

  &:hover {
    transform: rotate(180deg);
    color: ${({ theme }) => theme.colors.text1};
  }
`;

const PriceInfo = styled.div`
  padding: 12px;
  margin-top: 16px;
  border-radius: 12px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text2};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${({ theme }) => theme.colors.bg3};
`;

const Swap = () => {
  const [amount, setAmount] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tokenOrder, setTokenOrder] = useState('ETH_TOKEN');
  const { account, isActive } = useWeb3();

  const handleSwapTokens = () => {
    setTokenOrder(tokenOrder === 'ETH_TOKEN' ? 'TOKEN_ETH' : 'ETH_TOKEN');
  };

  return (
    <PageWrapper>
      <Nav>
        <Logo>Gaomawei DEX</Logo>
        <Navigation />
        <Web3Connect />
      </Nav>

      <SwapCard>
        <SwapHeader>
          <SwapTitle>Swap Tokens</SwapTitle>
          <SettingsButton onClick={() => setShowSettings(true)}>
            <Settings size={20} />
          </SettingsButton>
        </SwapHeader>

        <TokenInput>
          <InputRow>
            <AmountInput
              type="text"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <TokenSelect
              token={tokenOrder === 'ETH_TOKEN' ? 'ETH' : 'TOKEN'}
              onSelect={() => {}}
            />
          </InputRow>
          <div style={{ fontSize: '14px', color: theme.colors.text2 }}>
            ≈ $0.00
          </div>
        </TokenInput>

        <SwapArrow onClick={handleSwapTokens}>
          <ArrowDown size={20} />
        </SwapArrow>

        <TokenInput>
          <InputRow>
            <AmountInput
              type="text"
              placeholder="0.0"
              disabled
            />
            <TokenSelect
              token={tokenOrder === 'ETH_TOKEN' ? 'TOKEN' : 'ETH'}
              onSelect={() => {}}
            />
          </InputRow>
          <div style={{ fontSize: '14px', color: theme.colors.text2 }}>
            ≈ $0.00
          </div>
        </TokenInput>

        <PriceInfo>
          <span>Expected Price</span>
          <span>1 ETH = 1000 TOKEN</span>
        </PriceInfo>

        <Button
          fullWidth
          disabled={!isActive}
          onClick={() => {}}
          style={{ marginTop: '16px' }}
        >
          {!isActive ? 'Connect Wallet' : 'Swap'}
        </Button>
      </SwapCard>

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </PageWrapper>
  );
};

export default Swap; 