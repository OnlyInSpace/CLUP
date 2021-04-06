import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import './createcompany.css';
import { useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import {
  refresh,
  protectPage
} from '../verifyTokens/tokenFunctions';

// CreateCompany allows users to create their own company
function CreateCompany() {
  let history = useHistory();
  const [companyName, setCompanyName] = useState('');
  // For alert
  const [errorMessage, setErrorMessage] = useState('');
  // For success alert 
  const [successAlert, setSuccessAlert] = useState('');

  // Check user's role. If they are already an owner, then send them to the create store page
  const refreshToken = localStorage.getItem('refreshToken');

  useEffect(async () => {
    try {
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


  function goToDashboard() {
    history.push('/dashboard');
  }


  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));
  
  // Function that will talk to server api
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    try {
      if (!companyName) {
        setErrorMessage('Please enter your company\'s name.');
      } else {
        let accessToken = localStorage.getItem('accessToken');

        // Decode to get data stored in cookie
        let user = jwt.decode(accessToken);
        // When we decode a cookie using jwt.decode, we get an object called userData with the user's data stored inside
        let ownerId = user._id;

        // Make api call to create the new company 
        let headers = {
          authorization: `Bearer ${accessToken}`
        };
        let response = await api.post('/company/create', { companyName, ownerId }, { headers });
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
            accessToken = newAccessToken;
            ownerId = user._id;
            headers = {
              authorization: `Bearer ${newAccessToken}`
            };
            response = await api.post('/company/create', { companyName, ownerId }, { headers });
          }
        }


        const comapnyId = response.data._id || false;

        // Set user's role to owner so that they are able to now create stores.
        response = await api.post('/role/owner', { user_id: ownerId }, { headers });
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
            headers = {
              authorization: `Bearer ${newAccessToken}`
            };
            response = await api.post('/role/owner', { user_id: ownerId }, { headers });
          }
        }

        
        // Set user's business_id to the company's id
        response = await api.post('/business_id', { user_id: ownerId, business_id: comapnyId }, { headers });
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
            headers = {
              authorization: `Bearer ${newAccessToken}`
            };
            response = await api.post('/business_id', { user_id: ownerId, business_id: comapnyId }, { headers });
          }
        }

        // Refresh our user's token so that their role and business id are updated in localstorage
        await refresh(refreshToken);

        if (comapnyId && response.data.role === 'owner') {
          console.log('companyID:', comapnyId);
          setSuccessAlert('Company created! Now let\'s create your first store.');
          await delay(3000);
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
          <Button className="secondary-btn" variant="secondary" type="submit">
            Create company
          </Button>
          {errorMessage ? (
          /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
            <Alert className="alertBox" variant='warning'>
              {errorMessage}
            </Alert>
          ): ''}

          {successAlert ? (
          /* ^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
            <Alert className="loginAlertBox" variant='success'>
              {successAlert}
            </Alert>
          ): ''}
          <br/>
          <button className="submit-btn dashboard" onClick={goToDashboard}>
          ← Back to Dashboard
          </button>
        </Form>
      </div>
    </Container>
  );
}
export default CreateCompany;

