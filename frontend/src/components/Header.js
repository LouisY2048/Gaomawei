import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <Navbar bg="transparent" variant="dark" className="py-3">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img
            src="/logo.png"
            alt="Logo"
            height="32"
            className="me-2"
          />
          <span className="fw-bold">Gaomawei DEX</span>
        </Navbar.Brand>
        <Nav className="ms-auto">
          <Nav.Link as={Link} to="/swap">Swap</Nav.Link>
          <Nav.Link as={Link} to="/pools">Pools</Nav.Link>
          <Nav.Link as={Link} to="/tokens">Tokens</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Header;