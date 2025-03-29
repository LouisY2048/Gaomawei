import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ArrowDown, Settings } from 'react-feather';
import Card from '../components/Card';
import TokenSelect from '../components/TokenSelect';
import Button from '../components/Button';
import { useWeb3 } from '../hooks/useWeb3';
import { useSwap } from '../hooks/useSwap';
import { TOKENS } from '../constants';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
`;

const SwapCard = styled(Card)`
  width: 100%;
  padding: 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text1};
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text2};
  
  &:hover {
    color: ${({ theme }) => theme.colors.text1};
  }
`;

const InputWrapper = styled.div`
  background: ${({ theme }) => theme.colors.bg2};
  border-radius: 20px;
  padding: 1rem;
  margin-bottom: 4px;
`;

const InputHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const InputLabel = styled.span`
  color: ${({ theme }) => theme.colors.text2};
  font-size: 14px;
`;

const MaxButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary1};
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Input = styled.input`
  width: 100%;
  background: none;
  border: none;
  font-size: 28px;
  color: ${({ theme }) => theme.colors.text1};
  outline: none;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text3};
  }
`;

const SwapButton = styled(Button)`
  margin: 4px 0;
  height: 56px;
  font-size: 20px;
`;

const ArrowButton = styled.button`
  background: ${({ theme }) => theme.colors.bg3};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.colors.bg1};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -14px auto;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text2};
  position: relative;
  z-index: 2;
  
  &:hover {
    background: ${({ theme }) => theme.colors.bg4};
  }
`;

const SwapInfo = styled.div`
  margin-top: 1rem;
  padding: 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.bg2};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text2};
  margin: 4px 0;
`;

const Swap = () => {
  const [tokenFrom, setTokenFrom] = useState(TOKENS.ALPHA);
  const [tokenTo, setTokenTo] = useState(TOKENS.BETA);
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  
  const { account, balances } = useWeb3();
  const { getAmountOut, getPriceImpact, swap, loading, error } = useSwap();

  useEffect(() => {
    if (amountFrom && tokenFrom && tokenTo) {
      const amount = getAmountOut(tokenFrom.symbol, tokenTo.symbol, amountFrom);
      setAmountTo(amount || '');
    }
  }, [amountFrom, tokenFrom, tokenTo]);

  const handleSwitch = () => {
    setTokenFrom(tokenTo);
    setTokenTo(tokenFrom);
    setAmountFrom(amountTo);
    setAmountTo(amountFrom);
  };

  const handleMax = () => {
    if (tokenFrom && balances[tokenFrom.symbol]) {
      setAmountFrom(balances[tokenFrom.symbol]);
    }
  };

  const handleSwap = async () => {
    if (!account) return;
    
    try {
      await swap(tokenFrom.symbol, tokenTo.symbol, amountFrom);
      setAmountFrom('');
      setAmountTo('');
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  const priceImpact = getPriceImpact(tokenFrom.symbol, tokenTo.symbol, amountFrom);
  const rate = amountFrom && amountTo 
    ? `1 ${tokenFrom.symbol} = ${(Number(amountTo) / Number(amountFrom)).toFixed(6)} ${tokenTo.symbol}`
    : '';

  return (
    <PageContainer>
      <SwapCard>
        <Header>
          <Title>Swap</Title>
          <SettingsButton>
            <Settings size={20} />
          </SettingsButton>
        </Header>

        <InputWrapper>
          <InputHeader>
            <InputLabel>From</InputLabel>
            {account && (
              <MaxButton onClick={handleMax}>
                Balance: {balances[tokenFrom.symbol] || '0.00'}
              </MaxButton>
            )}
          </InputHeader>
          <Input
            type="number"
            value={amountFrom}
            onChange={(e) => setAmountFrom(e.target.value)}
            placeholder="0.0"
          />
          <TokenSelect
            token={tokenFrom}
            onClick={() => {/* Open token select modal */}}
          />
        </InputWrapper>

        <ArrowButton onClick={handleSwitch}>
          <ArrowDown size={16} />
        </ArrowButton>

        <InputWrapper>
          <InputHeader>
            <InputLabel>To</InputLabel>
            {account && (
              <InputLabel>
                Balance: {balances[tokenTo.symbol] || '0.00'}
              </InputLabel>
            )}
          </InputHeader>
          <Input
            type="number"
            value={amountTo}
            onChange={(e) => setAmountTo(e.target.value)}
            placeholder="0.0"
            disabled
          />
          <TokenSelect
            token={tokenTo}
            onClick={() => {/* Open token select modal */}}
          />
        </InputWrapper>

        {rate && (
          <SwapInfo>
            <InfoRow>
              <span>Rate</span>
              <span>{rate}</span>
            </InfoRow>
            <InfoRow>
              <span>Price Impact</span>
              <span>{priceImpact}%</span>
            </InfoRow>
          </SwapInfo>
        )}

        <SwapButton
          onClick={handleSwap}
          disabled={!account || !amountFrom || !amountTo || loading}
          loading={loading}
        >
          {!account 
            ? 'Connect Wallet'
            : loading 
              ? 'Swapping...'
              : error
                ? error
                : 'Swap'}
        </SwapButton>
      </SwapCard>
    </PageContainer>
  );
};

export default Swap; 