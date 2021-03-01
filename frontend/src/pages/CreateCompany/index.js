import React, { useState, useEffect } from 'react';
import auth from '../../services/auth';
import api from '../../services/api';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import './createcompany.css';
import { useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';

// CreateCompany allows users to create their own company
function CreateCompany() {
  let history = useHistory();
  const [companyName, setCompanyName] = useState('');
  // For alert
  const [errorMessage, setErrorMessage] = useState('');

  // Check user's role. If they are already an owner, then send them to the create store page
  useEffect(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      let accessToken = localStorage.getItem('accessToken');
      // Get user data and refresh token if needed.
      let user = await protectPage(accessToken, refreshToken);
      if (!user) {
        console.log('Please log in again.');
        history.push('/login');
      }     

      if (user.role === 'owner') {
        history.push('/store/create');
      }

    } catch (error) {
      console.log(error);
    }
  }, []);


  // Function to refresh a user's access token if it is unexpired
  const refresh = async (refreshToken) => {
    console.log('refreshing token. . .');
    let response = await auth.get('/refresh', { headers: { refreshToken }});
    // if refresh token was unlegit or not found, then return false
    if (response.data.success === false) {
      console.log('resolving false.');
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
    if (!refreshToken) {
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

  
  // Function that will talk to server api
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    try {
      if (!companyName) {
        setErrorMessage('Please enter your company\'s name.');
      } else {
        let accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // Decode to get data stored in cookie
        let user = jwt.decode(accessToken);
        // When we decode a cookie using jwt.decode, we get an object called userData with the user's data stored inside
        let ownerId = user._id;

        // Make api call to create the new company 
        let response = await api.post('/company/create', { companyName, ownerId }, { headers: {'accessToken': accessToken }});
        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            console.log('Please log in again.');
            history.push('/login');
          } else {
          // overwrite response with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            ownerId = user._id;
            response = await api.post('/company/create', { companyName, ownerId }, { headers: {'accessToken': newAccessToken }});
          }
        }


        const comapnyId = response.data._id || false;

        // Set user's role to owner so that they are able to now create stores.
        response = await api.post('/role/owner', { user_id: ownerId }, { headers: {'accessToken': accessToken }});
        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            console.log('Please log in again.');
            history.push('/login');
          } else {
            // overwrite response with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            ownerId = user._id;
            response = await api.post('/role/owner', { user_id: ownerId }, { headers: {'accessToken': newAccessToken }});
          }
        }

        
        // Set user's business_id to the company's id
        response = await api.post('/business_id', { user_id: ownerId, business_id: comapnyId }, { headers: {'accessToken': accessToken }});
        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            console.log('Please log in again.');
            history.push('/login');
          } else {
            // overwrite response with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            ownerId = user._id;
            response = await api.post('/business_id', { user_id: ownerId, business_id: comapnyId }, { headers: {'accessToken': newAccessToken }});
          }
        }

        // Refresh our user's token so that their role and business id are updated in localstorage
        await refresh(refreshToken);

        if (comapnyId && response.data.role === 'owner') {
          console.log('companyID:', comapnyId);
          history.push('/store/create');
        } else {
          setErrorMessage(response.data.message);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };


  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        <h3>Company Creation</h3>
        <p>Let&apos;s first create your company</p>
        <ul className="createComplist">
          <li>Enter your <strong>company</strong> name.</li>
          <li>Your company can own multiple stores. We will create your <strong>first store</strong> on the next page.</li>
          <li> Both your company and store name(s) can be the same.</li>
        </ul>
        <Form onSubmit = {handleSubmit}>
          <Form.Group controlId="formCompanyName">
            <Form.Label className="createCompanyName">Company name</Form.Label>
            <Form.Control type="text" placeholder="Your company's name" onChange = {evt => setCompanyName(evt.target.value)} />
          </Form.Group>
          <Button className="submit-btn" variant="secondary" type="submit">Create</Button>
          {errorMessage ? (
          /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
            <Alert className="alertBox" variant='warning'>
              {errorMessage}
            </Alert>
          ): ''}
        </Form>
      </div>
    </Container>
  );
}
export default CreateCompany;

