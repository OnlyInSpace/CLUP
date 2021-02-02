import React from 'react';
import {Container, Button, Form} from 'react-bootstrap';
import './landing.css';
import { useHistory } from 'react-router-dom';


function Login() {
  let history = useHistory();


  // Function that will talk to server api
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    history.push('/login');
  };

  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        <h3>Landing Page</h3>
        <p>Login to your <strong>account</strong> below</p>
        <Form onSubmit = {handleSubmit}>
          <Form.Group>
            <Button className="submit-btn" variant="secondary" type="submit">Login</Button>
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