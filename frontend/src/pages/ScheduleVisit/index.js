import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import auth from '../../services/auth';
import {Container, Button, Form, Alert} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimeKeeper from 'react-timekeeper';
import './schedulevisit.css';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';
import { useHistory, withRouter } from 'react-router-dom';

function ScheduleVisit() {
  let history = useHistory();
  const [maxPartyAmount, setMaxPartyAmount] = useState(0);
  const [scheduledDate, setScheduledDay] = useState(new Date());
  // 24 hour format
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [partyAmount, setPartyAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(false);
  // For backend
  const [errMessage, setErrMessage] = useState('');
  // get store_id
  let store_id = Cookies.get('store');


  console.log('party of', partyAmount, 'at', scheduledTime, 'day:', scheduledDate);
  console.log(partyAmount);

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
      Cookies.set('accessToken', newAccessToken, { secure: true });
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
        let accessToken = Cookies.get('accessToken');
        let refreshToken = Cookies.get('refreshToken');
        // Get user's current selected store so we can set the maxPartyAmount
        let response = await api.get(`/store/${store_id}`, { headers: {'accessToken': accessToken }});

        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            setErrMessage('Please log in again.');
            console.log(errMessage);
            history.push('/login');
          } else {
            // overwrite response with the new access token.
            let newAccessToken = Cookies.get('accessToken');
            response = await api.get(`/store/${store_id}`, { headers: {'accessToken': newAccessToken }});
          }
        }
        // Set the max party allowed from current selected store
        setMaxPartyAmount(response.data.maxPartyAllowed);    
      } catch (error) {
        console.log(error);
        history.push('/login');
      }
    })();
  }, []);


  // Function that will talk to server api once button is clicked
  const handleSubmit = async evt => {
    // Prevent default event when button is clicked
    evt.preventDefault();
    // Return hours and minutes in an array (Split the 24 time form: 15:36 into [15,36])
    const hoursMinutes =scheduledTime.split(':');
    // Set our date hours and minutes
    scheduledDate.setHours(parseInt(hoursMinutes[0]));
    scheduledDate.setMinutes(parseInt(hoursMinutes[1]));
    console.log('Scheduled Day:', scheduledDate);

    let refreshToken = Cookies.get('refreshToken');
    let accessToken = Cookies.get('accessToken');
    // Get userId from token stored in cookie
    let user = jwt.decode(accessToken);
    let user_id = user._id;
    console.log('user:', user);
    //TODO: user_id is not being set correctly here, ensure we reset user_id after refresh call
    try {
      if (partyAmount <= 0) {
        setErrorMessage('Please enter the number of members in your visiting party.');
      } else if (partyAmount > maxPartyAmount) {
        setErrorMessage('The maximum allowed members in a party is ' + maxPartyAmount);
      } else {
        // Create the visit
        let response = await api.post('/visit/create', {user_id, scheduledDate, partyAmount, store_id}, { headers: {'accessToken': accessToken} });

        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            setErrMessage('Please log in again.');
            console.log(errMessage);
            history.push('/login');
          } else {
            // overwrite response with the new access token.
            let newAccessToken = Cookies.get('accessToken');
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
      history.push('/login');
    }
  };


  return (
    <Container>
      <div className="content">
        <h3>Schedule a Visit</h3>
        {store_id && 
          <VisitContent 
            handleSubmit={handleSubmit}
            scheduledDate={scheduledDate}
            setScheduledDay={setScheduledDay}
            setScheduledTime={setScheduledTime}
            setPartyAmount={setPartyAmount}
            scheduledTime={scheduledTime}
          />
        }
        {!store_id && 
          <h5 className="noStoreId">To schedule a visit, you need to <strong>Select a store</strong> in the navigation menu</h5>
        }
        {errorMessage ? (
        /* ^ is a ternary operator: Is party amount > 0? If no, then display the alert */
          <Alert className="alertBox" variant='warning'>
            {errorMessage}
          </Alert>
        ): ''}
      </div>
    </Container>
  );
}
export default withRouter(ScheduleVisit);



function VisitContent({handleSubmit, scheduledDate, setScheduledTime, scheduledTime, setPartyAmount, setScheduledDay}) {
  // Here we can define state variables that will only be used by this component
  return (
    <Form className= "visitContent" onSubmit = {handleSubmit}>
      <p>Please pick the <strong>day</strong> of your visit</p>
      <DatePicker 
        closeOnScroll={true}
        className= "inputDate"
        selected={scheduledDate}
        onChange={evt => setScheduledDay(evt)} 
        /*timeClassName = {handleColor}*/
      />
      <p><br></br>Please schedule your visit within <strong>15 minute</strong> intervals.</p>
      <div className="timeKeeper">
        <TimeKeeper
          time={scheduledTime} 
          onChange = { evt => setScheduledTime(evt.formatted24) }
          coarseMinutes={15}
          forceCoarseMinutes
        />
        <p>Time chosen: <strong>{scheduledTime}</strong></p>
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
  scheduledDate: PropTypes.object.isRequired,
  scheduledTime: PropTypes.string.isRequired,
  setScheduledTime: PropTypes.func.isRequired,
  setPartyAmount: PropTypes.func.isRequired,
  setScheduledDay: PropTypes.func.isRequired
};
