import contractAddresses from '../contract-addresses.json';

export const TOKENS = {
  ALPHA: {
    symbol: 'ALPHA',
    name: 'Alpha Token',
    address: '0x0000000000000000000000000000000000000000', // Will be updated with actual address
    decimals: 18
  },
  BETA: {
    symbol: 'BETA',
    name: 'Beta Token',
    address: '0x0000000000000000000000000000000000000000', // Will be updated with actual address
    decimals: 18
  },
  GAMMA: {
    symbol: 'GAMMA',
    name: 'Gamma Token',
    address: '0x0000000000000000000000000000000000000000', // Will be updated with actual address
    decimals: 18
  }
};

export const POOLS = {
  ALPHA_BETA: {
    name: 'ALPHA-BETA Pool',
    address: '0x0000000000000000000000000000000000000000', // Will be updated with actual address
    token0: TOKENS.ALPHA,
    token1: TOKENS.BETA
  },
  BETA_GAMMA: {
    name: 'BETA-GAMMA Pool',
    address: '0x0000000000000000000000000000000000000000', // Will be updated with actual address
    token0: TOKENS.BETA,
    token1: TOKENS.GAMMA
  },
  GAMMA_ALPHA: {
    name: 'GAMMA-ALPHA Pool',
    address: '0x0000000000000000000000000000000000000000', // Will be updated with actual address
    token0: TOKENS.GAMMA,
    token1: TOKENS.ALPHA
  }
};

export const SUPPORTED_CHAINS = {
  1: {
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
    explorer: 'https://etherscan.io'
  },
  5: {
    name: 'Goerli Testnet',
    rpcUrl: 'https://goerli.infura.io/v3/your-project-id',
    explorer: 'https://goerli.etherscan.io'
  }
};

export const DEFAULT_CHAIN_ID = 5; // Goerli Testnet
export const SLIPPAGE_TOLERANCE = 0.005; // 0.5%
export const TRANSACTION_DEADLINE = 20 * 60; // 20 minutes 