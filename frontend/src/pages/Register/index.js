import React, { useState } from 'react';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import './register.css';
import PropTypes from 'prop-types';
import { useHistory, withRouter } from 'react-router-dom';
import auth from '../../services/auth';


function Register() {
  let history = useHistory();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  

  // Function that will talk to server api
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();

    try {
      // Missing information checks
      if (!phoneNumber && email && password) {
        setErrorMessage('Phone number field is empty.');
        return;
      } else if (phoneNumber && !email && password) {
        setErrorMessage('Email field is empty.');
        return;
      } else if (phoneNumber && email && !password) {
        setErrorMessage('Password field is empty.');
        return;
      } else if (!phoneNumber || !email || !password || !confirmPassword) {
        setErrorMessage('Required information is missing.');
        return;
      }
      // Ensure phone number is valid
      if (phoneNumber.length !== 10 ) {
        setErrorMessage('Invalid phone number');
        return;
      }
      // Ensure passwords match
      if (password !== confirmPassword) {
        setErrorMessage('Passwords don\'t match');
        return;
      }
      // Ensure password restrictions
      if (!password.match(/^(?=.*?[A-Za-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/)) {
        setErrorMessage('Password must contain at least 8 characters, 1 letter, 1 number, and 1 symbol.');
        return;
      }

      // If every input is valid, go ahead and register the user!
      const response = await auth.post('/user/register', {phoneNumber, email, password});
      const accessToken = response.data.accessToken;
      const refreshToken = response.data.refreshToken;

      // If the user was able to register then send them to dashboard and store their data in Cookies
      if (accessToken) {
        // Store user refresh and access token in a Cookie with secure option set, meaning this cookie is only readable on HTTPS.
        localStorage.removeItem('store');
        localStorage.setItem('accessToken', accessToken, { secure: true });
        localStorage.setItem('refreshToken', refreshToken, { secure: true });
        history.push('/dashboard');
      } else { // Else if 
        setErrorMessage(response.data.message);
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
        <h3>Signup</h3>
        <p>Register your <strong>new account</strong> below</p>
        <Form onSubmit = {handleSubmit}>
          <Form.Group controlId="formPhoneNum">
            <Form.Label className="phoneDescription">Phone number <br></br> (For sending you <strong>specific alerts</strong>)</Form.Label>
            <Form.Control type="number" placeholder="Your phone number" onChange = {evt => setPhoneNumber(evt.target.value)} />
          </Form.Group>
          <Form.Group controlId="formEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" placeholder="Your email" onChange = {evt => setEmail(evt.target.value)} />
          </Form.Group>
          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Your password" onChange = {evt => setPassword(evt.target.value)}/>
          </Form.Group>
          <Form.Group controlId="formPassword">
            <Form.Label>Confirm password</Form.Label>
            <Form.Control type="password" placeholder="Confirm password" onChange = {evt => setConfirmPassword(evt.target.value)}/>
          </Form.Group>
          <Button className="submit-btn" variant="secondary" type="submit">Signup</Button>
          {errorMessage ? (
          /* ^^^^^^^^^^^^^^^^ is a ternary operator: is errorMessage undefined? If no, then display the alert*/
            <Alert className="alertBox" variant='warning'>
              {errorMessage}
            </Alert>
          ): ''}
          <Form.Group>
            <p className="register-p">Already have an <strong>account</strong>?</p>
            <Button className="secondary-btn" onClick={() => history.push('/login')} variant="secondary" type="button">
                Login
            </Button>
          </Form.Group>
        </Form>
      </div>
    </Container>
  );
}
export default withRouter(Register);

// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
Register.propTypes = {
  history: PropTypes.object.isRequired
};