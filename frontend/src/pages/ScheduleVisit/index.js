import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {Container, Button, Form, Alert} from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimeKeeper from 'react-timekeeper';
import './schedulevisit.css';
import PropTypes from 'prop-types';


export default function ScheduleVisit({ history }) {
  // Get storeId from browser local storage
  const store_id = localStorage.getItem('store');
  const [maxPartyAmount, setMaxPartyAmount] = useState(0);
  const [scheduledDate, setScheduledDay] = useState(new Date());
  // 24 hour format
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [partyAmount, setPartyAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState(false);
  console.log('party of', partyAmount, 'at', scheduledTime, 'day:', scheduledDate);
  console.log(partyAmount);


  useEffect(() => {
    (async () => {
      const response = await api.get(`/store/${store_id}`);
      setMaxPartyAmount(response.data.maxPartyAllowed);
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
    // Get userId from browser local storage
    const user_id = localStorage.getItem('user');

    try {
      if (partyAmount <= 0) {
        setErrorMessage('Please enter the number of members in your visiting party.');
      } else if (partyAmount > maxPartyAmount) {
        setErrorMessage('The maximum allowed members in a party is ' + maxPartyAmount);
      } else {
        // Create the visit
        const response = await api.post('/visit/create', {scheduledDate, partyAmount, store_id}, { headers: {user_id} });
        const visit_id = response.data._id || false;
        console.log(response.data);
        // Send the visit in Store model if the visit was made
        if (visit_id) {
          await api.post('/visit/setVisitStore', {visit_id, store_id});
          history.push('/');
        } else {
          setErrorMessage('You already scheduled this visit. Go to \'My Visits\' to view your visits.');
        }
      }
      //history.push('/dashboard');
    } catch (error) {
      Promise.reject(error);
      console.log(error);
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
        /* ^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox" variant='warning'>
            {errorMessage}
          </Alert>
        ): ''}
      </div>
    </Container>
  );
}


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
        <Form.Label>Number of members in your party (including you)</Form.Label>
        <Form.Control type="number" placeholder="" onChange = {evt => setPartyAmount(evt.target.value)}/>
      </Form.Group>
      <Button className="submit-btn" variant="secondary" type="submit" onClick={handleSubmit}>Schedule Visit</Button>
    </Form>
  );
}


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
