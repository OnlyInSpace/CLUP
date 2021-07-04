import React, { useState } from 'react';
import { Container, Button, Form, Alert, Row, Col } from 'react-bootstrap';
import './register.css';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import logo from '../Login/logo.png';


function Register() {
  let history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  // Phone number text boxes
  const [firstNums, setFirstNums] = useState('');
  const [secondNums, setSecondNums] = useState('');
  const [thirdNums, setThirdNums] = useState('');
  // Confirm notify message
  const [confirmMessage, setConfirmMessage] = useState(false);
  
  console.log(firstNums + secondNums + thirdNums);
  // Function that will talk to server api
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    try {
      var phoneNumber = firstNums + secondNums + thirdNums;
      // Missing information and validation checks
      if (!phoneNumber && email && password) {
        setErrorMessage('Phone number field is empty.');
        await delay(4000);
        setErrorMessage('');
        return;
      } else if (phoneNumber && !email && password) {
        setErrorMessage('Email field is empty.');
        await delay(4000);
        setErrorMessage('');
        return;
      } else if (phoneNumber && email && !password) {
        setErrorMessage('Password field is empty.');
        await delay(4000);
        setErrorMessage('');
        return;
      } else if (!phoneNumber || !email || !password || !confirmPassword) {
        setErrorMessage('Required information is missing.');
        await delay(4000);
        setErrorMessage('');
        return;
      } else if (phoneNumber.length !== 10 || isNaN(phoneNumber)) { // Ensure phone number is valid
        setErrorMessage('Invalid phone number. Please enter numbers.');
        await delay(5000);
        setErrorMessage('');
        return;
      } else if (password !== confirmPassword) { // Ensure passwords match
        setErrorMessage('Passwords don\'t match');
        await delay(4000);
        setErrorMessage('');
        return;
      } else if (!password.match(/^(?=.*?[A-Za-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/)) { // Ensure password restrictions
        setErrorMessage('Password must contain at least 8 characters, 1 letter, 1 number, and 1 symbol.');
        await delay(12000);
        setErrorMessage('');
        return;
      }

      // If every input is valid, go ahead and register the user!
      const response = await axios.post('/user/register', {phoneNumber, email, password});
      const accessToken = response.data.accessToken;
      const refreshToken = response.data.refreshToken;

      console.log(accessToken);

      // If the user was able to register then send them to dashboard and store their data in Cookies
      if (accessToken) {
        // Store user refresh and access token in a Cookie with secure option set, meaning this cookie is only readable on HTTPS.
        localStorage.removeItem('store');
        localStorage.setItem('accessToken', accessToken, { secure: true });
        localStorage.setItem('refreshToken', refreshToken, { secure: true });
        setConfirmMessage(true);
      } else { // Else if 
        setErrorMessage(response.data.message);
        await delay(5000);
        setErrorMessage('');
      }
    } catch (error) {
      Promise.reject(error);
      console.log(error);
    }
  };
    

  function handlePhoneChange(event) {
    const { maxLength, value, name } = event.target;
    const nameNumber = name.split('-');
    const fieldIndex = nameNumber[1];

    // If length of value is at maxLength 
    if (value.length === maxLength) {
      // Read as decimal 10, here we are ensureing that it is not the last input field
      let nextSibling;
      if (parseInt(fieldIndex, 10) < 3) {
        // get next input field
        nextSibling = document.querySelector(`input[name=phoneNum-${parseInt(fieldIndex, 10) + 1}]`);
      }

      if (name === 'phoneNum-1') {
        setFirstNums(value);
      } else if (name === 'phoneNum-2') {
        setSecondNums(value);
      } else if (name === 'phoneNum-3') {
        setThirdNums(value);
      }

      // If input field found, the focus it
      if (nextSibling) {
        nextSibling.focus();
      }
    }
  }

  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));


  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="registerContent">
        <a href='/'>
          <img src={logo} className="loginLogo" alt="Logo" /> 
        </a>

        { !confirmMessage &&
        <React.Fragment>
          <h4>Creating an account allows you to:</h4>
          <Form onSubmit = {handleSubmit}>
            <ul className='registerList'>
              <li><strong>Schedule visits</strong>, <strong>view store occupancy</strong>, and join a <strong>customer queue</strong> all from your device.</li>
              <li>Business owners can <strong>create, manage,</strong> and <strong>assign</strong> employees to their own stores.</li>
            </ul>
            <h3>Signup below</h3>
            <Form.Group controlId="formPhoneNum">
              <Form.Label className="phoneDescription">Phone number (For visit confirmations)</Form.Label>
              <Row className='row-register'>
                <Col className='col-register1 col-margins'>
                  <Form.Control name='phoneNum-1' type="text" maxLength='3' onChange={evt => handlePhoneChange(evt)} />
                </Col>
                <Col className='reg-symbols hyphen1'>-</Col>
                <Col className='col-register1 col-margins'>
                  <Form.Control name='phoneNum-2' type="text" maxLength='3' onChange={evt => handlePhoneChange(evt)} />
                </Col>
                <Col className='reg-symbols hyphen1'>-</Col>
                <Col className='col-register2 col-margins'>
                  <Form.Control name='phoneNum-3' type="text" maxLength='4' onChange={evt => handlePhoneChange(evt)} />
                </Col>
              </Row>
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
          </Form>
        </React.Fragment>
        }

        { confirmMessage && 
        <Alert variant='success'>Please check your email inbox to confirm your account.</Alert>
        }
        { errorMessage ? (
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
      </div>
    </Container>
  );
}
export default Register;