import { createGlobalStyle } from 'styled-components';
import { darken, lighten, transparentize } from 'polished';

export const theme = {
  primary: '#3f51b5',
  primary2: '#2196F3',
  secondary: '#2196F3',
  background: '#f5f7fa',
  background2: '#eef2f6',
  background3: '#e6ebf2',
  text1: '#2c3e50',
  text2: '#4a5568',
  text3: '#718096',
  border: '#e2e8f0',
  border2: '#cbd5e0',
  success: '#4CAF50',
  warning: '#ff9800',
  error: '#f44336',
  white: '#ffffff',
  black: '#000000',
  disabled: '#bdbdbd',

  // Border radius
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    pill: '9999px'
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px'
  },

  // Shadows
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px rgba(0, 0, 0, 0.1)'
  },

  // Media queries
  mediaWidth: {
    upToExtraSmall: 500,
    upToSmall: 720,
    upToMedium: 960,
    upToLarge: 1280
  }
};

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text1};
    line-height: 1.6;
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  input {
    font-family: inherit;
  }

  a {
    color: ${({ theme }) => theme.primary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
      monospace;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.background};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border2};
    border-radius: 4px;

    &:hover {
      background: ${({ theme }) => theme.text3};
    }
  }

  /* Selection */
  ::selection {
    background-color: ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.white};
  }
`; 