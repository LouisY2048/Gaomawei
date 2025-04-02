import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex
} from './variables';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  
  // Additional theme-specific configurations
  gradients: {
    primary: 'linear-gradient(45deg, #FC72FF 0%, #AB45E6 100%)',
    button: 'linear-gradient(to right, #FC72FF 0%, #AB45E6 51%, #FC72FF 100%)',
  },
  
  breakpoints: {
    xs: '320px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px'
  },
  
  transitions: {
    default: '0.3s ease',
    fast: '0.15s ease',
    slow: '0.5s ease'
  },
  
  // Media queries for responsive design
  media: {
    xs: '@media (min-width: 320px)',
    sm: '@media (min-width: 576px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 992px)',
    xl: '@media (min-width: 1200px)',
    xxl: '@media (min-width: 1400px)'
  }
};

export default theme; 