import contractAddresses from '../contract-addresses.json';

export const TOKENS = {
  ALPHA: {
    symbol: 'ALPHA',
    name: 'Alpha Token',
    address: '0x0165878A594ca255338adfa4d48449f69242Eb8F', // Will be updated with actual address
    decimals: 18
  },
  BETA: {
    symbol: 'BETA',
    name: 'Beta Token',
    address: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853', // Will be updated with actual address
    decimals: 18
  },
  GAMMA: {
    symbol: 'GAMMA',
    name: 'Gamma Token',
    address: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6', // Will be updated with actual address
    decimals: 18
  }
};

export const POOLS = {
  ALPHA_BETA: {
    name: 'ALPHA-BETA Pool',
    address: ' 0x8a791620dd6260079bf849dc5567adc3f2fdc318', // Will be updated with actual address
    token0: TOKENS.ALPHA,
    token1: TOKENS.BETA
  },
  BETA_GAMMA: {
    name: 'BETA-GAMMA Pool',
    address: '0x610178da211fef7d417bc0e6fed39f05609ad788', // Will be updated with actual address
    token0: TOKENS.BETA,
    token1: TOKENS.GAMMA
  },
  GAMMA_ALPHA: {
    name: 'GAMMA-ALPHA Pool',
    address: '0xb7f8bc63bbcad18155201308c8f3540b07f84f5e', // Will be updated with actual address
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