import React, { useState } from 'react';
import api from '../../services/api';
import { Container, Button, Form, Col, Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';

//  CreateCompany allows users to create their own store
//  TODO: Create a (?) icon next to each box to reveal more information about the option
//    ex: For maximum amount of customer allowed to visit one group    (?)
// (*once icon hovered reveal this message*): We know that customers can either come alone or in groups with one or more person.
//                                            This option sets how large that group can be. For instance, if you only want customers 
//                                            to arrive alone, then this option to be set to 1. However, if you want customers to 
//                                            arrive in groups of up to 6, then this option would be set to 6. We will make sure customers
//                                            can't schedule visits or join queues with groups larger than what you've set them here to be.
export default function CreateStore({history}) {
  const [storeName, setStoreName] = useState('');
  const [maxOccupants, setMaxOccupants] = useState('');
  const [maxPartyAllowed, setMaxPartyAllowed] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Function that will talk to server api
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    // Get store owner's id from local browswer storage
    try {
      if (!storeName || !maxOccupants || !maxPartyAllowed || !city || !state || !address1 || !postalCode) {
        setErrorMessage('Missing required information.');
      } else {
        const ownerId = localStorage.getItem('user');
        const location = {city, state, address1, address2, postalCode};
        const response = await api.post('/store/create', { storeName, location, maxOccupants, maxPartyAllowed });
        const storeId = response.data._id || false;
        // Store the store in it's respective company
        if (storeId) {
          await api.post('/store/setStoreCompany', {storeId, ownerId});
          history.push('/');
        } else {
          setErrorMessage('This store already exists.');
        }
      }
    } catch (error) {
      Promise.reject(error);
      console.log(error);
    }
  };

  // everything inside the return is JSX (looks exactly like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        <h3>Create a Store</h3>
        <p>Create your <strong>store</strong> below</p>
        <Form onSubmit = {handleSubmit}>
          <Form.Group controlId="formStoreName">
            <Form.Label>Store name</Form.Label>
            <Form.Control placeholder="Your store's name" onChange = {evt => setStoreName(evt.target.value)}/>
          </Form.Group>
          <Form.Group controlId="formMaxOccupants">
            <Form.Label>Maximum amount of occupants allowed</Form.Label>
            <Form.Control type='number' placeholder="Number" onChange = {evt => setMaxOccupants(evt.target.value)}/>
          </Form.Group>
          <Form.Group controlId="formMaxPartyAllowed">
            <Form.Label>Maximum amount of customers allowed to visit in one group </Form.Label>
            <Form.Control type='number' placeholder="Number" onChange = {evt => setMaxPartyAllowed(evt.target.value)}/>
          </Form.Group>
          <Form.Group controlId="formAddress1">
            <Form.Label>Address</Form.Label>
            <Form.Control placeholder="1234 Main St" onChange = {evt => setAddress1(evt.target.value)}/>
          </Form.Group>

          <Form.Group controlId="formAdress2">
            <Form.Label>Address 2</Form.Label>
            <Form.Control defaultValue="" placeholder="Apartment, studio, or floor" onChange = {evt => setAddress2(evt.target.value)} />
          </Form.Group>

          <Form.Row>
            <Form.Group as={Col} controlId="formCity">
              <Form.Label>City</Form.Label>
              <Form.Control onChange = {evt => setCity(evt.target.value)}/>
            </Form.Group>
            <Form.Group as={Col} controlId="formSelectState">
              <Form.Label>State</Form.Label>
              <Form.Control as="select" onChange = {evt => setState(evt.target.value)}>
                <option>Choose...</option>
                <option value="AL">Alabama (AL)</option>
                <option value="AK">Alaska (AK)</option>
                <option value="AZ">Arizona (AZ)</option>
                <option value="AR">Arkansas (AR)</option>
                <option value="CA">California (CA)</option>
                <option value="CO">Colorado (CO)</option>
                <option value="CT">Connecticut (CT)</option>
                <option value="DE">Delaware (DE)</option>
                <option value="DC">District Of Columbia (DC)</option>
                <option value="FL">Florida (FL)</option>
                <option value="GA">Georgia (GA)</option>
                <option value="HI">Hawaii (HI)</option>
                <option value="ID">Idaho (ID)</option>
                <option value="IL">Illinois (IL)</option>
                <option value="IN">Indiana (IN)</option>
                <option value="IA">Iowa (IA)</option>
                <option value="KS">Kansas (KS)</option>
                <option value="KY">Kentucky (KY)</option>
                <option value="LA">Louisiana (LA)</option>
                <option value="ME">Maine (ME)</option>
                <option value="MD">Maryland (MD)</option>
                <option value="MA">Massachusetts (MA)</option>
                <option value="MI">Michigan (MI)</option>
                <option value="MN">Minnesota (MN)</option>
                <option value="MS">Mississippi (MS)</option>
                <option value="MO">Missouri (MO)</option>
                <option value="MT">Montana (MT)</option>
                <option value="NE">Nebraska (NE)</option>
                <option value="NV">Nevada (NV)</option>
                <option value="NH">New Hampshire (NH)</option>
                <option value="NJ">New Jersey (NJ)</option>
                <option value="NM">New Mexico (NM)</option>
                <option value="NY">New York (NY)</option>
                <option value="NC">North Carolina (NC)</option>
                <option value="ND">North Dakota (ND)</option>
                <option value="OH">Ohio (OH)</option>
                <option value="OK">Oklahoma (OK)</option>
                <option value="OR">Oregon (OR)</option>
                <option value="PA">Pennsylvania (PA)</option>
                <option value="RI">Rhode Island (RI)</option>
                <option value="SC">South Carolina (SC)</option>
                <option value="SD">South Dakota (SD)</option>
                <option value="TN">Tennessee (TN)</option>
                <option value="TX">Texas (TX)</option>
                <option value="UT">Utah (UT)</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
              </Form.Control>
            </Form.Group>

            <Form.Group as={Col} controlId="formPostalCode">
              <Form.Label>Postal Code</Form.Label>
              <Form.Control type='number' onChange = {evt => setPostalCode(evt.target.value)}/>
            </Form.Group>
          </Form.Row>
          <p>All of these settings will be <strong>changeable</strong> after clicking the submit button.</p>
          <Button className="submit-btn" variant="secondary" type="submit">
              Submit
          </Button>
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

CreateStore.propTypes = {
  history: PropTypes.object.isRequired
};