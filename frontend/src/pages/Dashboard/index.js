import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Cookies from 'js-cookie';
import auth from '../../services/auth';
import { Doughnut } from 'react-chartjs-2';
import { Container, Button } from 'react-bootstrap';
import './dashboard.css';
import PropTypes from 'prop-types';
import { withRouter, useHistory } from 'react-router-dom';



// Dashboard will show a store's current stats
function Dashboard() {
  let history = useHistory();
  const [donutData, setDonutData] = useState({});
  const [storeData, setStoreData] = useState({});
  const [errMessage, setErrMessage] = useState('');
  const [openCloseStatus, setOpenCloseStatus] = useState('open');


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
  
  
  // This function returns the user's access token if it's legit, otherwise returns false.
  // This function also handles refreshing the token if needed, when called
  const protectPage = async (accessToken, refreshToken) => {
    // If user doesnt have a refresh token: have user login 
    if (!refreshToken){
      setErrMessage('Please log out and log back in.');
    }
    // If we have a refresh token but no access token, then go ahead and create a new token
    if (accessToken === undefined) {
      // This returns either an access token or false if the refresh token is unlegit
      accessToken = await refresh(refreshToken);
    }
    // If token is legit, return false
    if (!accessToken) {
      setErrMessage('Please log out and log back in.');
    }
    // If the access or refresh token is unlegit, this returns false, otherwise it returns the user's object data : )
    return await verifyAccess(accessToken, refreshToken);
  };


  useEffect(async () => {
    try {
      // Ensure user has a store id
      const store_id = Cookies.get('store');
      let accessToken = Cookies.get('accessToken');
      let refreshToken = Cookies.get('refreshToken');
      if (!store_id) return;

      // Get store object and verify the user's accessToken
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

      // Else we know at this point, the user's token is verified
      // Set our store data to be displayed
      setStoreData(response.data);  




      // Set our open or close status to be displayed 
      // Convert business hours to an array of objects
      const businessHours = Object.keys(response.data.businessHours).map(key => {
        return response.data.businessHours[key];
      });

      const currentTime = new Date();
      const today = currentTime.getDay();
      const businessDay = businessHours[today];
      let currentHour = parseInt(currentTime.getHours());
      let currentMins = parseInt(currentTime.getMinutes());
      let businessHoursMins = businessDay.open.split(':');
      let businessOpenHours = parseInt(businessHoursMins[0]);
      let businessOpenMins = parseInt(businessHoursMins[1]);
      businessHoursMins = businessDay.close.split(':');
      let businessCloseHours = parseInt(businessHoursMins[0]);
      let businessCloseMins = parseInt(businessHoursMins[1]);

      // When a business opens during the day and closes after midnight add 23 hours to closeHours
      if (businessOpenHours > businessCloseHours) {
        if ( (currentHour >= 0) && (currentHour <= businessCloseHours) ) {
          currentHour += 23;
        }
        businessCloseHours += 23;
      }

      // If currentHour is within the CLOSING hour, ensure current time is not too LATE
      if (currentHour === businessCloseHours) {
        if (currentMins > businessCloseMins) {
          setOpenCloseStatus('closed');
        }
      }
      
      // If currentHour is within the OPENING hour, ensure current time is not too EARLY
      if (currentHour === businessOpenHours) {
        if (currentMins < businessOpenMins) {
          setOpenCloseStatus('closed');
        }
      }
      
      // Ensure current time is not too early
      if ( (currentHour !== 0) && (currentHour < businessOpenHours)) {
        setOpenCloseStatus('closed');
      }
            
      // Ensure current time is not too late
      if ( (businessCloseHours !== 0) && (currentHour > businessCloseHours) ) {
        setOpenCloseStatus('closed');
      }

      // Ensure the store is open
      if (!businessDay.open) {
        setOpenCloseStatus('closed');
      }  

      if (response.data.open24hours) {
        setOpenCloseStatus('open');
      }

      // Set our donut chart data
      const vacantSpots = response.data.maxOccupants - response.data.currentCount;
      const donutOptions = {
        datasets: [{
          // data: [20, 40], //0a6096
          data: [response.data.currentCount, vacantSpots],
          backgroundColor: ['#0a6096', '#b2b8c2'],
          hoverBorderColor: ['#000000', 'grey'],
          hoverBorderWidth: 2,
          borderWidth: 3
        }],
        labels: ['Customers Present', 'Vacant Spots']
      };
      setDonutData(donutOptions);
        
    } catch (error) {
      console.log('error:', error);
    }
  }, []);
      

  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        {errMessage}
        { storeData.storeName &&
          <h2>{storeData.storeName}</h2>
        }
        { storeData.storeName &&
          <p className={openCloseStatus === 'open' ? 'dashboardOpen' : 'dashboardClosed'}>Currently <strong>{openCloseStatus}</strong></p>
        }
        { storeData.location && 
          <p>
            {storeData.location.address1} {storeData.location.address2}
          </p>
        }
        { storeData.storeName &&
          <p className="currentCapacity">Current occupancy: <strong>{storeData.currentCount}</strong>/{storeData.maxOccupants}</p>
        }
        { storeData.storeName && 
          <h2><strong>{Math.floor((storeData.currentCount / storeData.maxOccupants) * 100) }%</strong></h2>
        }
        {!storeData.storeName &&
          <h5 className="currentCapacity">Go to &quot;Select a store&quot; in the navigation bar to select a store in order to view this page</h5>
        }
        { storeData.storeName &&
          <Doughnut data = {donutData} />
        }
        { storeData.storeName && 
          <Button className="refresh-btn" onClick={() => window.location.reload(false)}>Refresh</Button>
        }
      </div>
    </Container>
  );
}
export default withRouter(Dashboard);

Dashboard.propTypes = {
  history: PropTypes.object.isRequired
};