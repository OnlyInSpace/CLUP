import React, {useEffect, useState} from 'react';
import api from '../../services/api';
import auth from '../../services/auth';
import {Container, Card, Button, Modal, Alert} from 'react-bootstrap';
import './myvisits.css';
import PropTypes from 'prop-types';
import { withRouter, useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';


// MyVisits will show a user's scheduled visits in cards
function MyVisits() {
  let history = useHistory();
  // For showing dialogue box
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  // For backend
  const [errMessage, setErrMessage] = useState('');

  // For deleting a visit
  const [visit_id, setVisit_id] = useState('');
  // Set our visit cards to an empty array state variable
  const [visitCards, setVisitCards] = useState([]);
  const [deleteAlert, setDeleteAlert] = useState('');

    
  // Below can be used for error checking if database cards aren't working
  // const customCards = [{
  //     storeName: "Sick Store",
  //     date: "12/05/2015",
  //     time: "10:30 AM"
  // }]
    
  // Get user's visits
  useEffect(() => {
    (async () => {
      const result = await getVisits();
      setVisitCards(result);
    })();
  }, []);

  
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


  // Function to return all visits tied to user
  const getVisits = async () => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      let refreshToken = localStorage.getItem('refreshToken');

      // Decode to get data stored in cookie
      let user = jwt.decode(accessToken);
      // When we decode a cookie using jwt.decode, we get an object called userData with the user's data stored inside
      let user_id = user._id;
      // Log the user here to see how it looks 
      // console.log('User:', user);

      // get user's visits
      let response = await api.get(`/myvisits/${user_id}`, { headers: {'accessToken': accessToken }});
      // If token comes back as expired, refresh the token and make api call again
      if (response.data.message === 'Access token expired') {
        user = await protectPage(accessToken, refreshToken);
        // If the access token or refresh token are unlegit, then return.
        if (!user) {
          setErrMessage('Please log in again.');
          console.log(errMessage);
          history.push('/login');
        } else {
          // overwrite response with the new access token.
          let newAccessToken = localStorage.getItem('accessToken');
          user_id = user._id;
          response = await api.get(`/myvisits/${user_id}`, { headers: {'accessToken': newAccessToken }});
        }
      }


      // Create a userVisits array of objects
      // Here .map means for every object in userVisits
      const userVisits = response.data;
      const getCards = await Promise.all( userVisits.map( async function (visit) {
  
        // Get the visit's id
        const visit_id = visit._id;
  
        // Parse our date 
        const newDate = new Date(visit.date);
        let date = newDate.toDateString().split(' ');
        date = date[0] + ' ' + date[1] + ' ' + date[2] + ', ' + date[3];

        const hour = newDate.getHours();
        let minutes = newDate.getMinutes();
  
        // Add a 0 to minutes to make it ==> :00 instead of :0
        if (minutes === 0) {
          minutes += '0';
        }
  
        // Format the date now
        const time = formatTime(hour + ':' + minutes);
  
        // Get store name
        const response = await api.get(`/store/${visit.store}`, { headers: {'accessToken': accessToken }});
        const sName = response.data.storeName;
  
        // append object to the getCards array
        return {
          visit_id: visit_id,
          storeName: sName,
          date: date,
          time: time,
          partyAmount: visit.partyAmount
        };
      }));
      console.log('getCards', getCards);

      return getCards;
      
    } catch (error) {
      console.log(error);
    }
  };


  const deleteVisitHandler = async (visit_id) => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      let refreshToken = localStorage.getItem('refreshToken');

      // get visit to check if party amount is reserved
      let getVisit = await api.get(`/visit/${visit_id}`, { headers: {'accessToken': accessToken }});
      // If reserved, then unreserve party amount in store occupancy
      if (getVisit.data.reserved) {
        let storeId = getVisit.data.store;
        let amount = getVisit.data.partyAmount;
        await api.post('/count/decrease', { storeId, amount }, { headers: {'accessToken': accessToken }});
      }
      
      // delete the visit
      // if an error occurs, then catch block will be triggered
      let response = await api.delete(`/myvisits/${visit_id}`, { headers: {'accessToken': accessToken }});
      // If token comes back as expired, refresh the token and make api call again
      if (response.data.message === 'Access token expired') {
        let user = await protectPage(accessToken, refreshToken);
        // If the access token or refresh token are unlegit, then return user to log in page.
        if (!user) {
          console.log('Please log in again.');
          history.push('/login');
        } else {
          // overwrite response with the new access token.
          let newAccessToken = localStorage.getItem('accessToken');
          response = await api.delete(`/myvisits/${visit_id}`, { headers: {'accessToken': newAccessToken }});
        }
      }
      
      // Set our delete alert for 5 seconds
      setDeleteAlert('Visit canceled.');
      setTimeout(() => {
        setDeleteAlert('');
      }, 5000);
      setShow(false);
      response = await getVisits();
      setVisitCards(response);
    } catch (error) {
      history.push('/login');
      console.log(error);
    }
  };


  function goToDashboard() {
    history.push('/dashboard');
  }


  // Render card component
  const renderCards = (card, index) => {
    return (
      <Card key={index}>
        <Card.Body>
          <Card.Title>{card.storeName}</Card.Title>
          <Card.Title>{card.date}</Card.Title>
          <Card.Text>Party of {card.partyAmount} at {card.time}</Card.Text>
        </Card.Body>
        <Card.Footer>
          {/* passing arguments format: () */}
          <small className="text-muted">
            <Button onClick={() => {
              setVisit_id(card.visit_id); 
              handleShow();
            }}
            className="delete-btn" >
              Cancel
            </Button>
            Cancel this visit?
          </small>
        </Card.Footer>
      </Card>
    );
  };

  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      {/*  */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel visit?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to cancel this visit?</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => deleteVisitHandler(visit_id)}>
            Yes
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="content">
        <h3>Your Visits</h3>
        { deleteAlert &&
          <Alert variant="success">
            Visit successfully canceled!
          </Alert>
        }

        { visitCards && visitCards.map(renderCards) }

        {!visitCards.length &&
          <h5 className="noVisits">Go to &apos;Schedule a visit&apos; in the navigation menu to schedule a visit.</h5>
        }

        <button className="submit-btn dashboard" onClick={goToDashboard}>
        ← Back to Dashboard
        </button>
      </div>
    </Container>
  );
}
export default withRouter(MyVisits);

// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
MyVisits.propTypes = {
  history: PropTypes.object.isRequired
};