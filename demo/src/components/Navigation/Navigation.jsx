import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const NavWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 40px;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 24px;
`;

const NavLink = styled(Link)`
  color: ${({ theme, active }) => active ? theme.colors.text1 : theme.colors.text2};
  font-weight: 500;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.text1};
    background: ${({ theme }) => theme.colors.bg3};
  }
`;

const NetworkButton = styled.button`
  background: ${({ theme }) => theme.colors.bg3};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 8px 12px;
  color: ${({ theme }) => theme.colors.text1};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${({ theme }) => theme.colors.bg2};
  }
`;

const Navigation = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  return (
    <NavWrapper>
      <NavLinks>
        <NavLink to="/swap" active={currentPath === '/swap'}>
          交易
        </NavLink>
        <NavLink to="/pools" active={currentPath === '/pools'}>
          资金池
        </NavLink>
      </NavLinks>
    </NavWrapper>
  );
};

export default Navigation; 