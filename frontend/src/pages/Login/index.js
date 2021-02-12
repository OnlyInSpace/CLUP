import React, { useState } from 'react';
import {Container, Button, Form, Alert} from 'react-bootstrap';
import './login.css';
import logo from './logo.png';
import { useHistory } from 'react-router-dom';
import auth from '../../services/auth';


function Login() {
  let history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  // Function that will talk to server api
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
        const response = await auth.post('/login', {email, password});
        const accessToken = response.data.accessToken;
        const refreshToken = response.data.refreshToken;

        // If the user was able to login then let's store their tokens inside localStorage
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken, { secure: true });
          localStorage.setItem('refreshToken', refreshToken, { secure: true });
          console.log('accessToken:', accessToken);
          history.push('/dashboard'); // go to dashboard
        } else {
          setErrorMessage(response.data.message);
          console.log(response.data);
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
      <div className="content">
        <img src={logo} className="loginLogo" alt="Logo" /> 
        <h3>Login</h3>
        <p>Login to your <strong>account</strong> below</p>
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
            <Button className="submit-btn" variant="secondary" type="submit">Login</Button>
            {errorMessage ? (
              /* ^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
              <Alert className="alertBox" variant='warning'>
                {errorMessage}
              </Alert>
            ): ''}
          </Form.Group>
          <Form.Group>
            <p className="register-p">Need an account?</p>
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