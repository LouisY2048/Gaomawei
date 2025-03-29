import React from 'react';
import styled from 'styled-components';
import { darken, transparentize } from 'polished';

const Button = styled.button`
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.white};
  padding: 12px 20px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => transparentize(0.1, theme.primary)};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.disabled};
    cursor: not-allowed;
  }

  ${({ variant, theme }) =>
    variant === 'outlined' &&
    `
    background-color: transparent;
    border: 2px solid ${theme.primary};
    color: ${theme.primary};

    &:hover {
      background-color: ${transparentize(0.9, theme.primary)};
    }
  `}

  ${({ variant, theme }) =>
    variant === 'text' &&
    `
    background-color: transparent;
    color: ${theme.primary};
    padding: 8px 12px;

    &:hover {
      background-color: ${transparentize(0.9, theme.primary)};
    }
  `}

  ${({ size }) =>
    size === 'small' &&
    `
    padding: 8px 16px;
    font-size: 14px;
  `}

  ${({ size }) =>
    size === 'large' &&
    `
    padding: 16px 24px;
    font-size: 18px;
  `}
`;

const PrimaryButton = styled(Button)`
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.white};

  &:hover {
    background: ${({ theme, disabled }) => 
      !disabled ? darken(0.05, theme.primary) : theme.primary};
  }
`;

const SecondaryButton = styled(Button)`
  background: ${({ theme }) => theme.background2};
  color: ${({ theme }) => theme.text1};

  &:hover {
    background: ${({ theme, disabled }) => 
      !disabled ? darken(0.05, theme.background2) : theme.background2};
  }
`;

const OutlineButton = styled(Button)`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};

  &:hover {
    background: ${({ theme, disabled }) => 
      !disabled ? transparentize(0.9, theme.primary) : 'transparent'};
  }
`;

const TextButton = styled(Button)`
  background: transparent;
  color: ${({ theme }) => theme.primary};
  padding: 0;

  &:hover {
    opacity: ${({ disabled }) => (!disabled ? '0.8' : '0.5')};
  }
`;

const VARIANTS = {
  primary: PrimaryButton,
  secondary: SecondaryButton,
  outline: OutlineButton,
  text: TextButton,
};

const ButtonComponent = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false,
  fullWidth = false,
  onClick,
  ...props 
}) => {
  const SelectedButton = VARIANTS[variant] || VARIANTS.primary;

  return (
    <SelectedButton
      size={size}
      disabled={disabled}
      fullWidth={fullWidth}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </SelectedButton>
  );
};

export default ButtonComponent; 