import React from 'react';
import { Button, Card } from 'react-bootstrap';

function ConnectWallet({ onConnect }) {
  return (
    <Card className="text-center">
      <Card.Body>
        <Card.Title>Welcome to DeFi Swap</Card.Title>
        <Card.Text>
          Connect your MetaMask wallet to start swapping tokens and providing liquidity.
        </Card.Text>
        <Button variant="primary" onClick={onConnect}>
          Connect Wallet
        </Button>
      </Card.Body>
    </Card>
  );
}

export default ConnectWallet;
