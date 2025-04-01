import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ChevronDown } from 'react-feather';

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

const TokenSelect = ({ 
  token,
  balance,
  onClick,
  showBalance = true,
  showChevron = true,
  size = 'medium'
}) => {
  return (
    <TokenSelectContainer onClick={onClick}>
      <TokenIcon src={getTokenIcon(token.symbol)} alt={token.symbol} />
      <TokenSymbol>{token.symbol}</TokenSymbol>
      {showBalance && balance && (
        <TokenBalance>{parseFloat(balance).toFixed(4)}</TokenBalance>
      )}
      {showChevron && <ChevronDown size={20} style={{ marginLeft: '8px' }} />}
    </TokenSelectContainer>
  );
};

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

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border1};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: 16px;
  font-size: 16px;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary1};
  }
`;

const TokenList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TokenOption = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: none;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  width: 100%;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.bg1};
    border-color: ${({ theme }) => theme.colors.border1};
  }
`;

export const TokenSelectModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  tokens,
  selectedToken 
}) => {
  const [search, setSearch] = React.useState('');

  const filteredTokens = React.useMemo(() => {
    if (!search) return tokens;
    const searchLower = search.toLowerCase();
    return tokens.filter(token => 
      token.symbol.toLowerCase().includes(searchLower) ||
      token.name.toLowerCase().includes(searchLower)
    );
  }, [tokens, search]);

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
        onClick={e => e.stopPropagation()}
      >
        <ModalHeader>
          <ModalTitle>Select a token</ModalTitle>
          <button onClick={onClose}>×</button>
        </ModalHeader>
        
        <SearchInput
          placeholder="Search by name or paste address"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        <TokenList>
          {filteredTokens.map(token => (
            <TokenOption
              key={token.address}
              onClick={() => {
                onSelect(token);
                onClose();
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <TokenIcon src={getTokenIcon(token.symbol)} alt={token.symbol} />
              <div>
                <TokenSymbol>{token.symbol}</TokenSymbol>
                <TokenBalance>{token.name}</TokenBalance>
              </div>
              {token.balance && (
                <TokenBalance style={{ marginLeft: 'auto' }}>
                  {parseFloat(token.balance).toFixed(4)}
                </TokenBalance>
              )}
            </TokenOption>
          ))}
        </TokenList>
      </ModalContent>
    </ModalOverlay>
  );
};

export default TokenSelect; 