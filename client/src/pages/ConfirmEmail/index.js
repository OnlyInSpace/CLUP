import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Alert } from 'react-bootstrap';
import './confirmEmail.css';
import { useHistory } from 'react-router-dom';
import {
  refresh,
  protectPage
} from '../verifyTokens/tokenFunctions';
import logo from '../LandingPage/img/logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


function ConfirmEmail() {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let controller = new AbortController();
    (async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        let accessToken = localStorage.getItem('accessToken');
        // Ensure user has tokens
        if (!accessToken || !refreshToken || accessToken === 'undefined')
          history.push('/');

        // Ensure tokens are legit
        let user = await protectPage(accessToken, refreshToken);
        accessToken = localStorage.getItem('accessToken');
        if (!user) {
          history.push('/');
          return;
        } 
        if (user.confirmed) {
          history.push('/dashboard');
          return;
        } 

        // Confirm user's account
        setLoading(true);
        await delay(2000);
        let headers = { authorization: `Bearer ${accessToken}` };
        await axios.put(`/user/confirmEmail/${user._id}`, { }, { signal: controller.signal, headers });
        setLoading(false);
        setConfirmed(true);
        await delay(2000);
        // Refresh user's token
        await refresh(refreshToken);
        history.push('/dashboard');
      } catch (error) {
        console.log(error);
      }
    })();
    return () => controller?.abort();
  }, []);
    

  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));
    
  return (
    <Container>
      <div className='content'>
        <a href='/'>
          <img className='confirm-logo' src={logo} alt="Company logo" /> 
        </a>
        <h3>Email Confirmation</h3>
        { loading &&
          <p><FontAwesomeIcon className='spinner' icon="circle-notch" spin /> Confirming . . .</p>
        }
        { confirmed && 
          <Alert variant='success'>Confirmed! Redirecting. . .</Alert>
        }
        <button onClick={() => history.push('/')} className='submit-btn'>Home</button>
      </div>
    </Container>
  );
}

export default ConfirmEmail;