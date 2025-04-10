# Gaomawei DEX

Gaomawei DEX is a decentralized exchange project that supports token swapping and liquidity pool management. The project uses Hardhat as the development framework and implements basic DEX functionality.

## Project Structure

```
Gaomawei/
├── backend/                 # Backend code
│   ├── contracts/          # Solidity contracts
│   ├── scripts/            # Deployment and test scripts
├── frontend/               # Frontend code
│   └── src/               # Frontend source code
```

## Preparation Required Before Installation

1. **Install Node.js**
   - Download and install Node.js (version 16.x or later) from [Node.js official website](https://nodejs.org/)
   - Verify installation by running:
     ```bash
     node --version
     npm --version
     ```

2. **Install MetaMask**
   - Download and install MetaMask browser extension from [MetaMask official website](https://metamask.io/)
   - Create a new wallet or import an existing one
   - Make sure to securely store your seed phrase

3. **Configure MetaMask for Local Development**
   - Open MetaMask and click on the network dropdown (default: "Ethereum Mainnet")
   - Click "Add Network" and then "Add a network manually"
   - Fill in the following details for Hardhat local network:
     ```
     Network Name: Localhost
     RPC URL: http://127.0.0.1:8545
     Chain ID: 31337
     Currency Symbol: ETH
     Block Explorer URL: (leave empty)
     ```
   - Click "Save" to add the network
   - Switch to the "Hardhat Local" network

4. **Import Test Accounts**
   - When you start the Hardhat local network, it will provide several test accounts with ETH
   - To import these accounts into MetaMask:
     1. Copy the private key of a test account from the Hardhat console
     2. In MetaMask, click the account icon
     3. Select "Import Account"
     4. Paste the private key and click "Import"

## Installation and Setup

1. Clone the project
```bash
git clone https://github.com/LouisY2048/Gaomawei.git
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd frontend
npm install
```

## Deployment

1. Compile contracts
```bash
cd backend
npx hardhat compile
```

2. Deploy contracts
```bash
cd backend
npx hardhat run scripts/deploy.js --network Hardhat Localhost
```

## Usage Guide

1. Start local development network
```bash
cd backend
npx hardhat node
```

2. Open frontend interface in browser
```bash
cd frontend
python3 -m http.server 8000
```

3. Connect MetaMask wallet
   - Ensure MetaMask is installed
   - Connect to local development network
   - Click "Connect Wallet" button

4. Use DEX features
   - Add Liquidity: Enter token amounts and confirm transaction
   - Remove Liquidity: Enter LP Token amount and confirm transaction
   - Token Swap: Select input token and amount, execute swap

## Tech Stack

### Backend
- Hardhat
- Solidity
- Ethers.js

### Frontend
- HTML/CSS/JavaScript
- Ethers.js
- MetaMask Integration


## Contract Functions

### Pool Contract
- `addLiquidity`: Add liquidity to the pool
- `removeLiquidity`: Remove liquidity from the pool
- `swap`: Execute token swap
- `getReserves`: Get pool reserves
- `getRequiredAmount1`: Calculate required token amount
- `balanceOf`: Query LP Token balance
- `totalSupply`: Query total supply

### Token Contract
- `approve`: Approve token usage
- `balanceOf`: Query token balance
- `allowance`: Query approval amount

## License

[MIT License](LICENSE)