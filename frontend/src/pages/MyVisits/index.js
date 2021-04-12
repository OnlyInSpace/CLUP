import React, {useEffect, useState} from 'react';
import api from '../../services/api';
import {Container, Card, Button, Modal, Alert} from 'react-bootstrap';
import './myvisits.css';
import PropTypes from 'prop-types';
import { withRouter, useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import {
  protectPage
} from '../verifyTokens/tokenFunctions';


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
  const refreshToken = localStorage.getItem('refreshToken');


    
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

      // Decode to get data stored in cookie
      let user = jwt.decode(accessToken);
      // When we decode a cookie using jwt.decode, we get an object called userData with the user's data stored inside
      let user_id = user._id;
      // Log the user here to see how it looks 
      // console.log('User:', user);

      // get user's visits
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let response = await api.get(`/myvisits/${user_id}`, { headers });
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
          headers = {
            authorization: `Bearer ${newAccessToken}`
          };
          response = await api.get(`/myvisits/${user_id}`, { headers });
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
        response = await api.get(`/store/${visit.store}`, { headers });
        // If token comes back as expired, refresh the token and make api call again
        if (response.data.message === 'Access token expired') {
          user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            console.log('Please log in again.');
            history.push('/login');
          } else {
          // overwrite response with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            user_id = user._id;
            headers = {
              authorization: `Bearer ${newAccessToken}`
            };
            response = await api.get(`/store/${visit.store}`, { headers });
          }
        }

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
      // get visit to check if party amount is reserved
      let headers = {
        authorization: `Bearer ${accessToken}`
      };

      let getVisit = await api.get(`/visit/${visit_id}`, { headers });

      if (getVisit.data.message === 'Access token expired') {
        let user = await protectPage(accessToken, refreshToken);
        // If the access token or refresh token are unlegit, then return user to log in page.
        if (!user) {
          console.log('Please log in again.');
          history.push('/login');
        } else {
          // overwrite response with the new access token.
          let newAccessToken = localStorage.getItem('accessToken');
          headers = {
            authorization: `Bearer ${newAccessToken}`
          };
          getVisit = await api.get(`/visit/${visit_id}`, { headers });
        }
      }


      // If reserved, then unreserve party amount in store occupancy
      if (getVisit.data.reserved) {
        let storeId = getVisit.data.store;
        let amount = getVisit.data.partyAmount;

        let response = await api.post('/count/decrease', { storeId, amount }, { headers });
        if (response.data.message === 'Access token expired') {
          let user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return user to log in page.
          if (!user) {
            console.log('Please log in again.');
            history.push('/login');
          } else {
            // overwrite response with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            headers = {
              authorization: `Bearer ${newAccessToken}`
            };
            response = await api.post('/count/decrease', { storeId, amount }, { headers });
          }
        }
      }
      
      // delete the visit
      // if an error occurs, then catch block will be triggered
      let response = await api.delete(`/myvisits/${visit_id}`, { headers });
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
          headers = {
            authorization: `Bearer ${newAccessToken}`
          };
          response = await api.delete(`/myvisits/${visit_id}`, { headers });
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

  function scheduleVisit() {
    history.push('/visit/schedule');
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


        <button className="submit-btn myVisits" onClick={scheduleVisit}>
        ← Schedule a Visit
        </button>

        <button className="submit-btn" onClick={goToDashboard}>
        ← Dashboard
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