import contractAddresses from '../contracts/contract-addresses.json';

export const TOKENS = {
  ALPHA: {
    symbol: 'ALPHA',
    name: 'Alpha Token',
    address: contractAddresses.tokens.alpha,
    decimals: 18
  },
  BETA: {
    symbol: 'BETA',
    name: 'Beta Token',
    address: contractAddresses.tokens.beta,
    decimals: 18
  },
  GAMMA: {
    symbol: 'GAMMA',
    name: 'Gamma Token',
    address: contractAddresses.tokens.gamma,
    decimals: 18
  }
};

export const POOLS = {
  ALPHA_BETA: {
    name: 'ALPHA-BETA Pool',
    address: contractAddresses.pools.alphaBeta,
    token0: TOKENS.ALPHA,
    token1: TOKENS.BETA
  },
  BETA_GAMMA: {
    name: 'BETA-GAMMA Pool',
    address: contractAddresses.pools.betaGamma,
    token0: TOKENS.BETA,
    token1: TOKENS.GAMMA
  },
  GAMMA_ALPHA: {
    name: 'GAMMA-ALPHA Pool',
    address: contractAddresses.pools.gammaAlpha,
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