import React, { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Navbar, Nav, NavItem } from "reactstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import './NavigationBar.css'; 
import { UserContext } from "../../context/userContext";

export default function NavBar() {
  const { user } = useContext(UserContext);
  const location = useLocation();

  const isLoginOrRegister = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/" || location.pathname === "";

  return (
    <div className="login">
      <Navbar className="navbar-custom" light expand="md">
        <div className="navbar-container">
          <Nav className="navbar-nav" navbar>
            {isLoginOrRegister && (
              <>
                <NavItem style={{ paddingLeft: "700px" }}>
                  <NavLink
                    to="/register"
                    className={({ isActive }) => (isActive ? "nav-button active" : "nav-button")}
                  >
                    Register
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    to="/login"
                    className={({ isActive }) => (isActive ? "nav-button active" : "nav-button")}
                  >
                    Login
                  </NavLink>
                </NavItem>
              </>
            )}
          </Nav>
        </div>
      </Navbar>
    </div>
  );
}
