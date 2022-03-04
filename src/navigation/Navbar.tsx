import React from "react";
import { Link, useHistory } from "react-router-dom";
import { Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useAuth } from "auth/context";
import getMenu from "navigation/menus";
import classNames from "classnames";
import "./Navbar.scss";
import { useMessages } from "messages/context";

interface NavbarWrapperProps {
  className?: string;
}

const NavbarWrapper: React.FC<NavbarWrapperProps> = ({ className }) => {
  const { user } = useAuth();

  const menuItems = getMenu("main", user);

  const navItems = menuItems.map(({ label, url }, index) => (
    <div key={index} className="nav-item">
      <Link className="nav-link" to={url}>
        {label}
      </Link>
    </div>
  ));

  return (
    <div
      className={classNames("navbar-wrapper bg-light border-bottom", className)}
    >
      <div className="container px-0">
        <Navbar expand="lg">
          <Navbar.Brand>
            <Link className="navbar-brand" to="/">
              Allbiz Timesheet
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ml-auto">
              {navItems}
              <UserMenu />
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </div>
    </div>
  );
};

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { setMessage } = useMessages();
  const history = useHistory();

  if (user) {
    return (
      <NavDropdown id="user-menu" title={user.name}>
        <NavDropdown.Item
          onClick={() => {
            history.push("/account");
          }}
        >
          Settings
        </NavDropdown.Item>
        <NavDropdown.Item
          data-testid="logout-button"
          onClick={() => {
            logout();
            setMessage("success", `${user.name} has logged out.`);
          }}
        >
          Log out
        </NavDropdown.Item>
      </NavDropdown>
    );
  }

  return null;
};

export default NavbarWrapper;
