# Dora DEX

Dora DEX is a decentralized exchange project that supports token swapping and liquidity pool management. The project uses Hardhat as the development framework and implements basic DEX functionality.

## Project Structure

```
Dora/
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
   - Download and install MetaMask browser extension from [Chrome WebStore](https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn)
   - Create a new wallet or import an existing one
   - Make sure to securely store your seed phrase

## Installation and Setup

1. Clone the project
```bash
git clone https://github.com/LouisY2048/Dora.git
```

2. Install dependencies
```bash
# Install node dependencies
npm install
```

3. Start local development network
```bash
npx hardhat node
```
4. Configure MetaMask for local development
   - Open MetaMask and click on the network dropdown which is on the left top
   - Click "Add a custom network"
   - Fill in the following details for local network:
     ```
     Network Name: localhost
     RPC URL: http://127.0.0.1:8545
     Chain ID: 31337
     Currency Symbol: ETH
     Block Explorer URL: (leave empty)
     ```
   - Click "Save" to add the network
   - Switch to the "localhost" network

4. Import test accounts
   - When you start the localhost network, it will provide several test accounts with ETH
   - To import these accounts into MetaMask:
     1. Copy the private key of a test account from the localhost console
     2. In MetaMask, click the account icon
     3. Select "Add account or hardware wallet" and then choose "Private Key" mode
     4. Paste the private key and click "Import"

## Deployment(Run a new command line to do it)
1. Compile contracts
```bash
npx hardhat compile
```

2. Deploy contracts
```bash
npx hardhat run backend/scripts/deploy.js --network localhost
```

## Usage Guide
1. Open frontend interface in browser
```bash
cd frontend
python3 -m http.server 8000
```
   - Then, type “http://localhost:8000/src/ ” in the browser search box

2. Connect MetaMask wallet
   - Ensure MetaMask is installed
   - Connect to local development network
   - Click "Connect Wallet" button

3. Use DEX features
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