import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import auth from '../../services/auth';
// import {Container, Button, Form, Alert} from 'react-bootstrap';
import {Container, Button, Form, Alert, Row, Col} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimeKeeper from 'react-timekeeper';
import './schedulevisit.css';
import PropTypes from 'prop-types';
import jwt from 'jsonwebtoken';
import { useHistory, withRouter } from 'react-router-dom';

function ScheduleVisit() {
  let history = useHistory();
  const [maxPartyAmount, setMaxPartyAmount] = useState(0);
  const [partyAmount, setPartyAmount] = useState(0);
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





  // Function to refresh a user's access token if it is unexpired
  const refresh = async (refreshToken) => {
    console.log('refreshing token. . .');
    let response = await auth.get('/refresh', { headers: { refreshToken }});
    // if refresh token was unlegit or not found, then return false
    if (response.data.success === false) {
      console.log('resolving false.');
      return false;
    } else { // else we get the new access token, set the cookie, and return it!
      const newAccessToken = response.data.newAccessToken;
      localStorage.setItem('accessToken', newAccessToken, { secure: true });
      return newAccessToken;
    }
  };
      
      
  // returns true or false depending on whether the access token is legit : )
  const verifyAccess = async (accessToken, refreshToken) => {
    let response = await auth.get('/verifyAccessToken', { headers: { 'accessToken': accessToken }});
    if (response.data.success === false) {
      // If the access token is expired, then go ahead and create a new access token with the refresh token
      if (response.data.message === 'Access token expired') { 
        const newAccessToken = await refresh(refreshToken);
        // Now that we have a new access token, let's verify the user and return the user
        return await verifyAccess(newAccessToken, refreshToken);
      }
      // If token comes back as invalid, return false
      return false;
    }
    // else the token is valid, return the user object with their data
    return response.data.user;     
  };
      
      
  // This function returns the user's object data within the token if it's legit, otherwise returns false.
  // This function also handles refreshing the token if needed
  const protectPage = async (accessToken, refreshToken) => {
    // If user doesnt have a refresh token: have user login 
    if (!refreshToken){
      console.log('Please log out and log back in.');
    }
    // If we have a refresh token but no access token, then go ahead and create a new token
    if (accessToken === undefined) {
      // This returns either an access token or false if the refresh token is unlegit
      accessToken = await refresh(refreshToken);
    }
    // If token is legit, return false
    if (!accessToken) {
      console.log('Please log out and log back in.');
    }
    // If the access or refresh token is unlegit, this returns false, otherwise it returns the user's object data : )
    return await verifyAccess(accessToken, refreshToken);
  };


  useEffect(() => {
    (async () => {
      try {
        let accessToken = localStorage.getItem('accessToken');
        let refreshToken = localStorage.getItem('refreshToken');
        // Get user's current selected store so we can set the maxPartyAmount
        let response = await api.get(`/store/${store_id}`, { headers: {'accessToken': accessToken }});

        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            console.log('Please log in again.');
            history.push('/login');
          } else {
            // overwrite response with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            response = await api.get(`/store/${store_id}`, { headers: {'accessToken': newAccessToken }});
          }
        }
        if (!response.data) {
          return;
        }

        // Set the max party allowed from current selected store
        setMaxPartyAmount(response.data.maxPartyAllowed);    
        setAvgVisitLength(response.data.avgVisitLength);
        setStoreName(response.data.storeName);
        setOpen24Hours(response.data.open24hours);

        if (response.data.open24hours) {
          return;
        }

        // Convert business hours to an array of objects so we can .map
        let hours = Object.keys(response.data.businessHours).map(key => {
          return response.data.businessHours[key];
        });

        setBusinessHours(hours);
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

      } catch (error) {
        console.log(error);
      }
    })();
  }, []);


  const renderBusinessHours = (day, index) => {
    if (open24hours) {
      return (
        <div>
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

            <p className="scheduleVisitClosed"> <strong>{formatTime(day.open)}</strong></p>

            {day.close && 
                <p className="scheduleVisitClosed"> <strong>to </strong></p>
            }
            <p className="scheduleVisitClosed"><strong>{formatTime(day.close)}</strong></p>
          </li>
        </Col>
      </Row>
    );
  };


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
    }

    if (hours == 0) {
      hours = 12;
    }
  
    let formattedTime = hours + ':' + mins + ' ' + dd;


    if (!time) {
      formattedTime = '';
    }
    
    return formattedTime;
  }


  // Function that will talk to server api once button is clicked
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    try {
      // Return hours and minutes in an array (Split the 24 time form: 15:36 into [15,36])
      const hoursMinutes =scheduledTime.split(':');
      // Set our date hours and minutes
      scheduledDate.setHours(parseInt(hoursMinutes[0]));
      scheduledDate.setMinutes(parseInt(hoursMinutes[1]));

      let refreshToken = localStorage.getItem('refreshToken');
      let accessToken = localStorage.getItem('accessToken');
      // Get userId from token stored in cookie
      let user = jwt.decode(accessToken);
      let user_id = user._id;

      // Validating the scheduled visit is scheduled within AT LEAST avgVisitLength + 15 mins
      let currentMins = Math.floor(Date.now() / 60000);
      // Add average visit time plus 15 minutes to current time so that we ensure user's have enough time to have a reserved spot.
      currentMins += avgVisitLength;
      currentMins += 15;
      let scheduledMins = Math.floor(Date.parse(scheduledDate) / 60000);


      // VALIDATION CHECKS
      let validated = true;
      let errorAlert = '';

      // Last validation checks of party size
      if (partyAmount <= 0) {
        errorAlert = 'Please enter the number of members in your visiting party.';
        validated = false;
      } 
      if (partyAmount > maxPartyAmount) {
        errorAlert = 'The maximum allowed members in a party is ' + maxPartyAmount;
        validated = false;
      } 

      // If the scheduled time is not ahead of current time + avgVisitLength + 15 mins
      if (scheduledMins < currentMins) {
        errorAlert = 'Visits must be scheduled at least ' + (avgVisitLength + 15) + ' minutes from now';
        validated = false;
      }
      
      // Validating scheduled time falls within business hours.

      //TODO: Check if visit falls within business hours : )

      // Get day of visit. Returns value 0-6 (Sun - Sat)
      let scheduledDay = scheduledDate.getDay();
      // Get scheduled hours and scheduled mins
      let scheduledHours = parseInt(hoursMinutes[0]);
      scheduledMins = parseInt(hoursMinutes[1]);     
      // Get business day and times 
      let businessDay = businessHours[scheduledDay];
      let businessHoursMins = businessDay.open.split(':');
      console.log('OpenTimes:', businessHoursMins);
      let businessOpenHours = parseInt(businessHoursMins[0]);
      let businessOpenMins = parseInt(businessHoursMins[1]);
      businessHoursMins = businessDay.close.split(':');
      console.log('CloseTimes:', businessHoursMins);
      let businessCloseHours = parseInt(businessHoursMins[0]);
      let businessCloseMins = parseInt(businessHoursMins[1]);

      console.log('businessCloseHours:', businessCloseHours);
      console.log('businessOpenHours:', businessOpenHours);
      console.log('avgVisitLength', avgVisitLength);


      // ****SETTING OUR ACTUAL BUSINESS CLOSE TIMES WITH RESPECT TO THE AVERAGE VISIT LENGTH****
      // Check if store is open for that day
      if (!businessDay.open) {
        errorAlert = storeName + ' is closed for the day you\'re trying to schedule';
        validated = false;
      }  


      // If store closes at midnight, ensure the actual closing hour is set properly with respect to avgVisitLength
      if ( (businessCloseHours-1) < 0 ) {
        if ( (businessCloseMins - avgVisitLength) < 0 ) {
          businessCloseHours = 23;
        }
      } 
      
      // Set our actual business close mins with respect to avgVisitLength
      if ( (businessCloseMins-avgVisitLength) < 0 ) {
        businessCloseHours -= 1;
        businessCloseMins = 60 - (avgVisitLength - businessCloseMins);
      } else { // We can just subtract avgVisitLength to get actual closing mins with respect to visit length
        businessCloseMins -= avgVisitLength;
      }
      // *************END OF SETTING THE ACTUAL BUSINESS TIMES*************


      // BEGIN CHECKING IF SCHEDULED VISIT TIME FALLS WITHIN BUSINESS TIMES

      // Special cases: 
      //        --> When a business opens during the day and closes after midnight
      //        --> When a business closes at midnight


      // When a business opens during the day and closes after midnight add 23 hours to closeHours
      if (businessOpenHours > businessCloseHours) {
        if ( (scheduledHours >= 0) && (scheduledHours <= businessCloseHours) ) {
          scheduledHours += 23;
        }
        businessCloseHours += 23;
      }



      // If user is trying to schedule a visit within the CLOSING hour, ensure they aren't too LATE
      if (scheduledHours === businessCloseHours) {
        if (scheduledMins > businessCloseMins) {
          errorAlert = 'Sorry, you can\'t schedule near closing time.';
          validated = false;
        }
      }

      // If user is trying to schedule a visit within the OPENING hour, ensure they aren't too EARLY
      if (scheduledHours === businessOpenHours) {
        if (scheduledMins < businessOpenMins) {
          errorAlert = storeName + ' is closed for the time you\'re trying to schedule';
          validated = false;
        }
      }

      // Ensure scheduled time is not too early
      if ( (scheduledHours !== 0) && (scheduledHours < businessOpenHours)) {
        errorAlert = storeName + ' is closed for the time you\'re trying to schedule';
        validated = false;
      }
      
      // Ensure scheduled time is not too late
      if ( (businessCloseHours !== 0) && (scheduledHours > businessCloseHours) ) {
        errorAlert = 'Sorry, you can\'t schedule near closing time or after business hours.';
        validated = false;
      }


      console.log('businessCloseMins:', businessCloseMins);
      console.log('day:', scheduledDay, 'scheduledHours:', scheduledHours, 'scheduledMins:', scheduledMins);

      if (open24hours) {
        validated = true;
      }
      
      if (!validated) {
        setErrorMessage(errorAlert);
        return;
      } else {
        // Create the visit
        let response = await api.post('/visit/create', {user_id, scheduledDate, partyAmount, store_id}, { headers: {'accessToken': accessToken} });

        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            console.log('Please log in again.');
            history.push('/login');
          } else {
            // overwrite response with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            user_id = user._id;
            console.log('user_id:', user_id);
            response = await api.post('/visit/create', {user_id, scheduledDate, partyAmount, store_id}, { headers: {'accessToken': newAccessToken }});
          }
        }

        const visit_id = response.data._id || false;
        console.log(response.data);
        // If visit was created, then send user back to dashboard
        if (visit_id) {
          history.push('/myvisits');
        } else {
          setErrorMessage(response.data.message);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };


  return (
    <Container>
      <div className="content">
        {storeName && 
          <p>Business hours for:<br/><strong>{storeName}</strong></p>
        }
        {open24hours &&
          <p style={{color: '#209129'}}>Open 24/7</p>
        }
        <ul className="scheduleListBorder">
          {storeName && businessHours.map(renderBusinessHours) }
        </ul>
        <h3>Schedule a Visit</h3>
        {storeName && 
          <VisitContent 
            handleSubmit={handleSubmit}
            scheduledDate={scheduledDate}
            setScheduledDate={setScheduledDate}
            handleTimeChange={handleTimeChange}
            setPartyAmount={setPartyAmount}
            scheduledTime={scheduledTime}
            formattedTime={formattedTime}
          />
        }
        {!storeName && 
          <h5 className="noStoreId">To schedule a visit, you need to <strong>Select a store</strong> in the navigation menu</h5>
        }
        {errorMessage ? (
        /* ^ is a ternary operator: Is party amount > 0? If no, then display the alert */
          <Alert className="visitAlertBox" variant='warning'>
            {errorMessage}
          </Alert>
        ): ''}
      </div>
    </Container>
  );
}
export default withRouter(ScheduleVisit);



function VisitContent({handleSubmit, scheduledDate, setScheduledDate, handleTimeChange, setPartyAmount, scheduledTime, formattedTime }) {
  // Here we can define state variables that will only be used by this component
  return (
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
      <p><br></br>Please schedule your visit within <strong>15 minute</strong> intervals.</p>
      <div className="timeKeeper">
        <TimeKeeper
          time={scheduledTime} 
          onChange={handleTimeChange}
          coarseMinutes={15}
          forceCoarseMinutes
        />
        <p>Time chosen: <strong>{formattedTime}</strong></p>
      </div>
      <Form.Group controlId="formPartyNumber">
        <Form.Label>Number of members in your party <strong>(including you)</strong></Form.Label>
        <Form.Control type="number" placeholder="" onChange = {evt => setPartyAmount(evt.target.value)}/>
      </Form.Group>
      <Button className="submit-btn" variant="secondary" type="submit" onClick={handleSubmit}>Schedule Visit</Button>
    </Form>
  );
}


// The following is required for ESLINT standards
// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
ScheduleVisit.propTypes = {
  history: PropTypes.object.isRequired
};

VisitContent.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  handleTimeChange: PropTypes.func.isRequired,
  scheduledDate: PropTypes.object.isRequired,
  scheduledTime: PropTypes.string.isRequired,
  setPartyAmount: PropTypes.func.isRequired,
  setScheduledDate: PropTypes.func.isRequired,
  formattedTime: PropTypes.string.isRequired
};