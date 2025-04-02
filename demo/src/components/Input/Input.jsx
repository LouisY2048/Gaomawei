import React from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';
import PropTypes from 'prop-types';

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const Label = styled.label`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text2};
  margin-bottom: 4px;
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.bg1};
  border: 1px solid ${({ theme, error }) => 
    error ? theme.colors.red1 : theme.colors.border1};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 12px 16px;
  transition: all ${({ theme }) => theme.transition.duration} ${({ theme }) => theme.transition.timing};

  &:hover {
    border-color: ${({ theme, error }) => 
      error ? theme.colors.red1 : theme.colors.primary1};
  }

  &:focus-within {
    border-color: ${({ theme, error }) => 
      error ? theme.colors.red1 : theme.colors.primary1};
    box-shadow: 0 0 0 1px ${({ theme, error }) => 
      error ? transparentize(0.9, theme.colors.red1) : transparentize(0.9, theme.colors.primary1)};
  }
`;

const StyledInput = styled.input`
  width: 100%;
  background: none;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.colors.text1};
  font-size: 16px;
  font-weight: 500;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text3};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const RightElement = styled.div`
  margin-left: 12px;
  display: flex;
  align-items: center;
`;

const ErrorMessage = styled.span`
  color: ${({ theme }) => theme.colors.red1};
  font-size: 14px;
  margin-top: 4px;
`;

const Input = React.forwardRef(({ 
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled = false,
  rightElement,
  ...props 
}, ref) => {
  return (
    <InputWrapper>
      {label && <Label>{label}</Label>}
      <InputContainer error={error}>
        <StyledInput
          ref={ref}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {rightElement && <RightElement>{rightElement}</RightElement>}
      </InputContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputWrapper>
  );
});

Input.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  rightElement: PropTypes.node,
};

Input.displayName = 'Input';

export default Input; 