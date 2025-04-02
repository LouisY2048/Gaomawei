import React from 'react';
import styled from 'styled-components';
import { darken, transparentize } from 'polished';
import PropTypes from 'prop-types';

const StyledButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary.main};
  color: ${({ theme }) => theme.colors.text1};
  padding: 12px 20px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.typography.body.size};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: ${({ theme }) => darken(0.1, theme.colors.primary.main)};
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.text3};
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${({ variant, theme }) =>
    variant === 'outlined' &&
    `
    background-color: transparent;
    border: 2px solid ${theme.colors.primary.main};
    color: ${theme.colors.primary.main};

    &:hover {
      background-color: ${transparentize(0.9, theme.colors.primary.main)};
    }

    &:disabled {
      border-color: ${theme.colors.text3};
      color: ${theme.colors.text3};
    }
  `}

  ${({ variant, theme }) =>
    variant === 'text' &&
    `
    background-color: transparent;
    color: ${theme.colors.primary.main};
    padding: 8px 12px;

    &:hover {
      background-color: ${transparentize(0.9, theme.colors.primary.main)};
    }

    &:disabled {
      color: ${theme.colors.text3};
    }
  `}

  ${({ size, theme }) =>
    size === 'small' &&
    `
    padding: 8px 16px;
    font-size: ${theme.typography.small.size};
  `}

  ${({ size }) =>
    size === 'large' &&
    `
    padding: 16px 24px;
    font-size: 18px;
  `}

  ${({ $fullWidth }) =>
    $fullWidth &&
    `
    width: 100%;
  `}
`;

const PrimaryButton = styled(StyledButton)`
  background: ${({ theme }) => theme.colors.primary.main};
  color: ${({ theme }) => theme.colors.text1};

  &:hover {
    background: ${({ theme, disabled }) => 
      !disabled ? darken(0.1, theme.colors.primary.main) : theme.colors.primary.main};
  }
`;

const SecondaryButton = styled(StyledButton)`
  background: ${({ theme }) => theme.colors.bg2};
  color: ${({ theme }) => theme.colors.text1};

  &:hover {
    background: ${({ theme, disabled }) => 
      !disabled ? darken(0.05, theme.colors.bg2) : theme.colors.bg2};
  }
`;

const Button = React.forwardRef(({ 
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const ButtonComponent = variant === 'primary' ? PrimaryButton : 
                         variant === 'secondary' ? SecondaryButton : 
                         StyledButton;

  return (
    <ButtonComponent
      ref={ref}
      variant={variant}
      size={size}
      $fullWidth={fullWidth}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{leftIcon}</span>}
      {children}
      {rightIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{rightIcon}</span>}
    </ButtonComponent>
  );
});

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outlined', 'text']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
};

Button.displayName = 'Button';

export default Button; 