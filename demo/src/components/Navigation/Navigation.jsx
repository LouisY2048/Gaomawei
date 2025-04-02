import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../hooks/useWeb3';

const NavWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 64px;
  padding: 0 24px;
  background: ${({ theme }) => theme.colors.bg1};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  box-sizing: border-box;
`;

const Logo = styled(Link)`
  font-size: 20px;
  font-weight: 600;
  text-decoration: none;
  position: absolute;
  left: 24px;
  height: 100%;
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 24px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  height: 100%;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: ${({ theme, active }) => active ? theme.colors.text1 : theme.colors.text2};
  font-weight: 500;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
  height: 100%;
  display: flex;
  align-items: center;

  &:hover {
    color: ${({ theme }) => theme.colors.text1};
    background: ${({ theme }) => theme.colors.bg3};
  }
`;

const ConnectButton = styled.button`
  background: ${({ theme }) => theme.colors.bg2};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.text1};
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: absolute;
  right: 24px;
  height: 36px;
  display: flex;
  align-items: center;

  &:hover {
    background: ${({ theme }) => theme.colors.bg3};
  }
`;

const Navigation = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { account, isConnected, connect, disconnect } = useWeb3();

  const formatAddress = (address) => {
    if (!address) return '';
    return address.slice(0, 6) + '...' + address.slice(-4);
  };

  return (
    <NavWrapper>
      <Logo to="/">
        Gaomawei DEX
      </Logo>
      <NavLinks>
        <NavLink to="/swap" active={currentPath === '/swap'}>
          交易
        </NavLink>
        <NavLink to="/pools" active={currentPath === '/pools'}>
          资金池
        </NavLink>
      </NavLinks>
      <ConnectButton onClick={isConnected ? disconnect : connect}>
        {isConnected ? `连接钱包 ${formatAddress(account)}` : '连接钱包'}
      </ConnectButton>
    </NavWrapper>
  );
};

export default Navigation; 