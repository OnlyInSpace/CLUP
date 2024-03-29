import React, { useState, useEffect } from 'react';
import {Container, Button, Form, Alert} from 'react-bootstrap';
import './login.css';
import logo from './logo.png';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import {
  protectPage
} from '../verifyTokens/tokenFunctions';


function Login() {
  let history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  useEffect(() => {
    (async () => {
      try { 
        if (accessToken && refreshToken && accessToken !== 'undefined') {
          const user = await protectPage(accessToken, refreshToken);
          if (user.confirmed) history.push('/dashboard');
          else history.push('/confirmEmail');
        }
      } catch (error) {
        console.log(error);
        history.push('/');
      }
    })();
  }, []);


  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    try {
      // else if the user was not able to login,
      if (!email && !password) {
        setErrorMessage('Please enter your email and password.');
      } else if (!email && password) {
        setErrorMessage('Email field is empty.');
      } else if (email && !password) {
        setErrorMessage('Password field is empty.');
      } else {
        // Login our user via our backend login route sending with it the email & password for the req.body 
        // If the user successfully logged in, then our response will now have an access and refresh token data was returned to us
        const response = await axios.post('/user/login', {email, password});
        const accessToken = response.data.accessToken;
        const refreshToken = response.data.refreshToken;

        // If the user was able to login then let's store their tokens inside localStorage
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken, { secure: true });
          localStorage.setItem('refreshToken', refreshToken, { secure: true });
          // refresh page
          // window.location.reload(false);
          history.push('/dashboard'); // go to dashboard
        } else {
          setErrorMessage(response.data.message);
          setTimeout(() => {
            setErrorMessage('');
          }, 7000);
        }
      }
    } catch (error) {
      console.log(error);
      Promise.reject(error);
    }
  };


  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="loginContent">
        <a href='/'>
          <img src={logo} className="loginLogo" alt="Logo" /> 
        </a>
        <h3>Login</h3>
        <p>Login to your <strong>account</strong> below</p>
        <p className='testing_acc'>
          Want to use a test account? <br />
          Email: <strong>test@test.com</strong> <br />
          Password: <strong>Testing123! <br /></strong>
          <strong>Note:</strong> You won&apos;t be able to receieve email queue alerts with the test account. 
        </p>
        <Form onSubmit = {handleSubmit}>
          <Form.Group controlId="formEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" placeholder="Your email" onChange = {evt => setEmail(evt.target.value)} />
          </Form.Group>
          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Your password" onChange = {evt => setPassword(evt.target.value)}/>
          </Form.Group>
          <Form.Group>
            <Button className="btn-action2 login" type="submit">
              <span>Login</span>
            </Button>
            {errorMessage ? (
              /* ^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
              <Alert className="loginAlertBox" variant='warning'>
                {errorMessage}
              </Alert>
            ): ''}
          </Form.Group>
          <Form.Group>
            <p className="login-accountBtn">Need an account?</p>
            <Button className="secondary-btn" onClick={() => history.push('/user/register')} variant="secondary" type="button">
              New Account
            </Button>
          </Form.Group>
        </Form>
      </div>
    </Container>
  );
}

export default Login;