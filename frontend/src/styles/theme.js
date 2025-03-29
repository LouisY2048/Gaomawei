import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    primary: '#FF007A',
    secondary: '#2172E5',
    background: '#F7F8FA',
    foreground: '#FFFFFF',
    text: {
      primary: '#000000',
      secondary: '#888D9B',
      tertiary: '#6C7284'
    },
    border: '#E8E9EA',
    success: '#27AE60',
    warning: '#FF8F00',
    error: '#FD4040'
  },
  shadows: {
    card: '0px 4px 20px rgba(0, 0, 0, 0.05)',
    button: '0px 2px 8px rgba(0, 0, 0, 0.08)'
  },
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px'
  }
};

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: ${props => props.theme.colors.background};
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button {
    font-family: 'Inter', sans-serif;
    cursor: pointer;
  }

  input {
    font-family: 'Inter', sans-serif;
  }

  .swap-container {
    background: ${props => props.theme.colors.foreground};
    border-radius: 24px;
    padding: 1rem;
    box-shadow: ${props => props.theme.shadows.card};
  }

  .token-input {
    background: ${props => props.theme.colors.background};
    border-radius: 16px;
    padding: 1rem;
    margin-bottom: 0.5rem;
  }

  .token-button {
    background: ${props => props.theme.colors.background};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 20px;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;

    &:hover {
      border-color: ${props => props.theme.colors.primary};
    }
  }

  .swap-button {
    background: ${props => props.theme.colors.primary};
    color: white;
    border: none;
    border-radius: 20px;
    padding: 1rem;
    width: 100%;
    font-size: 1.1rem;
    font-weight: 600;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.9;
    }

    &:disabled {
      background: ${props => props.theme.colors.border};
      cursor: not-allowed;
    }
  }

  .pool-share {
    background: ${props => props.theme.colors.background};
    border-radius: 16px;
    padding: 1rem;
    margin: 1rem 0;
  }

  .price-impact {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
  }
`; 