import React, { useState } from 'react';
import styled from 'styled-components';

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bg2};
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h3`
  color: ${({ theme }) => theme.colors.text1};
  font-size: 16px;
  font-weight: 500;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text2};
  cursor: pointer;
  font-size: 20px;
  padding: 4px;

  &:hover {
    color: ${({ theme }) => theme.colors.text1};
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h4`
  color: ${({ theme }) => theme.colors.text2};
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 12px;
`;

const SlippageInput = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const SlippageButton = styled.button`
  background: ${({ theme, active }) => active ? theme.colors.primary1 : theme.colors.bg3};
  color: ${({ theme, active }) => active ? theme.colors.text1 : theme.colors.text2};
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
`;

const CustomInput = styled.input`
  width: 80px;
  background: ${({ theme }) => theme.colors.bg3};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 8px 12px;
  color: ${({ theme }) => theme.colors.text1};
  font-size: 14px;
  text-align: right;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text3};
  }
`;

const SettingsModal = ({ isOpen, onClose }) => {
  const [slippage, setSlippage] = useState('0.5');
  const [deadline, setDeadline] = useState('30');

  if (!isOpen) return null;

  return (
    <Modal onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <Title>交易设置</Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <Section>
          <SectionTitle>滑点容差</SectionTitle>
          <SlippageInput>
            <SlippageButton 
              active={slippage === '0.1'} 
              onClick={() => setSlippage('0.1')}
            >
              0.1%
            </SlippageButton>
            <SlippageButton 
              active={slippage === '0.5'} 
              onClick={() => setSlippage('0.5')}
            >
              0.5%
            </SlippageButton>
            <SlippageButton 
              active={slippage === '1.0'} 
              onClick={() => setSlippage('1.0')}
            >
              1.0%
            </SlippageButton>
            <CustomInput
              type="number"
              placeholder="自定义"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
            />
            <span>%</span>
          </SlippageInput>
        </Section>

        <Section>
          <SectionTitle>交易截止时间</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CustomInput
              type="number"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <span>分钟</span>
          </div>
        </Section>
      </ModalContent>
    </Modal>
  );
};

export default SettingsModal; 