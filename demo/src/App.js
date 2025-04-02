import React from 'react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './hooks/useWeb3';
import { theme, GlobalStyle } from './styles';
import Home from './pages/Home.jsx';
import Swap from './pages/Swap.jsx';
import Pools from './components/Pools/Pools.jsx';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Web3Provider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/pools" element={<Pools />} />
          </Routes>
        </Router>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;
