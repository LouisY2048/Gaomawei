import React from 'react';
import { Card } from 'react-bootstrap';

function Balance({ balances, poolBalances, account }) {
  return (
    <div className="mb-3">
      <h5>Your Wallet</h5>
      <p className="small text-muted mb-2">
        {account.slice(0, 6)}...{account.slice(-4)}
      </p>
      <div className="d-flex justify-content-between mb-2">
        <span>Alpha Balance:</span>
        <span>{parseFloat(balances.alpha).toFixed(4)} ALPHA</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Beta Balance:</span>
        <span>{parseFloat(balances.beta).toFixed(4)} BETA</span>
      </div>
      <div className="d-flex justify-content-between mb-3">
        <span>LP Tokens:</span>
        <span>{parseFloat(balances.lp).toFixed(4)} LPT</span>
      </div>
      
      <h5>Pool Information</h5>
      <div className="d-flex justify-content-between mb-2">
        <span>Alpha in Pool:</span>
        <span>{parseFloat(poolBalances.alpha).toFixed(4)} ALPHA</span>
      </div>
      <div className="d-flex justify-content-between mb-2">
        <span>Beta in Pool:</span>
        <span>{parseFloat(poolBalances.beta).toFixed(4)} BETA</span>
      </div>
      {parseFloat(poolBalances.alpha) > 0 && parseFloat(poolBalances.beta) > 0 && (
        <div className="d-flex justify-content-between mb-2">
          <span>Current Ratio:</span>
          <span>1 ALPHA = {(parseFloat(poolBalances.beta) / parseFloat(poolBalances.alpha)).toFixed(4)} BETA</span>
        </div>
      )}
    </div>
  );
}

export default Balance;