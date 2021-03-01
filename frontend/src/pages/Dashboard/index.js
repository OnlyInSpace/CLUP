import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import auth from '../../services/auth';
import { Doughnut } from 'react-chartjs-2';
import { Container, Button, Modal, Alert } from 'react-bootstrap';
import Select from 'react-select';
import './dashboard.css';
import PropTypes from 'prop-types';
import { withRouter, useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';



// Dashboard will show a store's current stats
function Dashboard() {
  let history = useHistory();
  const [donutData, setDonutData] = useState({});
  const [storeData, setStoreData] = useState({});
  const [openCloseStatus, setOpenCloseStatus] = useState('open');
  const [closeTime, setCloseTime] = useState('');
  const [displayContent, setDisplayContent] = useState(false);
  // allows user to see employee content
  const [employeeStatus, setEmployeeStatus] = useState(false);
  // is user clocked in or not?
  const [isClockedIn, setIsClockedIn] = useState(false);
  // Data for visit searchbar
  const [errorMessage, setErrorMessage] = useState('');
  const [searchData, setSearchData] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  // For showing dialogue box
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  // for displaying 'out' or 'in'
  const [in_out, setIn_Out] = useState('IN');
  // Delete alert 
  const [deleteAlert, setDeleteAlert] = useState('');

  //TODO: add time of visit to search bar label
  //TODO: Create a manage store page where store owner can add employees, managers, and other store owners.

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
  
  
  // This function returns the user's access token if it's legit, otherwise returns false.
  // This function also handles refreshing the token if needed, when called
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


  useEffect(async () => {
    try {
      // Ensure user has a store id
      const refreshToken = localStorage.getItem('refreshToken');
      // Refresh our user's token so that their clockIn status is updated in localstorage
      let accessToken = localStorage.getItem('accessToken');
      await refresh(refreshToken);
      const store_id = localStorage.getItem('store');
      let user = jwt.decode(accessToken);
      
      if (!store_id) {
        return;
      }

      // Get store object and verify the user's accessToken
      let response = await api.get(`/store/${store_id}`, { headers: {'accessToken': accessToken }});

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
          response = await api.get(`/store/${store_id}`, { headers: {'accessToken': newAccessToken }});
        }
      }

      console.log('user.clockedin:', user.clockedIn);

      if (user.clockedIn) {
        setIn_Out('OUT');
      }

      setIsClockedIn(user.clockedIn);


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
      setCloseTime(businessDay.close);
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
      setDisplayContent(true);
        

      /********************Validation checks for employee view********************/
      
      if (user.role !== 'employee' && user.role !== 'manager' && user.role !== 'owner' ) {
        return;
      }
      // Get store's company_id
      const storeCompany_id = response.data.company_id;

      // If the user's business_id does not mach store_id or company_id then return.
      if (user.business_id === store_id || user.business_id === storeCompany_id) {
        setEmployeeStatus(true);
      } else {
        return; 
      }

      const storeVisits = await getStoreVisits();
      setSearchData(storeVisits);

    } catch (error) {
      console.log('response.data not found');
    }
  }, []);
      
  
  async function getStoreVisits() {
    // Fetch a store's visits
    const store_id = localStorage.getItem('store');

    let accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    let storeVisits = await api.get(`/visits/${store_id}`, { headers: {'accessToken': accessToken }});

    // If token comes back as expired, refresh the token and make api call again
    if (storeVisits.data.message === 'Access token expired') {
      const user = await protectPage(accessToken, refreshToken);
      // If the access token or refresh token are unlegit, then return.
      if (!user) {
        console.log('no user!');
        history.push('/login');
      } else {
        // overwrite storeList with the new access token.
        let newAccessToken = localStorage.getItem('accessToken');
        storeVisits = await api.get(`/visits/${store_id}`, { headers: {'accessToken': newAccessToken }});
      }
    }

    console.log(storeVisits.data);
    
    // Populating our search list with today's visits
    const currentDate = new Date();
    const currentDay = currentDate.getDay();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    let visitsToday = [];
    
    let visit, visitDate;
    let visitDay, visitMonth, visitYear;
    let visit_id, visitPhoneNumber, visitPartyAmount, label;
    let formatDate;

    for (let i=0; i < storeVisits.data.length; i++) {
      visit = storeVisits.data[i];
      // Get visit's date 
      visitDate = new Date(visit.date);
      formatDate = visitDate.toString();
      formatDate = formatDate.split(' ');
      formatDate = formatTime(formatDate[4].substring(0,5));

      visitDay = visitDate.getDay();
      visitMonth = visitDate.getMonth();
      visitYear = visitDate.getFullYear();
      
      // Only return visits for today
      if (currentDay === visitDay && currentMonth === visitMonth && currentYear === visitYear) {
        visit_id = visit._id;
        visitPhoneNumber = visit.phoneNumber;
        visitPartyAmount = visit.partyAmount;
        label = visitPhoneNumber + ' - ' + 'Party of ' + visitPartyAmount + ' (' + formatDate + ')';
        visitsToday.push({label, value: visit_id});
      }
    }

    console.log('VISITS:', visitsToday);
    return visitsToday;
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


  async function handleClockInOut(evt) {
    evt.preventDefault();

    let clockInOut = '';
    if (isClockedIn) {
      clockInOut = '/clockOut';
    } else if (!isClockedIn) {
      clockInOut = '/clockIn';
    }

    let accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = await protectPage(accessToken, refreshToken);
    const user_id = user._id;

    if (user.isClockedIn) {
      setIn_Out('OUT');
    } else {
      setIn_Out('IN');
    }

    // Clock user in or out
    let getUser = await api.post(clockInOut, {user_id}, { headers: {'accessToken': accessToken }});

    // If token comes back as expired, refresh the token and make api call again
    if (getUser.data.message === 'Access token expired') {
      const user = await protectPage(accessToken, refreshToken);
      // If the access token or refresh token are unlegit, then return.
      if (!user) {
        console.log('no user!');
        history.push('/login');
      } else {
        // overwrite storeList with the new access token.
        let newAccessToken = localStorage.getItem('accessToken');
        getUser = await api.post('/clockIn', {user_id}, { headers: {'accessToken': newAccessToken }});
      }
    }

    // Refresh our user's token so that their clockIn status is updated in localstorage
    await refresh(refreshToken);
        
    if (getUser) {
      if (clockInOut === '/clockIn') {
        setIsClockedIn(true);
      } else if (clockInOut === '/clockOut') {
        setIsClockedIn(true);
      }  
      setShow(false);
    } 
    // refresh page
    window.location.reload(false);
  }


  const confirmVisitHandler = async (evt) => {
    try {
      evt.preventDefault();
      if (!selectedVisit) {
        setErrorMessage('Please select a visit to confirm.');
        return;
      }
      let accessToken = localStorage.getItem('accessToken');
      let refreshToken = localStorage.getItem('refreshToken');

      // Get the store's id from our generated search list 
      const getVisitId = searchData.find( ({label}) => label === selectedVisit);
      const visit_id = getVisitId.value;
      
      // delete the visit
      // if an error occurs, then catch block will be triggered
      let response = await api.delete(`/myvisits/${visit_id}`, { headers: {'accessToken': accessToken }});
      // If token comes back as expired, refresh the token and make api call again
      if (response.data.message === 'Access token expired') {
        let user = await protectPage(accessToken, refreshToken);
        // If the access token or refresh token are unlegit, then return user to log in page.
        if (!user) {
          console.log('Please log in again');
          history.push('/login');
        } else {
          // overwrite response with the new access token.
          let newAccessToken = localStorage.getItem('accessToken');
          response = await api.delete(`/myvisits/${visit_id}`, { headers: {'accessToken': newAccessToken }});
        }
      }
      
      // Set our delete alert for 5 seconds
      setDeleteAlert('Visit confirmed.');
      setTimeout(() => {
        setDeleteAlert('');
      }, 5000);

      setShow(false);
      response = await getStoreVisits();
      setSearchData(response);
      window.location.reload(false);

    } catch (error) {
      history.push('/login');
      console.log(error);
    }
  };


  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel visit?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to clock {in_out}?</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClockInOut}>
            Yes
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
      {/* End of Modal */}

      <div className='content'>
        { !displayContent && 
        <NoStoreID/>
        }

        { displayContent && 
        <DashboardContent
          storeData={storeData}
          openCloseStatus={openCloseStatus}
          closeTime={closeTime}
          donutData={donutData}
          formatTime={formatTime}
        />
        }

        { employeeStatus &&
        <EmployeeContent
          handleShow={handleShow}
          searchData={searchData}
          setSelectedVisit={setSelectedVisit}
          selectedVisit={selectedVisit}
          confirmVisitHandler={confirmVisitHandler}
          errorMessage={errorMessage}
          deleteAlert={deleteAlert}
          isClockedIn={isClockedIn}
        />
        }

      </div>

    </Container>
  );
}
export default withRouter(Dashboard);


function DashboardContent({storeData, openCloseStatus, closeTime, donutData, formatTime }) {
  // Here we can define state variables that will only be used by this component

  return (
    <div>
      <h2>{storeData.storeName}</h2>
      <h5 className='dashboardAddress'>{storeData.location.address1} {storeData.location.address2}</h5>
      <h5 className={openCloseStatus === 'open' ? 'dashboardOpen' : 'dashboardClosed'}>Currently <strong>{openCloseStatus}</strong></h5>
      {closeTime && 
        <h5 className='closesAt'> Closes at <strong>{formatTime(closeTime)} today</strong></h5>
      }
      <h5 className="currentCapacity">Current occupancy: <strong>{storeData.currentCount}</strong>/{storeData.maxOccupants}</h5>
      <h2><strong>{Math.floor((storeData.currentCount / storeData.maxOccupants) * 100) }%</strong></h2>
      <Doughnut data = {donutData} />
      <Button className="refresh-btn" onClick={() => window.location.reload(false)}>Refresh</Button>
    </div>
  );
}


// Custom stylin for our searchbar
const customStyles = {
  option: (provided, state) => ({
    ...provided,
    color: state.isFocused ? 'white' : 'black',
    background: state.isFocused ? '#0875bb' : 'white',
    transition: '100ms'
  }),

  singleValue: (provided) => {
    return { ...provided };
  }
};
  

function EmployeeContent({searchData, setSelectedVisit, selectedVisit, confirmVisitHandler, errorMessage, deleteAlert, isClockedIn, handleShow }) {
  // Here we can define state variables that will only be used by this component
  {/* //TODO: Make clockout button and switch views. ALSO FINISH SEARCHBAR and CONFIRMATION!! */}

  return (
    <div>
      { isClockedIn ? 
        <Button className="clockOut-btn" onClick={handleShow}>Clock Out?</Button>
        :
        <Button className="clockIn-btn" onClick={handleShow}>Clock In?</Button>
      }

      { isClockedIn ?
        <VisitSearchBar 
          searchData={searchData}
          setSelectedVisit={setSelectedVisit}
          selectedVisit={selectedVisit}
          confirmVisitHandler={confirmVisitHandler}
          errorMessage={errorMessage}
          deleteAlert={deleteAlert}
          isClockedIn={isClockedIn}
        />
        :
        ''
      }
    </div>
  );
}


function VisitSearchBar({searchData, setSelectedVisit, selectedVisit, confirmVisitHandler, errorMessage, deleteAlert}) {
  return (
    <div>
      <h5>Today&apos;s Visits</h5>
      <h6 className='selectedVisit'><strong>{selectedVisit}</strong></h6>
      <Select
        classname="searchBar"
        styles={customStyles}
        options={searchData}
        onChange = {evt => setSelectedVisit(evt.label)}
      />
      <Button className="submit-btn" onClick={confirmVisitHandler} variant="secondary" type="submit">Confirm Visit</Button>
      { errorMessage ? 
        <Alert className="alertBox" variant='warning'>
          {errorMessage}
        </Alert>
        : ''
      }
      { deleteAlert &&
      <Alert variant="success">
        Visit confirmed
      </Alert>
      }
    </div>
  );
}


function NoStoreID() {
  return (
    <div>
      <h5 className="dashboardNoStore">Go to &quot;<strong>Select a store</strong>&quot; in the navigation bar and select a store in order to view this page&apos;s content</h5>
    </div>
  );
}


Dashboard.propTypes = {
  history: PropTypes.object.isRequired
};


DashboardContent.propTypes = {
  storeData: PropTypes.object.isRequired,
  openCloseStatus: PropTypes.string.isRequired,
  closeTime: PropTypes.string.isRequired,
  donutData: PropTypes.object.isRequired,
  formatTime: PropTypes.func.isRequired
};


EmployeeContent.propTypes = {
  handleShow: PropTypes.func.isRequired,
  isClockedIn: PropTypes.bool.isRequired,
  deleteAlert: PropTypes.string.isRequired,
  searchData: PropTypes.array.isRequired,
  selectedVisit: PropTypes.string,
  setSelectedVisit: PropTypes.func.isRequired,
  confirmVisitHandler: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired
};


VisitSearchBar.propTypes = {
  deleteAlert: PropTypes.string.isRequired,
  searchData: PropTypes.array.isRequired,
  selectedVisit: PropTypes.string,
  setSelectedVisit: PropTypes.func.isRequired,
  confirmVisitHandler: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired
};