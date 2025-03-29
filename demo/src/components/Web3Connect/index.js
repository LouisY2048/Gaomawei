import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../../utils/connectors';

const ConnectButton = styled(motion.button)`
  background: ${({ theme }) => theme.colors.primary1};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.duration} ${({ theme }) => theme.transition.timing};

  &:hover {
    background: ${({ theme }) => theme.colors.primary2};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.bg3};
    cursor: not-allowed;
  }
`;

const AccountButton = styled(ConnectButton)`
  background: ${({ theme }) => theme.colors.bg2};
  color: ${({ theme }) => theme.colors.text1};
  border: 1px solid ${({ theme }) => theme.colors.border1};

  &:hover {
    background: ${({ theme }) => theme.colors.bg1};
    border-color: ${({ theme }) => theme.colors.primary1};
  }
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.red1};
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

const Web3Connect = () => {
  const { activate, active, account, deactivate } = useWeb3React();
  const [error, setError] = React.useState('');

  const connect = async () => {
    try {
      await activate(injected);
      setError('');
    } catch (err) {
      console.error('Error connecting:', err);
      setError('Failed to connect wallet');
    }
  };

  const disconnect = () => {
    try {
      deactivate();
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (active && account) {
    return (
      <AccountButton
        onClick={disconnect}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {formatAddress(account)}
      </AccountButton>
    );
  }

  return (
    <>
      <ConnectButton
        onClick={connect}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        Connect Wallet
      </ConnectButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </>
  );
};

export default Web3Connect; 