import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Container, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { Checkbox } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import './createstore.css';
import PropTypes from 'prop-types';
import {
  protectPage
} from '../verifyTokens/tokenFunctions';


//  CreateCompany allows users to create their own store
//  TODO: Create a (?) icon next to each box to reveal more information about the option
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

  const refreshToken = localStorage.getItem('refreshToken');
  let accessToken = localStorage.getItem('accessToken');



  console.log('Role:', userRole);
  console.log('State:', state);

  // Set user's role
  useEffect(() => {
    (async () => {
      try {
        // Get user data and refresh token if needed.
        let user = await protectPage(accessToken, refreshToken);
        
        if (!user) {
          console.log('Please log in again.');
          history.push('/login');
          return;
        }

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
    try {

      const isMaxParty = /^\d+$/.test(maxPartyAllowed);
      const isMaxOccupants = /^\d+$/.test(maxOccupants);
      const isPostalCode = /^\d+$/.test(postalCode);
      const isAvgVisitLength = /^\d+$/.test(avgVisitLength);

      
      if (!storeName || !maxOccupants || !maxPartyAllowed || !city || !state || !address1 || !postalCode || !avgVisitLength) {
        setErrorMessage('Missing required information.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      }
      
      if (!isMaxParty || !isMaxOccupants || !isPostalCode || !isAvgVisitLength) {
        setErrorMessage('Please make sure to enter only digits in the number fields.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      }

      if (sunday && (!openSun || !closeSun )) {
        setErrorMessage('Sunday open/close time missing.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      } else if (monday && (!openMon || !closeMon )) {
        setErrorMessage('Monday open/close time missing.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      } else if (tuesday && (!openTues || !closeTues )) {
        setErrorMessage('Tuesday open/close time missing.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      } else if (wednesday && (!openWed || !closeWed )) {
        setErrorMessage('Wednesday open/close time missing.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      } else if (thursday && (!openThurs || !closeThurs )) {
        setErrorMessage('Thursday open/close time missing.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      } else if (friday && (!openFri || !closeFri )) {
        setErrorMessage('Friday open/close time missing.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      } else if (saturday && (!openSat || !closeSat )) {
        setErrorMessage('Saturday open/close time missing.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      } else if (!sunday && !monday && !tuesday && !wednesday && !thursday && !friday && !saturday && !open24hours) {
        setErrorMessage('Please define business hours for your store.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      }

      const maxPartyNum = parseInt(maxPartyAllowed);
      const maxOccupantsNum = parseInt(maxOccupants);
      const postalCodeNum = parseInt(postalCode);
      const avgVisitLengthNum = parseInt(avgVisitLength);

      if (maxPartyNum > maxOccupantsNum) {
        setErrorMessage('The max party allowed cannot exceed total occupancy.');
        setTimeout(() => {
          setErrorMessage('');
        }, 7000);
        return;
      } else {
        
        let user = await protectPage(accessToken, refreshToken);
        let user_id = user._id;
        
        // Get company_id
        accessToken = localStorage.getItem('accessToken');
        let headers = {
          authorization: `Bearer ${accessToken}`
        };
        let response = await api.get(`/company/${user_id}`, { headers });

        // Get ready to create our store
        const company_id = response.data._id;
        // Create businessHours object
        const businessHours = {
          sunday: {
            day: 'Sun.',
            open: sunday ? openSun : '',
            close: sunday ? closeSun : ''
          },
          monday: {
            day: 'Mon.', 
            open: monday ? openMon : '',
            close: monday ? closeMon : ''
          },
          tuesday: {
            day: 'Tue.', 
            open: tuesday ? openTues : '',
            close: tuesday ? closeTues : ''
          },
          wednesday: {
            day: 'Wed.', 
            open: wednesday ? openWed : '',
            close: wednesday ? closeWed : ''
          },
          thursday: {
            day: 'Thu.', 
            open: thursday ? openThurs : '',
            close: thursday ? closeThurs : ''
          },
          friday: {
            day: 'Fri.', 
            open: friday ? openFri : '',
            close: friday ? closeFri : ''
          },
          saturday: {
            day: 'Sat.', 
            open: saturday ? openSat : '',
            close: saturday ? closeSat : ''
          } 
        };

        const location = {city, state, address1, address2, 'postalCode': postalCodeNum};
        response = await api.post('/store/create', { company_id, storeName, location, 'maxOccupants': maxOccupantsNum, 'maxPartyAllowed': maxPartyNum, 'avgVisitLength': avgVisitLengthNum, open24hours, businessHours }, { headers });

        // Ensure store was created by getting its id
        const store_id = response.data._id || false;
        // Set store_id in cookies
        localStorage.setItem('store', store_id);

        if (store_id) {
          setSuccessAlert('Store created! You are being redirected.');
          await delay(3000);
          history.push('/dashboard');
        } else {
          setErrorMessage('This store already exists.');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  function goToDashboard() {
    history.push('/dashboard');
  }

  // everything inside the return is JSX (looks exactly like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        <h3>Create a Store</h3>
        { userRole === 'owner' ? 
          <CreateStoreContent
            handleSubmit={handleSubmit}
            setStoreName={setStoreName}
            setMaxOccupants={setMaxOccupants}
            setMaxPartyAllowed={setMaxPartyAllowed}
            setAvgVisitLength={setAvgVisitLength}
            setAddress1={setAddress1}
            setAddress2={setAddress2}
            setCity={setCity}
            setState={setState}
            setPostalCode={setPostalCode}
            setOpen24Hours={setOpen24Hours}
            setSunday={setSunday}
            setOpenSun={setOpenSun}
            setCloseSun={setCloseSun}
            setMonday={setMonday}
            setOpenMon={setOpenMon}
            setCloseMon={setCloseMon}
            setTuesday={setTuesday}
            setOpenTues={setOpenTues}
            setCloseTues={setCloseTues}
            setWednesday={setWednesday}
            setOpenWed={setOpenWed}
            setCloseWed={setCloseWed}
            setThursday={setThursday}
            setOpenThurs={setOpenThurs}
            setCloseThurs={setCloseThurs}
            setFriday={setFriday}
            setOpenFri={setOpenFri}
            setCloseFri={setCloseFri}
            setSaturday={setSaturday}
            setOpenSat={setOpenSat}
            setCloseSat={setCloseSat}
            errorMessage={errorMessage}
            successAlert={successAlert}
          /> : <p>Before you can create a store, you have to first create a <a href='http://localhost:3000/company/create'><strong>company here</strong></a></p>
        }
        <button className="submit-btn dashboard" onClick={goToDashboard}>
          ← Back to Dashboard
        </button>
      </div>
    </Container>
  );
}
export default CreateStore;

function CreateStoreContent({
  handleSubmit,
  setStoreName,
  setMaxOccupants,
  setMaxPartyAllowed,
  setAvgVisitLength,
  setAddress1,
  setAddress2,
  setCity,
  setState,
  setPostalCode,
  setOpen24Hours,
  setSunday,
  setOpenSun,
  setCloseSun,
  setMonday,
  setOpenMon,
  setCloseMon,
  setTuesday,
  setOpenTues,
  setCloseTues,
  setWednesday,
  setOpenWed,
  setCloseWed,
  setThursday,
  setOpenThurs,
  setCloseThurs,
  setFriday,
  setOpenFri,
  setCloseFri,
  setSaturday,
  setOpenSat,
  setCloseSat,
  errorMessage,
  successAlert
}) {
  return (
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
        {/* Call Selectstate function defined later in this file */}
        <Selectstate setState={setState} />
      </Row>

      <Form.Group>
        <Form.Label className='labels'>Postal Code (Numbers only)</Form.Label>
        <Form.Control placeholder='Number' type='text' onChange = {evt => setPostalCode(evt.target.value)}/>
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
        <Checkmarkbox day="Sunday" setCheckState={setSunday} />
        <Selecthours openclose="open" setTimeState={setOpenSun} />
        <Selecthours openclose="close" setTimeState={setCloseSun} />
      </Row>

      <Row>
        <Checkmarkbox day="Monday" setCheckState={setMonday} />
        <Selecthours openclose="open" setTimeState={setOpenMon} />
        <Selecthours openclose="close" setTimeState={setCloseMon} />
      </Row>

      <Row>
        <Checkmarkbox day="Tuesday" setCheckState={setTuesday} />
        <Selecthours openclose="open" setTimeState={setOpenTues} />
        <Selecthours openclose="close" setTimeState={setCloseTues} />
      </Row>

      <Row>
        <Checkmarkbox day="Wednesday" setCheckState={setWednesday} />
        <Selecthours openclose="open" setTimeState={setOpenWed} />
        <Selecthours openclose="close" setTimeState={setCloseWed} />
      </Row>

      <Row>
        <Checkmarkbox day="Thursday" setCheckState={setThursday} />
        <Selecthours openclose="open" setTimeState={setOpenThurs} />
        <Selecthours openclose="close" setTimeState={setCloseThurs} />
      </Row>

      <Row>
        <Checkmarkbox day="Friday" setCheckState={setFriday} />
        <Selecthours openclose="open" setTimeState={setOpenFri} />
        <Selecthours openclose="close" setTimeState={setCloseFri} />
      </Row>

      <Row>
        <Checkmarkbox day="Saturday" setCheckState={setSaturday} />
        <Selecthours openclose="open" setTimeState={setOpenSat} />
        <Selecthours openclose="close" setTimeState={setCloseSat} />
      </Row>
      {/* CHECKBOX_END */}


      <p>Note: <br/> All of these settings will be <strong>changeable</strong> after clicking the submit button.</p>

      <Button onClick={handleSubmit} className="secondary-btn">
        Create store
      </Button>
      
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
  );
}


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
    </Col>
  );
}

function Checkmarkbox({day, setCheckState}) {
  return (
    <Col>
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

CreateStoreContent.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  setStoreName: PropTypes.func.isRequired,
  setMaxOccupants: PropTypes.func.isRequired,
  setMaxPartyAllowed: PropTypes.func.isRequired,
  setAvgVisitLength: PropTypes.func.isRequired,
  setAddress1: PropTypes.func.isRequired,
  setAddress2: PropTypes.func.isRequired,
  setCity: PropTypes.func.isRequired,
  setState: PropTypes.func.isRequired,
  setPostalCode: PropTypes.func.isRequired,
  setOpen24Hours: PropTypes.func.isRequired,
  setSunday: PropTypes.func.isRequired,
  setOpenSun: PropTypes.func.isRequired,
  setCloseSun: PropTypes.func.isRequired,
  setMonday: PropTypes.func.isRequired,
  setOpenMon: PropTypes.func.isRequired,
  setCloseMon: PropTypes.func.isRequired,
  setTuesday: PropTypes.func.isRequired,
  setOpenTues: PropTypes.func.isRequired,
  setCloseTues: PropTypes.func.isRequired,
  setWednesday: PropTypes.func.isRequired,
  setOpenWed: PropTypes.func.isRequired,
  setCloseWed: PropTypes.func.isRequired,
  setThursday: PropTypes.func.isRequired,
  setOpenThurs: PropTypes.func.isRequired,
  setCloseThurs: PropTypes.func.isRequired,
  setFriday: PropTypes.func.isRequired,
  setOpenFri: PropTypes.func.isRequired,
  setCloseFri: PropTypes.func.isRequired,
  setSaturday: PropTypes.func.isRequired,
  setOpenSat: PropTypes.func.isRequired,
  setCloseSat: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired,
  successAlert: PropTypes.string.isRequired
};