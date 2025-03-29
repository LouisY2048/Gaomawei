import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'react-bootstrap-icons';
import TokenSelect from './TokenSelect';

const SwapContainer = styled(motion.div)`
  background: ${props => props.theme.colors.foreground};
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: ${props => props.theme.shadows.card};
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
`;

const InputContainer = styled.div`
  background: ${props => props.theme.colors.background};
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 0.5rem;
`;

const InputRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const Input = styled.input`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${props => props.theme.colors.text.primary};
  width: 100%;
  outline: none;

  &::placeholder {
    color: ${props => props.theme.colors.text.tertiary};
  }
`;

const Balance = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const SwapButton = styled(motion.button)`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 1rem;
  width: 100%;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

const ArrowContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  margin: 1rem 0;
  cursor: pointer;
`;

const PriceInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
`;

function SwapForm({ web3, account, tokens, pools, reloadBalances }) {
  const [fromToken, setFromToken] = useState('ALPHA');
  const [toToken, setToToken] = useState('BETA');
  const [amount, setAmount] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('0');
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [priceImpact, setPriceImpact] = useState('0');

  const getPool = () => {
    const poolKey = `${fromToken.toLowerCase()}${toToken.toLowerCase()}`;
    return pools[poolKey];
  };

  const calculateOutput = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setExpectedOutput('0');
      setPriceImpact('0');
      return;
    }

    try {
      const pool = getPool();
      const amountInWei = web3.utils.toWei(amount, 'ether');
      const tokenIn = tokens[fromToken.toLowerCase()].address;
      const tokenOut = tokens[toToken.toLowerCase()].address;
      
      const output = await pool.methods.getAmountOut(tokenIn, amountInWei, tokenOut).call();
      setExpectedOutput(web3.utils.fromWei(output, 'ether'));

      const reserves = await pool.methods.getReserves().call();
      const impact = calculatePriceImpact(amountInWei, reserves[0], reserves[1]);
      setPriceImpact(impact.toFixed(2));
    } catch (error) {
      console.error("Error calculating output:", error);
      setExpectedOutput('0');
      setPriceImpact('0');
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setExpectedOutput('0');
  };

  const handleSwap = async () => {
    try {
      setLoading(true);
      const pool = getPool();
      const amountInWei = web3.utils.toWei(amount, 'ether');
      const tokenIn = tokens[fromToken.toLowerCase()].address;
      const tokenOut = tokens[toToken.toLowerCase()].address;
      
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

  useEffect(() => {
    calculateOutput();
  }, [amount, fromToken, toToken]);

  return (
    <SwapContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <InputContainer>
        <Balance>Balance: {tokens[fromToken.toLowerCase()].balance}</Balance>
        <InputRow>
          <Input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading || approving}
          />
          <TokenSelect token={fromToken} onSelect={() => {}} />
        </InputRow>
      </InputContainer>

      <ArrowContainer
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={switchTokens}
      >
        <ArrowDown size={24} />
      </ArrowContainer>

      <InputContainer>
        <Balance>Balance: {tokens[toToken.toLowerCase()].balance}</Balance>
        <InputRow>
          <Input
            type="text"
            value={expectedOutput}
            disabled
            placeholder="0.0"
          />
          <TokenSelect token={toToken} onSelect={() => {}} />
        </InputRow>
      </InputContainer>

      {parseFloat(priceImpact) > 0 && (
        <PriceInfo>
          <span>Price Impact</span>
          <span className={parseFloat(priceImpact) > 5 ? 'text-danger' : 'text-success'}>
            {priceImpact}%
          </span>
        </PriceInfo>
      )}

      <SwapButton
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSwap}
        disabled={loading || !amount || parseFloat(amount) <= 0}
      >
        {loading ? 'Swapping...' : 'Swap'}
      </SwapButton>
    </SwapContainer>
  );
}

export default SwapForm;