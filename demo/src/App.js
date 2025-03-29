import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';
import { theme, GlobalStyle } from './styles/theme';
import Home from './pages/Home';
import Swap from './pages/Swap';
import Pools from './pages/Pools';
import Analytics from './pages/Analytics';

// Initialize ethers provider
function getLibrary(provider) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/pools" element={<Pools />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Web3ReactProvider>
  );
}

export default App;
