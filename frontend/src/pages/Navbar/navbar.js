import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Navbar, NavDropdown, Nav, Button, Form } from 'react-bootstrap';
import './navbar.css';
import { useHistory, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import jwt from 'jsonwebtoken';
import auth from '../../services/auth';


function NavigationBar() {
  const [ userRole, setUserRole ] = useState(''); 

  let isAuth = true;
  
  useEffect(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      let accessToken = localStorage.getItem('accessToken');

      if (!accessToken || !refreshToken) {
        isAuth = false;
        return;
      }

      // Get user data and refresh token if needed.
      const user = await protectPage(accessToken, refreshToken);
      
      if (!user) {
        console.log('Please log in again.');
      }   

      setUserRole(user.role);

    } catch (error) {
      console.log(error);
    }
  }, []);


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

  // Need to import history this way because Navbar is outside of <Switch> in routes.js which is what imports history for every other component/page
  let history = useHistory();


  let refToken = localStorage.getItem('refreshToken');
  // Verify user has a refresh token
  const decodeRefresh = jwt.decode(refToken);
  // Prevent navbar from rendering if no tokens
  if (!decodeRefresh) {
    return null;
  }

  // Function to refresh a user's access token if it is unexpired
  const refresh = async (refreshToken) => {
    console.log('refreshing token. . .');
    let response = await auth.get('/refresh', { headers: { refreshToken }});
    // if refresh token was unlegit or not found, then return false
    if (response.data.success === false) {
      console.log('returning false.');
      return false;
    } else { // else we get the new access token, set the cookie, and return it!
      const newAccessToken = response.data.newAccessToken;
      localStorage.setItem('accessToken', newAccessToken, { secure: true });
      return newAccessToken;
    }
  };
        
        
  // returns true or false depending on whether the access token is legit : )
  const verifyAccess = async (accessToken, refreshToken) => {
    let response = await auth.get('/verifyAccessToken', { headers: { 'accessToken': accessToken }});
    if (response.data.success === false) {
      // If the access token is expired, then go ahead and create a new access token with the refresh token
      if (response.data.message === 'Access token expired') { 
        const newAccessToken = await refresh(refreshToken);
        // Now that we have a new access token, let's verify the user and return the user
        return await verifyAccess(newAccessToken, refreshToken);
      }
      // If token comes back as invalid, return false
      return false;
    }
    // else the token is valid, return the user object with their data
    return response.data.user;     
  };
        
        
  // This function returns the user's object data within the token if it's legit, otherwise returns false.
  // This function also handles refreshing the token if needed
  const protectPage = async (accessToken, refreshToken) => {
    // If user doesnt have a refresh token: have user login 
    if (!refreshToken){
      console.log('Please log out and log back in.');
    }
    // If we have a refresh token but no access token, then go ahead and create a new token
    if (accessToken === undefined) {
      // This returns either an access token or false if the refresh token is unlegit
      accessToken = await refresh(refreshToken);
    }
    // If token is legit, return false
    if (!accessToken) {
      console.log('Please log out and log back in.');
    }
    // If the access or refresh token is unlegit, this returns false, otherwise it returns the user's object data : )
    return await verifyAccess(accessToken, refreshToken);
  };
    

  // Handle logout
  const logoutHandler = async (evt) => {
    try {
      evt.preventDefault();
      let accessToken = localStorage.getItem('accessToken');
      let refreshToken = localStorage.getItem('refreshToken');

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
            {userRole === 'owner' ? 
              <NavDropdown.Item href="/store/create">Create your own store?</NavDropdown.Item>
              : 
              <NavDropdown.Item href="/company/create">Create your own store?</NavDropdown.Item>
            }
            {userRole === 'owner' ? 
              <NavDropdown.Item href="/employees">Employees</NavDropdown.Item>
              :
              '' 
            }
            <NavDropdown.Divider />
            <NavDropdown.Item href="#action/3.4">Settings</NavDropdown.Item>
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

NavigationBar.propTypes = {
  handleLogout: PropTypes.func
};