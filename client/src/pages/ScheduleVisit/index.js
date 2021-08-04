import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import {Container, Button, Form, Alert} from 'react-bootstrap';
import {Container, Button, Form, Alert, Row, Col} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimeKeeper from 'react-timekeeper';
import './schedulevisit.css';
import { useHistory } from 'react-router-dom';
import {
  protectPage
} from '../verifyTokens/tokenFunctions';

function ScheduleVisit() {
  let history = useHistory();
  const [maxPartyAmount, setMaxPartyAmount] = useState(0);
  const [partyAmount, setPartyAmount] = useState('');
  const [avgVisitLength, setAvgVisitLength] = useState(0);
  const [errorMessage, setErrorMessage] = useState(false);
  // Date of visit inluding the day and time
  const [scheduledDate, setScheduledDate] = useState(new Date());
  // Time of visit in hours and minutes
  const [scheduledTime, setScheduledTime] = useState('12:00');
  // Store's business hours
  const [businessHours, setBusinessHours] = useState([]);
  // Name of store
  const [storeName, setStoreName] = useState('');
  // Formatted time
  const [formattedTime, setFormattedTime] = useState('');
  // If store is open 24/7
  const [open24hours, setOpen24Hours] = useState(false);
  // get store_id
  let store_id = localStorage.getItem('store');
  // visit success alert
  const [visitAlert, setVisitAlert] = useState('');
  // prevent spam click
  const [doubleClick, setDoubleClick] = useState(false);

  const refreshToken = localStorage.getItem('refreshToken');
  let accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    (async () => {
      try {
        if (!store_id) {
          return history.push('/findStore');
        }
        await protectPage(accessToken, refreshToken);
        accessToken = localStorage.getItem('accessToken');

        // Get user's current selected store so we can set the maxPartyAmount
        let headers = {
          authorization: `Bearer ${accessToken}`
        };
        let response = await axios.get(`/store/${store_id}`, { headers });
        
        if (!response.data) {
          return history.push('/findStore');
        } 

        // Set the max party allowed from current selected store
        setMaxPartyAmount(response.data.maxPartyAllowed);    
        setAvgVisitLength(response.data.avgVisitLength);
        setStoreName(response.data.storeName);
        setOpen24Hours(response.data.open24hours);

        // Set time picker to current time + 15 mins + avgVisitLength 
        let avgVisitMs = response.data.avgVisitLength * 60000;
        let currentTime = new Date(Date.now() + 900000 + avgVisitMs);

        let getHours = currentTime.getHours();
        let getMins = currentTime.getMinutes();

        // Round to nearest 15 minute interval
        if (getMins < 15) {
          getMins = 15;
        } else if (getMins < 30) {
          getMins = 30;
        } else if (getMins < 45) {
          getMins = 45;
        } else if (getMins > 45) {
          getMins = 0;
          getHours += 1;
        }

        let h = getHours.toString();
        let m = getMins.toString();

        // put time in 24 hour format
        if (getHours < 10) {
          h = '0' + h; 
        }
        if (getMins < 10) {
          m = '0' + m;
        }

        // Now set our time picker
        setScheduledTime(h + ':' + m);

        // Return if open 24/7
        if (response.data.open24hours) {
          return;
        }
        
        // Convert business hours to an array of objects so we can .map
        let hours = Object.keys(response.data.businessHours).map(key => {
          return response.data.businessHours[key];
        });

        setBusinessHours(hours);

      } catch (error) {
        history.push('/findStore');
        console.log(error);
      }
    })();
  }, []);


  // fetch the store's visits
  async function getStoreVisits() {
    try {
      // Fetch a store's visits
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let storeVisits = await axios.get(`/visits/${store_id}`, { headers });
      if (!storeVisits.data) {
        return history.push('/findStore');
      }
      
      return storeVisits.data;
    } catch (error) {
      history.push('/findStore');
      console.log(error);
    }
  }


  function renderBusinessHours(day, index) {
    if (open24hours) {
      return (
        <div key={index}>
          <p>Open 24/7</p>
        </div>
      );
    }
    return (
      <Row key={index}>
        <Col className="hoursList">
          <li>
            {day.open &&
                <p className="scheduleVisitClosed"><strong>{day.day}</strong></p>
            }
            {!day.open &&
                <p id="visitRedText" className="scheduleVisitClosed">{day.day}</p>
            }
            {!day.open && 
                <p id="visitRedText" className="scheduleVisitClosed">&nbsp;--- Closed</p>
            }
            {day.open && 
                <p className="scheduleVisitClosed"><strong>&nbsp;---</strong></p>
            }
            {day.open &&
              <p className="scheduleVisitClosed"> <strong>{formatTime(day.open)}</strong></p>
            }
            {day.close && 
                <p className="scheduleVisitClosed"> <strong>to </strong></p>
            }
            {day.close && 
              <p className="scheduleVisitClosed"><strong>{formatTime(day.close)}</strong></p>
            }
          </li>
        </Col>
      </Row>
    );
  }


  // This function handles whenever user selects a time in TimeKeeper
  function handleTimeChange(evt) {
    setScheduledTime(evt.formatted24);
    let formattedTime = formatTime(evt.formatted24);
    setFormattedTime(formattedTime);
  }


  // Function to format 24 hour time to 12 hour
  function formatTime(time) {
    const hoursMinutes = time.split(':');

    let hours = parseInt(hoursMinutes[0]);
    let mins = hoursMinutes[1];
    let dd = 'AM';

    if (hours >= 12) {
      hours -= 12;
      dd = 'PM';
    } else if (hours == 0) {
      hours = 12;
    }
  
    let formattedTime = hours + ':' + mins + ' ' + dd;


    if (!time) {
      formattedTime = '';
    }
    
    return formattedTime;
  }


  // Function that will talk to server api once button is clicked
  async function handleSubmit(evt) {
    // Prevent default event when button is clicked
    evt.preventDefault();
    try {
      setDoubleClick(true);
      // Get data for creating a visit
      let user = await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
      let user_id = user._id;
      let phoneNumber = user.phoneNumber;
      const storeVisits = await getStoreVisits();
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      // Create the visit
      let response = await axios.post('/visit/create', { phoneNumber, user_id, scheduledDate, partyAmount, storeName,
        store_id, scheduledTime, avgVisitLength, maxPartyAmount, open24hours, businessHours, storeVisits }, { headers });

      // Handle error
      if (!response.data) {
        history.push('/findStore');
        return;
      }
      
      // Handle error warning
      if (response.data.message) {
        setErrorMessage(response.data.message);
        setDoubleClick(false);
        await delay(7000);
        setErrorMessage('');
        return;
      }

      // If visit was created, then send user back to dashboard
      setVisitAlert('Visit Scheduled!');
      await delay(1500);
      history.push('/myvisits');
    } catch (error) {
      history.push('/findStore');
      console.log(error);
    }
  }


  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));
  function goToDashboard() {
    history.push('/dashboard');
  }


  return (
    <Container>
      <div className="content">
        { storeName && 
          <h5>Business hours for:<br/><strong>{storeName}</strong></h5>
        }
        { open24hours &&
          <h5 style={{color: '#209129'}}>Open 24/7</h5>
        }
        <ul className="scheduleListBorder">
          { storeName && businessHours.map(renderBusinessHours) }
        </ul>
        <h3>Schedule a Visit</h3>
        <Form className= "visitContent" onSubmit = {handleSubmit}>
          <p>Please pick the <strong>day</strong> of your visit</p>
          <DatePicker 
            closeOnScroll={true}
            className= "inputDate"
            selected={scheduledDate}
            onChange={evt => setScheduledDate(evt)} 
            /*timeClassName = {handleColor}*/
            minDate={new Date()}
          />
          <p><br></br>15 minute intervals</p>
          <div className="timeKeeper">
            <TimeKeeper
              time={scheduledTime} 
              onChange={handleTimeChange}
              coarseMinutes={15}
              forceCoarseMinutes
            />
            <p>Time chosen: <strong>{formattedTime}</strong></p>
          </div>
          <p>Maximum party size allowed: <strong>{maxPartyAmount}</strong></p>
          <Form.Group controlId="formPartyNumber">
            <Form.Label>Total number of members in your party <strong>(including you)</strong></Form.Label>
            <Form.Control className='scheduleVisit-input' type="text" onChange = {evt => setPartyAmount(evt.target.value)}/>
          </Form.Group>
          { !doubleClick &&
            <Button className="secondary-btn myVisits" onClick={handleSubmit}>
              Schedule Visit
            </Button>
          }
        </Form>
        { !storeName && 
          <h5 className="noStoreId">To schedule a visit, you need to <strong><a className='hyperlinks' href='/findStore'>Select a store</a></strong> in the navigation menu</h5>
        }

        { errorMessage ? (
        /* ^ is a ternary operator: Is party amount > 0? If no, then display the alert */
          <Alert className="alertBox myVisits" variant='warning'>
            {errorMessage}
          </Alert>
        ): ''}

        { visitAlert ? (
        /* ^ is a ternary operator: Is party amount > 0? If no, then display the alert */
          <Alert className="alertBox myVisits" variant='success'>
            Visit Scheduled!
          </Alert>
        ): ''}
        
        <button className="submit-btn myVisits" onClick={() => history.push('/myvisits')}>
          ← My Visits
        </button>
        <br/>
        <button className="submit-btn myVisitsDash" onClick={goToDashboard}>
          ← Dashboard
        </button>
      </div>
    </Container>
  );
}
export default ScheduleVisit;