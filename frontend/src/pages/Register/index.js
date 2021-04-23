import React, { useState } from 'react';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import './register.css';
import PropTypes from 'prop-types';
import { useHistory, withRouter } from 'react-router-dom';
import auth from '../../services/auth';
import logo from '../Login/logo.png';


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
      // Missing information and validation checks
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
      } else if (phoneNumber.length !== 10 || isNaN(phoneNumber)) { // Ensure phone number is valid
        setErrorMessage('Invalid phone number. Please enter a 10 digit number without any hyphens or parentheses.');
        return;
      } else if (password !== confirmPassword) { // Ensure passwords match
        setErrorMessage('Passwords don\'t match');
        return;
      } else if (!password.match(/^(?=.*?[A-Za-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/)) { // Ensure password restrictions
        setErrorMessage('Password must contain at least 8 characters, 1 letter, 1 number, and 1 symbol.');
        return;
      }

      // If every input is valid, go ahead and register the user!
      const response = await auth.post('/user/register', {phoneNumber, email, password});
      const accessToken = response.data.accessToken;
      const refreshToken = response.data.refreshToken;

      console.log(accessToken);

      // If the user was able to register then send them to dashboard and store their data in Cookies
      if (accessToken) {
        // Store user refresh and access token in a Cookie with secure option set, meaning this cookie is only readable on HTTPS.
        localStorage.removeItem('store');
        localStorage.setItem('accessToken', accessToken, { secure: true });
        localStorage.setItem('refreshToken', refreshToken, { secure: true });
        history.push('/findstore');
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
      <div className="registerContent">
        <a href='/'>
          <img src={logo} className="loginLogo" alt="Logo" /> 
        </a>
        <h4>Creating an account allows you to:</h4>
        <Form onSubmit = {handleSubmit}>
          <ul className='registerList'>
            <li><strong>Schedule visits</strong>, <strong>view store occupancy</strong>, and join a <strong>customer queue</strong> all from your device.</li>
            <li>Business owners can <strong>create, manage,</strong> and <strong>assign</strong> employees to their own stores.</li>
          </ul>
          <h3>Signup below</h3>
          <Form.Group controlId="formPhoneNum">
            <Form.Label className="phoneDescription">Phone number (For visit alerts)</Form.Label>
            <Form.Control type="text" placeholder="Your phonenumber (numbers only)" onChange = {evt => setPhoneNumber(evt.target.value)} />
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
          <Button className="btn-action2 signup" type="submit">
            <span>Create your account</span>
          </Button>
          {errorMessage ? (
          /* ^^^^^^^^^^^^^^^^ is a ternary operator: is errorMessage undefined? If no, then display the alert*/
            <Alert className="alertBox" variant='warning'>
              {errorMessage}
            </Alert>
          ): ''}
          <Form.Group>
            <p className="register-account">Already have an account?</p>
            <Button className="secondary-btn" onClick={() => history.push('/login')} type="button">
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