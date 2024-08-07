import React from 'react';
import { Navbar, Nav, NavItem, NavLink, NavbarBrand } from 'reactstrap';
import logo from '../resimler/logoo.jpeg'; // Logo resmi yolunu güncelleyin
import powerIcon from '../resimler/power-128.png'; // Power icon resmi yolunu güncelleyin

const NavbarComponent = ({ onLogout }) => {
  return (
    <Navbar light expand="md" style={{ background: '#9c1818', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <NavbarBrand href="/dashboard" style={{ marginLeft: '1%' }}>
          <img src={logo} alt="logo" style={{ height: '70px' }} />
        </NavbarBrand>
        <Nav className="ml-auto" navbar style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <NavItem>
            <NavLink onClick={onLogout} style={{ padding: '0' }}>
              <img src={powerIcon} alt="Logout" style={{ height: '50px', width: '50px' }} />
            </NavLink>
          </NavItem>
        </Nav>
      </div>
    </Navbar>
  );
};

export default NavbarComponent;