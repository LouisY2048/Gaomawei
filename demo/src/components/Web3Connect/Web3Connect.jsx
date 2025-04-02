import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import styled from 'styled-components';

const ConnectButton = styled.button`
  background: ${({ theme }) => theme.colors.primary1};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary2};
  }
`;

const AccountInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: ${({ theme }) => theme.colors.bg2};
  border-radius: 8px;
`;

export const Web3Connect = () => {
  const { account, activate, deactivate } = useWeb3React();

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        console.log("Connected wallet:", address);
      } else {
        alert("请安装MetaMask!");
      }
    } catch (error) {
      console.error("连接钱包时出错:", error);
    }
  };

  return (
    <div>
      {!account ? (
        <ConnectButton onClick={connectWallet}>连接钱包</ConnectButton>
      ) : (
        <AccountInfo>
          <span>已连接账户: {account}</span>
          <ConnectButton onClick={() => deactivate()}>断开连接</ConnectButton>
        </AccountInfo>
      )}
    </div>
  );
};

export default Web3Connect; 