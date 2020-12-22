import React, { useState } from 'react';
import api from '../../services/api';
import {Container, Button, Form, Alert} from 'react-bootstrap';
import './login.css';
import logo from './logo.png';
import { useHistory } from 'react-router-dom';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const history = useHistory();

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
        // Login our user via our backend login route sending with it the email & password for the req.params 
        // If the user successfully logged in, then our response will now have whater data was returned to us
        // in the login route. In our case, the user's _id and email get returned in a json object {_id, email} 
        const response = await api.post('/login', {email, password});
        const userId = response.data._id || false;
        // If the user was able to login then let's store their _id inside their browser's local storage
        if (userId) {
          localStorage.setItem('user', userId);
          history.push('/');
        } else {
          console.log(response.data);
        }
      }
    } catch (error) {
      Promise.reject(error);
      console.log(error);
    }
  };

  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        <img src={logo} className="mainLogo" alt="Logo" /> 
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
            <p className="register-p">Need an <strong>account</strong>?</p>
            <Button className="secondary-btn" onClick={() => history.push('/user/register')} variant="secondary" type="button">
              New Account
            </Button>
          </Form.Group>
        </Form>
      </div>
    </Container>
  );
}