// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Web3 provider
jest.mock('@web3-react/core', () => ({
  useWeb3React: () => ({
    account: null,
    chainId: null,
    connector: null,
    isActive: false,
    isActivating: false,
    error: null,
    deactivate: jest.fn(),
  }),
  Web3ReactProvider: ({ children }) => children,
}));

// Mock styled-components
jest.mock('styled-components', () => ({
  ...jest.requireActual('styled-components'),
  ThemeProvider: ({ children }) => children,
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));
