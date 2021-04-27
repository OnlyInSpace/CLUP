import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Navbar, NavDropdown, Nav, Button, Form } from 'react-bootstrap';
import './navbar.css';
import { useHistory, withRouter } from 'react-router-dom';
import auth from '../../services/auth';

import {
  protectPage,
  // refresh
} from '../verifyTokens/tokenFunctions';


function NavigationBar() {
  const [ userRole, setUserRole ] = useState('');
  // const [ userCompany_id, setUserCompany_id ] = useState('');
  // const [ storeCompany_id, setStoreCompany_id ] = useState('');
  const refreshToken = localStorage.getItem('refreshToken');

  const store_id = localStorage.getItem('store');
  let accessToken = localStorage.getItem('accessToken');

  let isAuth = true;


  useEffect(() => {
    (async () => {
      try {

        if (!accessToken || !refreshToken) {
          isAuth = false;
          return;
        }

        // Get user data and refresh token if needed.
        let user = await protectPage(accessToken, refreshToken);

        if (!user) {
          console.log('Please log in again.');
          return;
        }   


        setUserRole(user.role);

        if (!store_id) {
          console.log('no store_id found');
          return;
        }

      } catch (error) {
        console.log(error);
      }
    })();

  }, []);

  // Need to import history this way because Navbar is outside of <Switch> in routes.js which is what imports history for every other component/page
  let history = useHistory();

  //returns the current url minus the domain name
  const pathname = useLocation().pathname; 
  // Dont show our navbar at the landing, login, and register page.
  if (pathname === '/login' || pathname === '/user/register' || pathname === '/') {
    return null;
  }

  // If user does not have access or refresh token, then return nothing!
  if (!isAuth) {
    return null;
  }



  // Handle logout
  const logoutHandler = async (evt) => {
    try {
      evt.preventDefault();


      // Verify user token, refresh if have to, and get their data
      let user = await protectPage(accessToken, refreshToken);

      if (!user) {
        console.log('Please log in again. User not found after protectPage()');
        history.push('/login');
      } else {
        // Delete refresh token in Mongo so nobody can have access to it now 
        // Users are fully protected when logged out
        await auth.post('/logout', { user });
      }
      // Remove localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      history.push('/');
    } catch (error) {
      console.log(error);
    }
  };
                
  
  return (
    <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
      <Navbar.Brand href="/dashboard">
          CLUP 
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href="/myvisits">My visits</Nav.Link>
          <Nav.Link href="/visit/schedule">Schedule a visit</Nav.Link>
          <Nav.Link href="/findstore">Select a store</Nav.Link>
          <NavDropdown title="Account" id="collasible-nav-dropdown">
            {(userRole === 'owner' || userRole === 'manager') ? 
              <NavDropdown.Item href="/employees">Employees</NavDropdown.Item>
              :
              '' 
            }
            {(userRole === 'owner' || userRole === 'manager') ? 
              <NavDropdown.Divider />
              :
              '' 
            }
            {userRole === 'owner' ? 
              <NavDropdown.Item href="/store/create">Create a store</NavDropdown.Item>
              : 
              <NavDropdown.Item href="/company/create">Create a store</NavDropdown.Item>
            }
            {/* <NavDropdown.Item href="#action/3.4">Settings</NavDropdown.Item> */}
          </NavDropdown>
        </Nav>
        {/* <Nav>
          <Nav.Link href="/employees">More stuff</Nav.Link>
          <Nav.Link eventKey={2} href="#memes"> hello </Nav.Link>
        </Nav> */}
        <Form inline>
          <Button onClick={logoutHandler} className='logout-btn' variant="secondary">Logout</Button>
        </Form>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default withRouter(NavigationBar);