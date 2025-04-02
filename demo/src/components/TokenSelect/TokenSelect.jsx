import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ChevronDown } from 'react-feather';
import PropTypes from 'prop-types';

// Token icons mapping
const tokenIcons = {
  ALPHA: '../../assets/tokens/alpha.png',
  BETA: '../../assets/tokens/beta.png',
  GAMMA: '../../assets/tokens/gamma.png',
};

// Utility function to get token icon
const getTokenIcon = (symbol) => {
  return tokenIcons[symbol] || '../../assets/tokens/default.png';
};

const TokenSelectContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background: ${({ theme }) => theme.background2};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.background3};
  }
`;

const TokenIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
`;

const TokenSymbol = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.text1};
`;

const TokenBalance = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.text3};
`;

const TokenSelect = React.forwardRef(({ 
  token,
  balance,
  onClick,
  showBalance = true,
  showChevron = true,
  size = 'medium',
  ...props
}, ref) => {
  return (
    <TokenSelectContainer ref={ref} onClick={onClick} {...props}>
      <TokenIcon src={getTokenIcon(token.symbol)} alt={token.symbol} />
      <TokenSymbol>{token.symbol}</TokenSymbol>
      {showBalance && balance && (
        <TokenBalance>{parseFloat(balance).toFixed(4)}</TokenBalance>
      )}
      {showChevron && <ChevronDown size={20} style={{ marginLeft: '8px' }} />}
    </TokenSelectContainer>
  );
});

TokenSelect.propTypes = {
  token: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
  }).isRequired,
  balance: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  showBalance: PropTypes.bool,
  showChevron: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
};

TokenSelect.displayName = 'TokenSelect';

// Token Selection Modal
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background: ${({ theme }) => theme.colors.bg0};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 24px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text1};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text2};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text1};
    background: ${({ theme }) => theme.colors.bg3};
  }
`;

const TokenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TokenItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.bg3};
  }

  ${({ selected, theme }) =>
    selected &&
    `
    background: ${theme.colors.bg3};
  `}
`;

export const TokenSelectModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  tokens,
  selectedToken 
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <ModalContent
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader>
          <ModalTitle>Select Token</ModalTitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>
        <TokenList>
          {tokens.map((token) => (
            <TokenItem
              key={token.address}
              selected={selectedToken?.address === token.address}
              onClick={() => onSelect(token)}
            >
              <TokenIcon src={getTokenIcon(token.symbol)} alt={token.symbol} />
              <TokenSymbol>{token.symbol}</TokenSymbol>
            </TokenItem>
          ))}
        </TokenList>
      </ModalContent>
    </ModalOverlay>
  );
};

TokenSelectModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  tokens: PropTypes.arrayOf(
    PropTypes.shape({
      symbol: PropTypes.string.isRequired,
      address: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedToken: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
  }),
};

export default TokenSelect; 