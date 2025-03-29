import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const TokenButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const TokenIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
`;

const TokenSymbol = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const TokenSelect = ({ token, onSelect }) => {
  const getTokenIcon = (symbol) => {
    switch (symbol) {
      case 'ALPHA':
        return '/tokens/alpha.png';
      case 'BETA':
        return '/tokens/beta.png';
      case 'GAMMA':
        return '/tokens/gamma.png';
      default:
        return '/tokens/default.png';
    }
  };

  return (
    <TokenButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
    >
      <TokenIcon src={getTokenIcon(token)} alt={token} />
      <TokenSymbol>{token}</TokenSymbol>
    </TokenButton>
  );
};

export default TokenSelect; 