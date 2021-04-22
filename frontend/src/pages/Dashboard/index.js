import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Doughnut } from 'react-chartjs-2';
import { Container, Button, Modal, Alert, Form } from 'react-bootstrap';
import Select from 'react-select';
import './dashboard.css';
import PropTypes from 'prop-types';
import { withRouter, useHistory } from 'react-router-dom';
import jwt from 'jsonwebtoken';
import {
  refresh,
  protectPage
} from '../verifyTokens/tokenFunctions';


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
  const [employeeRole, setEmployeeRole] = useState('');
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
  // Delete alert 
  const [deleteAlert, setDeleteAlert] = useState('');

  // determining which function to run if user clicks yes in modal
  const [runFunc, setRunFunc] = useState(''); 
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const refreshToken = localStorage.getItem('refreshToken');
  const store_id = localStorage.getItem('store');
  const [occupancyChangeValue, setOccupancyChangeValue] = useState(0);
  const [amountError, setAmountError] = useState('');
  const [occupancySuccess, setOccupancySuccess] = useState('');

  let donutOptions;

  useEffect(async () => {
    try {
      if (!store_id) {
        history.push('/findStore');
        return;
      }
      await refreshPageData();
    } catch (error) {
      console.log('response.data not found');
    }
  }, []);
    

  // Fetch a store's visits for today
  async function getStoreVisits() {
    let accessToken = localStorage.getItem('accessToken');
    let headers = {
      authorization: `Bearer ${accessToken}`
    };
    let storeVisits = await api.get(`/visits/${store_id}`, { headers });

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
        headers = {
          authorization: `Bearer ${newAccessToken}`
        };
        storeVisits = await api.get(`/visits/${store_id}`, { headers });
      }
    }

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
        visitsToday.push({label, value: visit_id, date: Date.parse(visitDate)});
      }
    }

    // sort the visits
    visitsToday.sort((a, b) => (a.date > b.date) ? 1 : -1);

    // push to a new list containing only a label and value, this is needed for the searchbar data
    let visitSearchList = [];
    for (let i=0; i < visitsToday.length; i++) {
      visit = visitsToday[i];

      visitSearchList.push({label: visit.label, value: visit.value});
    }


    console.log('VISITS:', visitSearchList);

    return visitSearchList;
  }

  // Fetch page data again
  async function refreshPageData() {
    // Ensure user has a store id
    let accessToken = localStorage.getItem('accessToken');

    let user = jwt.decode(accessToken);

    if (!user) {
      user = protectPage(accessToken, refreshToken);
    }
      
    let headers = {
      authorization: `Bearer ${accessToken}`
    };
      // Get store object and verify the user's accessToken
    let response = await api.get(`/store/${store_id}`, { headers });
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
        headers = {
          authorization: `Bearer ${newAccessToken}`
        };
        response = await api.get(`/store/${store_id}`, { headers });
      }
    }

    setIsClockedIn(user.clockedIn);

    // Else we know at this point, the user's token is verified
    // Set our store data to be displayed
    setStoreData(response.data);  


    // Set our donut chart data
    const vacantSpots = response.data.maxOccupants - response.data.currentCount;
    donutOptions = {
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
              


    /**        BUSINESS HOURS VALIDATION CHECKS           ***/
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

    /**        END            ***/


    /********************Validation checks for employee view********************/
    if (user.role !== 'employee' && user.role !== 'manager' && user.role !== 'owner' ) {
      return;
    }
    // Get store's company_id
    const storeCompany_id = response.data.company_id;

    // If the user's business_id does not mach store_id or company_id then return.
    if (user.business_id === store_id || user.business_id === storeCompany_id) {
      setEmployeeStatus(true);
      setEmployeeRole(user.role);
    } else {
      return; 
    }
    /*******************     END       **************** */

    //set our search data
    setSearchData(await getStoreVisits());

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


  async function handleClockInOut() {
    let clockInOut = '';
    if (isClockedIn) {
      clockInOut = '/clockOut';
    } else if (!isClockedIn) {
      clockInOut = '/clockIn';
    }

    try {
      let accessToken = localStorage.getItem('accessToken');
      const user = await protectPage(accessToken, refreshToken);
      const user_id = user._id;
  
      // Clock user in or out
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let getUser = await api.post(clockInOut, {user_id}, { headers });
  
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
          headers = {
            authorization: `Bearer ${newAccessToken}`
          };
          getUser = await api.post(clockInOut, {user_id}, { headers });
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
      
    } catch (error) {
      console.log('err in handle clock in and out');
    }
  }


  async function confirmVisitHandler() {
    try {
      if (!selectedVisit) {
        setErrorMessage('Please select a visit to confirm.');
        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
        handleClose();
        return;
      }
      let accessToken = localStorage.getItem('accessToken');
      let refreshToken = localStorage.getItem('refreshToken');

      // Get the store's id from our generated search list 
      const getVisitId = searchData.find( ({label}) => label === selectedVisit);
      const visit_id = getVisitId.value;
      
      // delete the visit
      // if an error occurs, then catch block will be triggered
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let response = await api.delete(`/myvisits/${visit_id}`, { headers });
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
          headers = {
            authorization: `Bearer ${newAccessToken}`
          };
          response = await api.delete(`/myvisits/${visit_id}`, { headers });
        }
      }
      
      // Set our delete alert for 5 seconds
      setDeleteAlert('Visit confirmed.');
      setTimeout(() => {
        setDeleteAlert('');
      }, 2000);
      
      setSelectedVisit('');
      setShow(false);
      response = await getStoreVisits();
      setSearchData(response);
      // Sleep function
      await delay(1500);

      await refreshPageData();

      // window.location.reload(false);
    } catch (error) {
      history.push('/login');
      console.log(error);
    }
  }

  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));


  async function handleModal() {
    if (runFunc === 'handleClockInOut') {
      console.log('running changeRole');
      await handleClockInOut();
    } else if (runFunc === 'confirmVisitHandler') {
      console.log('running removeEmployee');
      await confirmVisitHandler();
    } else if (runFunc === 'changeOccupancy') {

      if (occupancyChangeValue === 0) {
        setAmountError('Please enter a valid amount.');
        setTimeout(() => {
          setAmountError('');
        }, 15000);
        handleClose();
        return;
      }

      if (occupancyChangeValue > 0) {
        if ((storeData.currentCount + occupancyChangeValue) > storeData.maxOccupants) {
          setAmountError('Occupancy would overflow, please have the customer the join queue.');
          setTimeout(() => {
            setAmountError('');
          }, 9000);
          handleClose();
          return;
        } else {
          await changeOccupancy();
        }
      }

      if (occupancyChangeValue < 0) {
        if (storeData.currentCount + occupancyChangeValue < 0) {
          setAmountError('Current occupancy cannot be less than zero. Please enter a different amount');
          setTimeout(() => {
            setAmountError('');
          }, 9000);
          handleClose();
          return;
        } else {
          await changeOccupancy();
        }
      }
    }

  }


  async function changeOccupancy() {
    let accessToken = localStorage.getItem('accessToken');


    // Clock user in or out
    let headers = {
      authorization: `Bearer ${accessToken}`
    };

    let getStore = await api.post('/changeCount', { store_id, 'amount': occupancyChangeValue }, { headers });

    // If token comes back as expired, refresh the token and make api call again
    if (getStore.data.message === 'Access token expired') {
      const user = await protectPage(accessToken, refreshToken);
      // If the access token or refresh token are unlegit, then return.
      if (!user) {
        console.log('no user!');
        history.push('/login');
      } else {
        // overwrite storeList with the new access token.
        let newAccessToken = localStorage.getItem('accessToken');
        headers = {
          authorization: `Bearer ${newAccessToken}`
        };
        getStore = await api.post('/changeCount', { store_id, 'amount': occupancyChangeValue }, { headers });
      }
    }

    // Set our delete alert for 5 seconds
    setOccupancySuccess('Occupancy changed.');
    setTimeout(() => {
      setOccupancySuccess('');
    }, 1000);

    setShow(false);
 
    // refresh page
    await refreshPageData();
  }

  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      {/* Modal */}
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => handleModal()}>
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
          refreshPageData={refreshPageData}
          isClockedIn={isClockedIn}
          employeeStatus={employeeStatus}
          employeeRole={employeeRole}
        />
        }

        { employeeStatus &&
        <EmployeeContent
          searchData={searchData}
          setSelectedVisit={setSelectedVisit}
          selectedVisit={selectedVisit}
          confirmVisitHandler={confirmVisitHandler}
          errorMessage={errorMessage}
          deleteAlert={deleteAlert}
          isClockedIn={isClockedIn}
          handleShow={handleShow}
          setRunFunc={setRunFunc}
          setModalTitle={setModalTitle}
          setModalMessage={setModalMessage}
          setOccupancyChangeValue={setOccupancyChangeValue}
          occupancyChangeValue={occupancyChangeValue}
          amountError={amountError}
          occupancySuccess={occupancySuccess}
          employeeRole={employeeRole}
          openCloseStatus={openCloseStatus}
        />
        }
      </div>

    </Container>
  );
}
export default withRouter(Dashboard);


function DashboardContent({
  storeData,
  openCloseStatus,
  closeTime,
  donutData,
  formatTime,
  employeeRole,
  isClockedIn,
  employeeStatus
}) {
  // Here we can define state variables that will only be used by this component
  let history = useHistory();

  return (
    <div>
      <h2>{storeData.storeName}</h2>
      <h5 className='dashboardAddress'>{storeData.location.address1} {storeData.location.address2}</h5>
      <h5 className={openCloseStatus === 'open' ? 'dashboardOpen' : 'dashboardClosed'}>Currently <strong>{openCloseStatus}</strong></h5>
      {closeTime && 
        <h5 className='closesAt'> Closes at <strong>{formatTime(closeTime)} today</strong></h5>
      }

      { employeeStatus && employeeRole === 'manager' || employeeRole === 'owner' ? 
        <button className="submit-btn dashEmployees" onClick={() => history.push('/employees')}>← View Employees</button>
        :
        ''
      }

      <h5 className="currentCapacity">Current occupancy: <strong>{storeData.currentCount}</strong>/{storeData.maxOccupants}</h5>
      <h2><strong>{Math.floor((storeData.currentCount / storeData.maxOccupants) * 100) }%</strong></h2>
      <Doughnut data = {donutData} />

      { isClockedIn && employeeStatus ?
        ''
        :
        <Button className="refresh-btn" onClick={() => window.location.reload(false)}>
        Refresh
        </Button>
      }
    </div>
  );
}




function EmployeeContent({
  searchData,
  setSelectedVisit,
  selectedVisit,
  errorMessage,
  deleteAlert,
  isClockedIn,
  handleShow,
  setRunFunc,
  setModalTitle,
  setModalMessage,
  setOccupancyChangeValue,
  occupancyChangeValue,
  amountError,
  occupancySuccess,
  openCloseStatus
}) {
  // Here we can define state variables that will only be used by this component
  return (
    <div>

      { isClockedIn ? 
        <h5 className='dash-h5'>Change occupancy</h5> : ''
      }

      { isClockedIn ?
        <button className='submit-btn decreaseCount' onClick={() => { setOccupancyChangeValue(prevCount => prevCount-1); }}>
          -
        </button> : ''
      }

      { isClockedIn ?
        <Form.Control className='dashboard-amount' type="number" placeholder={occupancyChangeValue} readOnly onChange={evt => setOccupancyChangeValue(evt.target.value)}/> : ''
      }

      { isClockedIn ?
        <button className='submit-btn increaseCount' onClick={() => { setOccupancyChangeValue(prevCount => prevCount+1); }}>
          +
        </button> : ''
      }

      <br/>

      { isClockedIn ? 
        <button className='secondary-btn changeOccupancy' onClick={() => { setRunFunc('changeOccupancy'); setModalTitle('Change occupancy by ' + occupancyChangeValue + ' ?'); setModalMessage('Are you sure?'); handleShow();} }>
          Change
        </button>
        :
        ''
      }


      { occupancySuccess ? (
      /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
        <Alert className="alertBox occupancySuccess" variant='success'>
          {occupancySuccess}
        </Alert>
      ): ''}

      { amountError ? (
      /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
        <Alert className="alertBox amountError" variant='warning'>
          {amountError}
        </Alert>
      ): ''}


      { isClockedIn ?
        <VisitSearchBar 
          searchData={searchData}
          setSelectedVisit={setSelectedVisit}
          selectedVisit={selectedVisit}
          errorMessage={errorMessage}
          deleteAlert={deleteAlert}
          handleShow={handleShow}
          setRunFunc={setRunFunc}
          setModalTitle={setModalTitle}
          setModalMessage={setModalMessage}
        />
        :
        ''
      }

      <br/>

      { openCloseStatus === 'open' ?
        <p>Clock in/out below to switch views.</p>
        :
        ''
      }

      { isClockedIn && openCloseStatus === 'open' ? 
        <Button className="clockOut-btn" onClick={() => { setRunFunc('handleClockInOut'); setModalTitle('Clock out?'); setModalMessage('Are you sure you want to clock out?'); handleShow();}}>Clock Out?</Button>
        :
        ''
      }

      { !isClockedIn && openCloseStatus === 'open' ? 
        <Button className="clockIn-btn" onClick={() => { setRunFunc('handleClockInOut'); setModalTitle('Clock in?'); setModalMessage('Are you sure you want to clock in?'); handleShow();}}>Clock In?</Button>
        :
        ''
      }

    </div>
  );
}

// Custom stylin for our searchbar
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
  },

  control: base => ({
    ...base,
    '&:hover': { border: '1px solid #445469', boxShadow: '0px 0px 1px #445469' }, // border style on hover
    border: '1px solid #445469',
    // This line disable the blue border
    boxShadow: 'none'
  })
};


function VisitSearchBar({
  searchData,
  setSelectedVisit,
  selectedVisit,
  errorMessage,
  deleteAlert,
  handleShow,
  setRunFunc,
  setModalTitle,
  setModalMessage }) {
  return (
    <div>
      {selectedVisit &&
        <h6 className='selectedVisit'>Visit selected:<br/><strong> {selectedVisit}</strong></h6>
      }
      <h5>Today&apos;s Visits</h5>
      <Select
        key={`unique_select_key_${selectedVisit}`}
        value={selectedVisit || ''}
        classname="searchBar"
        styles={customStyles}
        options={searchData}
        onChange = {evt => setSelectedVisit(evt.label)}
      />
      <Button className="secondary-btn" onClick={() => { setRunFunc('confirmVisitHandler'); setModalTitle('Confirm visit?'); setModalMessage('Are you sure you want to confirm this visit?'); handleShow();}}>
        Confirm Visit
      </Button>
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
      <h5 className="dashboardNoStore">Go to <strong><a className='hyperlinks' href='/findStore'>Select a store</a></strong> in order to view this page&apos;s content.</h5>
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
  formatTime: PropTypes.func.isRequired,
  refreshPageData: PropTypes.func.isRequired,
  employeeRole: PropTypes.string,
  isClockedIn: PropTypes.bool.isRequired,
  employeeStatus: PropTypes.bool.isRequired
};


EmployeeContent.propTypes = {
  handleShow: PropTypes.func.isRequired,
  setRunFunc: PropTypes.func.isRequired,
  setModalTitle: PropTypes.func.isRequired,
  setModalMessage: PropTypes.func.isRequired,
  isClockedIn: PropTypes.bool.isRequired,
  deleteAlert: PropTypes.string.isRequired,
  searchData: PropTypes.array.isRequired,
  selectedVisit: PropTypes.string,
  setSelectedVisit: PropTypes.func.isRequired,
  confirmVisitHandler: PropTypes.func.isRequired,
  errorMessage: PropTypes.string.isRequired,
  setOccupancyChangeValue: PropTypes.func.isRequired,
  occupancyChangeValue: PropTypes.number.isRequired,
  amountError: PropTypes.string.isRequired,
  occupancySuccess: PropTypes.string.isRequired,
  employeeRole: PropTypes.string.isRequired,
  openCloseStatus: PropTypes.string.isRequired
};


VisitSearchBar.propTypes = {
  deleteAlert: PropTypes.string.isRequired,
  searchData: PropTypes.array.isRequired,
  selectedVisit: PropTypes.string,
  setSelectedVisit: PropTypes.func.isRequired,
  confirmVisitHandler: PropTypes.func,
  errorMessage: PropTypes.string.isRequired,
  handleShow: PropTypes.func.isRequired,
  setRunFunc: PropTypes.func.isRequired,
  setModalTitle: PropTypes.func.isRequired,
  setModalMessage: PropTypes.func.isRequired
};