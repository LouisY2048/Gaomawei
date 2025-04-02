import React, { useState } from 'react';
import styled from 'styled-components';
import { useWeb3 } from '../../hooks/useWeb3';
import { usePools } from '../../hooks/usePools';
import { Plus, Search, RefreshCw, AlertCircle } from 'react-feather';
import PropTypes from 'prop-types';
import Card from '../Card/Card';
import Button from '../Button/Button';
import CreatePoolModal from './CreatePoolModal';

const PoolsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.h1.size};
  color: ${({ theme }) => theme.colors.text1};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.bg2};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 8px 16px;
  width: 300px;
  margin-bottom: 24px;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text1};
  font-size: ${({ theme }) => theme.typography.body.size};
  width: 100%;
  margin-left: 8px;
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text3};
  }
`;

const PoolList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const PoolCard = styled(Card)`
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const PoolHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const TokenPair = styled.div`
  display: flex;
  align-items: center;
`;

const TokenIcon = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  background: ${({ theme }) => theme.colors.bg3};
  padding: 4px;

  &:nth-child(2) {
    margin-left: -12px;
  }
`;

const TokenSymbol = styled.span`
  font-size: ${({ theme }) => theme.typography.body.size};
  color: ${({ theme }) => theme.colors.text1};
  font-weight: 500;
  margin-left: 4px;
`;

const PoolReserves = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${({ theme }) => theme.colors.bg2};
  padding: 12px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
`;

const ReserveItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ theme }) => theme.typography.body.size};
  color: ${({ theme }) => theme.colors.text1};
`;

const ReserveLabel = styled.span`
  color: ${({ theme }) => theme.colors.text2};
`;

const ReserveValue = styled.span`
  font-weight: 500;
`;

const Message = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: ${({ theme, error }) => error ? theme.colors.error : theme.colors.text2};
  background: ${({ theme }) => theme.colors.bg2};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  text-align: center;
`;

const LoadingSpinner = styled(RefreshCw)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ConnectButton = styled(Button)`
  margin-left: auto;
`;

const Pools = () => {
  const { account, isConnected, connect, disconnect } = useWeb3();
  const { pools, loading, error, createPool, refreshPools } = usePools();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatePoolModalOpen, setIsCreatePoolModalOpen] = useState(false);

  const handleCreatePool = async (token0Address, token1Address, fee) => {
    try {
      await createPool(token0Address, token1Address, fee);
      setIsCreatePoolModalOpen(false);
    } catch (error) {
      console.error('Error creating pool:', error);
      // TODO: Show error message to user
    }
  };

  const filteredPools = pools.filter(pool => 
    pool.token0.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.token1.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PoolsContainer>
      <Header>
        <Title>Pools</Title>
        <HeaderActions>
          {isConnected ? (
            <>
              <Button variant="secondary" onClick={refreshPools}>
                <RefreshCw size={18} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreatePoolModalOpen(true)}>
                <Plus size={18} />
                Create Pool
              </Button>
              <ConnectButton variant="secondary" onClick={disconnect}>
                Disconnect
              </ConnectButton>
            </>
          ) : (
            <ConnectButton onClick={connect}>
              Connect Wallet
            </ConnectButton>
          )}
        </HeaderActions>
      </Header>

      {isConnected ? (
        <>
          <SearchBar>
            <Search size={20} color="#6E7787" />
            <SearchInput
              placeholder="Search pools by token symbol"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchBar>

          <PoolList>
            {loading ? (
              <Message>
                <LoadingSpinner size={24} />
                Loading pools...
              </Message>
            ) : error ? (
              <Message error>
                <AlertCircle size={24} />
                {error}
              </Message>
            ) : filteredPools.length > 0 ? (
              filteredPools.map((pool) => (
                <PoolCard key={pool.address}>
                  <PoolHeader>
                    <TokenPair>
                      <TokenIcon src={`/images/tokens/${pool.token0.symbol.toLowerCase()}.png`} alt={pool.token0.symbol} />
                      <TokenIcon src={`/images/tokens/${pool.token1.symbol.toLowerCase()}.png`} alt={pool.token1.symbol} />
                      <TokenSymbol>{pool.token0.symbol}/{pool.token1.symbol}</TokenSymbol>
                    </TokenPair>
                  </PoolHeader>
                  <PoolReserves>
                    <ReserveItem>
                      <ReserveLabel>{pool.token0.symbol}:</ReserveLabel>
                      <ReserveValue>{pool.token0.reserve}</ReserveValue>
                    </ReserveItem>
                    <ReserveItem>
                      <ReserveLabel>{pool.token1.symbol}:</ReserveLabel>
                      <ReserveValue>{pool.token1.reserve}</ReserveValue>
                    </ReserveItem>
                  </PoolReserves>
                </PoolCard>
              ))
            ) : (
              <Message>No pools found</Message>
            )}
          </PoolList>
        </>
      ) : (
        <Message>Please connect your wallet to view pools</Message>
      )}

      <CreatePoolModal
        isOpen={isCreatePoolModalOpen}
        onClose={() => setIsCreatePoolModalOpen(false)}
        onSubmit={handleCreatePool}
      />
    </PoolsContainer>
  );
};

export default Pools; 