import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'react-feather';
import PropTypes from 'prop-types';
import Card from '../Card/Card';
import Button from '../Button/Button';
import TokenSelect from '../TokenSelect/TokenSelect';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled(Card)`
  width: 100%;
  max-width: 500px;
  padding: 24px;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text2};
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${({ theme }) => theme.colors.text1};
  }
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.h2.size};
  color: ${({ theme }) => theme.colors.text1};
  margin-bottom: 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.body.size};
  color: ${({ theme }) => theme.colors.text2};
`;

const FeeSelect = styled.select`
  background: ${({ theme }) => theme.colors.bg2};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 12px;
  color: ${({ theme }) => theme.colors.text1};
  font-size: ${({ theme }) => theme.typography.body.size};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary1};
  }
`;

const CreatePoolModal = ({ isOpen, onClose, onSubmit }) => {
  const [token0, setToken0] = useState(null);
  const [token1, setToken1] = useState(null);
  const [fee, setFee] = useState('0.3');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token0 || !token1) return;

    try {
      setLoading(true);
      await onSubmit(token0.address, token1.address, parseFloat(fee));
      onClose();
    } catch (error) {
      console.error('Error creating pool:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>
        <Title>Create New Pool</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Token 1</Label>
            <TokenSelect
              value={token0}
              onChange={setToken0}
              excludeToken={token1?.address}
            />
          </FormGroup>
          <FormGroup>
            <Label>Token 2</Label>
            <TokenSelect
              value={token1}
              onChange={setToken1}
              excludeToken={token0?.address}
            />
          </FormGroup>
          <FormGroup>
            <Label>Fee Tier</Label>
            <FeeSelect value={fee} onChange={(e) => setFee(e.target.value)}>
              <option value="0.01">0.01%</option>
              <option value="0.05">0.05%</option>
              <option value="0.3">0.3%</option>
              <option value="1">1%</option>
            </FeeSelect>
          </FormGroup>
          <Button
            type="submit"
            disabled={!token0 || !token1 || loading}
            fullWidth
          >
            {loading ? 'Creating Pool...' : 'Create Pool'}
          </Button>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

CreatePoolModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default CreatePoolModal; 