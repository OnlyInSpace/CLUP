import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Container, Form, Row, Col, Alert } from 'react-bootstrap';
import { Checkbox } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import './createstore.css';
import PropTypes from 'prop-types';
import {
  protectPage
} from '../verifyTokens/tokenFunctions';


//  CreateCompany allows users to create their own store
//  TODO: Create tool tips (?) icon next to each box to reveal more information about the option
//    ex: For maximum amount of customer allowed to visit one group    (?)
// (*once icon hovered reveal this message*): We know that customers can either come alone or in groups with one or more person.
//                                            This option sets how large that group can be. For instance, if you only want customers 
//                                            to arrive alone, then this option to be set to 1. However, if you want customers to 
//                                            arrive in groups of up to 6, then this option would be set to 6. We will make sure customers
//                                            can't schedule visits or join queues with groups larger than what you've set them here to be.
function CreateStore() {
  let history = useHistory();
  const [storeName, setStoreName] = useState('');
  const [maxOccupants, setMaxOccupants] = useState('');
  const [maxPartyAllowed, setMaxPartyAllowed] = useState('');
  const [avgVisitLength, setAvgVisitLength] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [postalCode, setPostalCode] = useState('');
  // Days for checkmark selection
  const [sunday, setSunday] = useState(false);
  const [monday, setMonday] = useState(false);
  const [tuesday, setTuesday] = useState(false);
  const [wednesday, setWednesday] = useState(false);
  const [thursday, setThursday] = useState(false);
  const [friday, setFriday] = useState(false);
  const [saturday, setSaturday] = useState(false);
  // Open and close times 
  const [openSun, setOpenSun] = useState('');
  const [closeSun, setCloseSun] = useState('');
  const [openMon, setOpenMon] = useState('');
  const [closeMon, setCloseMon] = useState('');
  const [openTues, setOpenTues] = useState('');
  const [closeTues, setCloseTues] = useState('');
  const [openWed, setOpenWed] = useState('');
  const [closeWed, setCloseWed] = useState('');
  const [openThurs, setOpenThurs] = useState('');
  const [closeThurs, setCloseThurs] = useState('');
  const [openFri, setOpenFri] = useState('');
  const [closeFri, setCloseFri] = useState('');
  const [openSat, setOpenSat] = useState('');
  const [closeSat, setCloseSat] = useState('');
  // If store is open 24/7
  const [open24hours, setOpen24Hours] = useState(false);
  // For alert 
  const [errorMessage, setErrorMessage] = useState('');
  // For success alert 
  const [successAlert, setSuccessAlert] = useState('');
  // User's role
  const [ userRole, setUserRole ] = useState(''); 
  // prevent spam click
  const [doubleClick, setDoubleClick] = useState(false);

  const refreshToken = localStorage.getItem('refreshToken');
  let accessToken = localStorage.getItem('accessToken');


  // Set user's role
  useEffect(() => {
    (async () => {
      try {
        // Get user data and refresh token if needed.
        let user = await protectPage(accessToken, refreshToken);

        if (user.role !== 'owner') {
          history.push('/company/create');
        }
           
        setUserRole(user.role);

      } catch (error) {
        console.log(error);
      }
    })();
  }, []);


  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));
  
  
  // Function that will talk to make axios request to create store
  const handleSubmit = async (evt) => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    setDoubleClick(true);
    try {
      let user = await protectPage(accessToken, refreshToken);
      let user_id = user._id;
        
      // Get company_id
      accessToken = localStorage.getItem('accessToken');
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let response = await api.get(`/company/${user_id}`, { headers });

      // Company_id is needed to be passed to create store
      const company_id = response.data._id;
      // Create businessHours object
      const businessHours = {
        sunday: {
          enabled: sunday,
          day: 'Sun.',
          open: openSun,
          close: closeSun
        },
        monday: {
          enabled: monday,
          day: 'Mon.', 
          open: openMon,
          close: closeMon
        },
        tuesday: {
          enabled: tuesday,
          day: 'Tue.', 
          open: openTues,
          close: closeTues
        },
        wednesday: {
          enabled: wednesday,
          day: 'Wed.', 
          open: openWed,
          close: closeWed
        },
        thursday: {
          enabled: thursday,
          day: 'Thu.', 
          open: openThurs,
          close: closeThurs
        },
        friday: {
          enabled: friday,
          day: 'Fri.', 
          open: openFri,
          close: closeFri
        },
        saturday: {
          enabled: saturday,
          day: 'Sat.', 
          open: openSat,
          close: closeSat
        } 
      };

      const location = {city, state, address1, address2, postalCode};
      response = await api.post('/store/create', { company_id, storeName, location, maxOccupants, maxPartyAllowed, avgVisitLength, open24hours, businessHours }, { headers });

      // Display warning if validation checks fail
      if (response.data.message) {
        setErrorMessage(response.data.message);
        setDoubleClick(false);
        await delay(8000);
        setErrorMessage('');
        return;
      }
      
      const store_id = response.data._id;
      // Set store_id in cookies
      localStorage.setItem('store', store_id);
      setSuccessAlert('Store created! You are being redirected.');
      await delay(3000);
      history.push('/dashboard');
    } catch (error) {
      console.log(error);
    }
  };


  // everything inside the return is JSX (looks exactly like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        <h3>Create a Store</h3>
        {/* Main store content */}
        { userRole === 'owner' ? 
          <React.Fragment>
            <Form className="createStoreForm">
              <Form.Group controlId="formStoreName">
                <Form.Label className='labels'>Store name</Form.Label>
                <Form.Control placeholder="Your store's name" onChange={evt => setStoreName(evt.target.value)}/>
              </Form.Group>
              <Form.Group controlId="formAddress1">
                <Form.Label className='labels'>Address</Form.Label>
                <Form.Control placeholder="1234 Main St" onChange = {evt => setAddress1(evt.target.value)}/>
              </Form.Group>

              <Form.Group controlId="formAdress2">
                <Form.Label className='labels'>Address 2</Form.Label>
                <Form.Control defaultValue="" placeholder="Apartment, studio, or floor" onChange = {evt => setAddress2(evt.target.value)} />
              </Form.Group>

              <Row className="row">
                <Col>
                  <Form.Label className='labels'>City</Form.Label>
                  <Form.Control placeholder='City' onChange = {evt => setCity(evt.target.value)}/>
                </Col>
                <Col>
                  <Selectstate setState={setState} />
                </Col>
              </Row>

              <Form.Group>
                <Form.Label className='labels'>Postal Code (Numbers only)</Form.Label>
                <Form.Control maxLength='5' placeholder='Number' type='text' onChange = {evt => setPostalCode(evt.target.value)}/>
              </Form.Group>
              <Form.Group controlId="formMaxOccupants">
                <Form.Label className='labels'>Maximum number of occupants allowed</Form.Label>
                <Form.Control type='text' placeholder="Number" onChange={evt => setMaxOccupants(evt.target.value)}/>
              </Form.Group>
              <Form.Group controlId="formMaxPartyAllowed">
                <Form.Label className='labels'>Maximum number of customers allowed to visit in one group </Form.Label>
                <Form.Control type='text' placeholder="Number" onChange={evt => setMaxPartyAllowed(evt.target.value)}/>
              </Form.Group>
              <Form.Group controlId="formAvgLength">
                <Form.Label className='labels'>Average length of a customer&apos;s visit <br/>(in minutes)</Form.Label>
                <Form.Control type='text' placeholder="Number" onChange={evt => setAvgVisitLength(evt.target.value)}/>
              </Form.Group>


              <p className="createStoreHours"><strong>Business Hours</strong></p>
              <p className="open_24"><strong>Open 24/7?</strong><br/> Just checkmark the box below and ignore filling out each day&apos;s hours</p>
              <Checkmarkbox day="Open 24/7" setCheckState={setOpen24Hours} />
              <Row>
                <Col>
                  <p className="notOpen_24"><strong>Not open 24/7?</strong><br/>Checkmark which days the store is open and set your open and close times.</p>
                </Col>
              </Row>

              {/* CHECKBOXES */}
              <Row>
                <Checkmarkbox day="Sun." setCheckState={setSunday} />
                <Selecthours openclose="open" setTimeState={setOpenSun} />
                <Selecthours openclose="close" setTimeState={setCloseSun} />
              </Row>

              <Row>
                <Checkmarkbox day="Mon." setCheckState={setMonday} />
                <Selecthours openclose="open" setTimeState={setOpenMon} />
                <Selecthours openclose="close" setTimeState={setCloseMon} />
              </Row>

              <Row>
                <Checkmarkbox day="Tues." setCheckState={setTuesday} />
                <Selecthours openclose="open" setTimeState={setOpenTues} />
                <Selecthours openclose="close" setTimeState={setCloseTues} />
              </Row>

              <Row>
                <Checkmarkbox day="Wed." setCheckState={setWednesday} />
                <Selecthours openclose="open" setTimeState={setOpenWed} />
                <Selecthours openclose="close" setTimeState={setCloseWed} />
              </Row>

              <Row>
                <Checkmarkbox day="Thu." setCheckState={setThursday} />
                <Selecthours openclose="open" setTimeState={setOpenThurs} />
                <Selecthours openclose="close" setTimeState={setCloseThurs} />
              </Row>

              <Row>
                <Checkmarkbox day="Fri." setCheckState={setFriday} />
                <Selecthours openclose="open" setTimeState={setOpenFri} />
                <Selecthours openclose="close" setTimeState={setCloseFri} />
              </Row>

              <Row>
                <Checkmarkbox day="Sat." setCheckState={setSaturday} />
                <Selecthours openclose="open" setTimeState={setOpenSat} />
                <Selecthours openclose="close" setTimeState={setCloseSat} />
              </Row>
              {/* CHECKBOX_END */}


              <p>Note: <br/> All of these settings will be <strong>changeable</strong> after clicking the submit button.</p>

              { !doubleClick &&
                <button onClick={handleSubmit} className="secondary-btn">
                  Create store
                </button>
              }
      
              {errorMessage ? (
              /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
                <Alert className="alertBox" variant='warning'>
                  {errorMessage}
                </Alert>
              ): ''}
              {successAlert ? (
              /* ^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
                <Alert className="loginAlertBox" variant='success'>
                  {successAlert}
                </Alert>
              ): ''}
            </Form>
          </React.Fragment>
          : 
          <p>Before you can create a store, you have to first create a <a href='/company/create'><strong>company here</strong></a></p>
        }
        <button className="submit-btn dashboard" onClick={() => history.push('/dashboard')}>
          ← Dashboard
        </button>
      </div>
    </Container>
  );
}
export default CreateStore;

function Selecthours({setTimeState, openclose}) {
  // Here we can define state variables that will only be used by this component
  return (
    <Col>
      <Form.Label>{openclose}</Form.Label> 
      <Form.Control className="selecthours" as="select" onChange={evt => setTimeState(evt.target.value)}>
        <option value="">Time</option>
        <option value="07:00">07:00 AM</option>
        <option value="07:15">07:15 AM</option>
        <option value="07:30">07:30 AM</option>
        <option value="07:45">07:45 AM</option>
        <option value="08:00">08:00 AM</option>
        <option value="08:15">08:15 AM</option>
        <option value="08:30">08:30 AM</option>
        <option value="08:45">08:45 AM</option>
        <option value="09:00">09:00 AM</option>
        <option value="09:15">09:15 AM</option>
        <option value="09:30">09:30 AM</option>
        <option value="09:45">09:45 AM</option>
        <option value="10:00">10:00 AM</option>
        <option value="10:15">10:15 AM</option>
        <option value="10:30">10:30 AM</option>
        <option value="10:45">10:45 AM</option>
        <option value="11:00">11:00 AM</option>
        <option value="11:15">11:15 AM</option>
        <option value="11:30">11:30 AM</option>
        <option value="11:45">11:45 AM</option>
        <option value="12:00">12:00 PM</option>
        <option value="12:15">12:15 PM</option>
        <option value="12:30">12:30 PM</option>
        <option value="12:45">12:45 PM</option>
        <option value="13:00">01:00 PM</option>
        <option value="13:15">01:15 PM</option>
        <option value="13:30">01:30 PM</option>
        <option value="13:45">01:45 PM</option>
        <option value="14:00">02:00 PM</option>
        <option value="14:15">02:15 PM</option>
        <option value="14:30">02:30 PM</option>
        <option value="14:45">02:45 PM</option>
        <option value="15:00">03:00 PM</option>
        <option value="15:15">03:15 PM</option>
        <option value="15:30">03:30 PM</option>
        <option value="15:45">03:45 PM</option>
        <option value="16:00">04:00 PM</option>
        <option value="16:15">04:15 PM</option>
        <option value="16:30">04:30 PM</option>
        <option value="16:45">04:45 PM</option>
        <option value="17:00">05:00 PM</option>
        <option value="17:15">05:15 PM</option>
        <option value="17:30">05:30 PM</option>
        <option value="17:45">05:45 PM</option>
        <option value="18:00">06:00 PM</option>
        <option value="18:15">06:15 PM</option>
        <option value="18:30">06:30 PM</option>
        <option value="18:45">06:45 PM</option>
        <option value="19:00">07:00 PM</option>
        <option value="19:15">07:15 PM</option>
        <option value="19:30">07:30 PM</option>
        <option value="19:45">07:45 PM</option>
        <option value="20:00">08:00 PM</option>
        <option value="20:15">08:15 PM</option>
        <option value="20:30">08:30 PM</option>
        <option value="20:45">08:45 PM</option>
        <option value="21:00">09:00 PM</option>
        <option value="21:15">09:15 PM</option>
        <option value="21:30">09:30 PM</option>
        <option value="21:45">09:45 PM</option>
        <option value="22:00">10:00 PM</option>
        <option value="22:15">10:15 PM</option>
        <option value="22:30">10:30 PM</option>
        <option value="22:45">10:45 PM</option>
        <option value="23:00">11:00 PM</option>
        <option value="23:15">11:15 PM</option>
        <option value="23:30">11:30 PM</option>
        <option value="23:45">11:45 PM</option>
        <option value="00:00">12:00 AM</option>
        <option value="00:15">12:15 AM</option>
        <option value="00:30">12:30 AM</option>
        <option value="00:45">12:45 AM</option>
        <option value="01:00">01:00 AM</option>
        <option value="01:15">01:15 AM</option>
        <option value="01:30">01:30 AM</option>
        <option value="01:45">01:45 AM</option>
        <option value="02:00">02:00 AM</option>
        <option value="02:15">02:15 AM</option>
        <option value="02:30">02:30 AM</option>
        <option value="02:45">02:45 AM</option>
        <option value="03:00">03:00 AM</option>
        <option value="03:15">03:15 AM</option>
        <option value="03:30">03:30 AM</option>
        <option value="03:45">03:45 AM</option>
        <option value="04:00">04:00 AM</option>
        <option value="04:15">04:15 AM</option>
        <option value="04:30">04:30 AM</option>
        <option value="04:45">04:45 AM</option>
        <option value="05:00">05:00 AM</option>
        <option value="05:15">05:15 AM</option>
        <option value="05:30">05:30 AM</option>
        <option value="05:45">05:45 AM</option>
        <option value="06:00">06:00 AM</option>
        <option value="06:15">06:15 AM</option>
        <option value="06:30">06:30 AM</option>
        <option value="06:45">06:45 AM</option>
      </Form.Control>
    </Col>
  );
}


function Selectstate({setState}) {
  return (
    <Col>
      <Form.Label className='labels'>State</Form.Label>
      <Form.Control as="select" onChange = {evt => setState(evt.target.value)}>
        <option value="">Choose...</option>
        <option value="AL">AL</option>
        <option value="AK">AK</option>
        <option value="AZ">AZ</option>
        <option value="AR">AR</option>
        <option value="CA">CA</option>
        <option value="CO">CO</option>
        <option value="CT">CT</option>
        <option value="DE">DE</option>
        <option value="DC">DC</option>
        <option value="FL">FL</option>
        <option value="GA">GA</option>
        <option value="HI">HI</option>
        <option value="ID">ID</option>
        <option value="IL">IL</option>
        <option value="IN">IN</option>
        <option value="IA">IA</option>
        <option value="KS">KS</option>
        <option value="KY">KY</option>
        <option value="LA">LA</option>
        <option value="ME">ME</option>
        <option value="MD">MD</option>
        <option value="MA">MA</option>
        <option value="MI">MI</option>
        <option value="MN">MN</option>
        <option value="MS">MS</option>
        <option value="MO">MO</option>
        <option value="MT">MT</option>
        <option value="NE">NE</option>
        <option value="NV">NV</option>
        <option value="NH">NH</option>
        <option value="NJ">NJ</option>
        <option value="NM">NM</option>
        <option value="NY">NY</option>
        <option value="NC">NC</option>
        <option value="ND">ND</option>
        <option value="OH">OH</option>
        <option value="OK">OK</option>
        <option value="OR">OR</option>
        <option value="PA">PA</option>
        <option value="RI">RI</option>
        <option value="SC">SC</option>
        <option value="SD">SD</option>
        <option value="TN">TN</option>
        <option value="TX">TX</option>
        <option value="UT">UT</option>
        <option value="VT">VT</option>
        <option value="VA">VA</option>
        <option value="WA">WA</option>
        <option value="WV">WV</option>
        <option value="WI">WI</option>
        <option value="WY">WY</option>
      </Form.Control>
    </Col>
  );
}

function Checkmarkbox({day, setCheckState}) {
  return (
    <Col md='auto'>
      <Form.Label>{day}</Form.Label> 
      <Checkbox
        onChange={evt => setCheckState(evt.target.checked)}
      />
    </Col>
  );
}


Selectstate.propTypes = {
  setState: PropTypes.func.isRequired
};

Checkmarkbox.propTypes = {
  setCheckState: PropTypes.func.isRequired,
  day: PropTypes.string.isRequired
};

Selecthours.propTypes = {
  setTimeState: PropTypes.func.isRequired,
  openclose: PropTypes.string.isRequired
};