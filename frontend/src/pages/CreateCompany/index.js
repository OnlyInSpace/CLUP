import React, { useState } from 'react';
import auth from '../../services/auth';
import api from '../../services/api';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import './createcompany.css';
import Cookies from 'js-cookie';
import { useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';

// CreateCompany allows users to create their own company
function CreateCompany() {
  let history = useHistory();
  const [companyName, setCompanyName] = useState('');
  // For alert
  const [errorMessage, setErrorMessage] = useState('');
  // For backend
  const [errMessage, setErrMessage] = useState('');


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
      Cookies.set('accessToken', newAccessToken, { secure: true });
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

  
  // Function that will talk to server api
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    try {
      if (!companyName) {
        setErrorMessage('Please enter your company\'s name.');
      } else {
        let accessToken = Cookies.get('accessToken');
        let refreshToken = Cookies.get('refreshToken');

        // Decode to get data stored in cookie
        let owner = jwt.decode(accessToken);
        // When we decode a cookie using jwt.decode, we get an object called userData with the user's data stored inside
        let ownerId = owner._id;

        // Make api call to create the new company 
        let response = await api.post('/company/create', { companyName, ownerId }, { headers: {'accessToken': accessToken }});

        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            setErrMessage('Please log in again.');
            console.log(errMessage);
            history.push('/login');
          } else {
          // overwrite response with the new access token.
            let newAccessToken = Cookies.get('accessToken');
            ownerId = user._id;
            response = await api.post('/company/create', { companyName, ownerId}, { headers: {'accessToken': newAccessToken }});
          }
        }
      
        // Our response is a JSON object that holds the newly created company and it's properties {_id, companyName, ownerId }
        const comapnyId = response.data._id || false;
        if (comapnyId) {
          console.log('companyID:',comapnyId);
          history.push('/store/create');
        } else {
          setErrorMessage(response.data.message);
        }
      }
    } catch (error) {
      console.log(error);
      history.push('/login');
    }
  };


  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        <h3>Company Creation</h3>
        <ul className="createComplist">
          <li>Give your <strong>company</strong> name.</li>
          <li>Your company can own multiple stores. We will create your first store on the next page.</li>
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

