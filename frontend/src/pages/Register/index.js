import React, { useState } from 'react';
import api from '../../services/api';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import './register.css';

export default function Register({ history }) {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Function that will talk to server api
    const handleSubmit = async evt => {
        // Prevent default event when button is clicked
        evt.preventDefault();

        try {
          // else if the user was not able to register,
          if (!phoneNumber && email && password) {
            setErrorMessage("Phone number field is empty.");
            return;
          } else if (phoneNumber && !email && password) {
            setErrorMessage("Email field is empty.")
            return;
          } else if (phoneNumber && email && !password) {
            setErrorMessage("Password field is empty.");
            return;
          } else if (!phoneNumber || !email || !password) {
            setErrorMessage("Required information is missing.");
            return;
          }
          const response = await api.post('/user/register', {phoneNumber, email, password});
          const userId = response.data._id || false;
          // If the user was able to register then let's store their _id inside their browser's local storage
          if (userId) {
              localStorage.setItem('user', userId);
              history.push('/login');
          } else {
              setErrorMessage("This account already exists.");
          }
        } catch (error) {
          Promise.reject(error);
          console.log(error);
        }
    }
    
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
          <Button className="submit-btn" variant="secondary" type="submit">Signup</Button>
          {errorMessage ? (
      /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox" variant='warning'>
            {errorMessage}
          </Alert>
        ): ""}
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