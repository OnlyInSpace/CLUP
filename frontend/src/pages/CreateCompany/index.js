import React, { useState } from 'react';
import api from '../../services/api';
import { Container, Button, Form, Alert } from 'react-bootstrap';
import './createcompany.css';
import PropTypes from 'prop-types';

// CreateCompany allows users to create their own store
export default function CreateCompany({ history }) {
  const ownerId = localStorage.getItem('user');
  const [companyName, setCompanyName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  console.log(companyName);

  // Function that will talk to server api
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    try {
      if (!companyName) {
        setErrorMessage('Please enter your company\'s name.');
      } else {
        const response = await api.post('/company/create', { companyName, ownerId });
        // Our response is a JSON object that holds the newly created company and it's properties {_id, companyName, ownerId }
        const comapnyId = response.data._id || false;
        console.log('company id: ', comapnyId);
        if (comapnyId) {
          history.push('/store/create');
        } else {
          setErrorMessage('This company already exists in our system.');
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
        <h3>Company Creation</h3>
        <ul className="list">
          <li>Give your <strong>company</strong> name.</li>
          <li>Your company can own multiple stores. We will create your first store on the next page.</li>
          <li> Both your company and store name(s) can be the same.</li>
        </ul>
        <Form onSubmit = {handleSubmit}>
          <Form.Group controlId="formCompanyName">
            <Form.Label className="companyName">Company name</Form.Label>
            <Form.Control type="text" placeholder="Your company's name" onChange = {evt => setCompanyName(evt.target.value)} />
          </Form.Group>
          <Button className="submit-btn" variant="secondary" type="submit">Create</Button>
          {errorMessage ? (
          /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
            <Alert className="alertBox" variant='warning'>
              {errorMessage}
            </Alert>
          ): ''}
        </Form>
      </div>
    </Container>
  );
}

// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
CreateCompany.propTypes = {
  history: PropTypes.object.isRequired
};