import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Container, Button, Modal, Alert, Form, Row, Col } from 'react-bootstrap';
import Select from 'react-select';
import './dashboard.css';
import { useHistory } from 'react-router-dom';
import {
  refresh,
  protectPage
} from '../verifyTokens/tokenFunctions';


// Dashboard will show a store's current stats
function Dashboard() {
  let history = useHistory();
  const [donutData, setDonutData] = useState({});
  const [storeData, setStoreData] = useState({});
  // open/close label
  const [openCloseStatus, setOpenCloseStatus] = useState('open');
  const [closeTime, setCloseTime] = useState('');
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
  const [occupancyChangeValue, setOccupancyChangeValue] = useState(0);
  const [partyAmount, setPartyAmount] = useState('');
  // Alerts and error warnings
  const [amountError, setAmountError] = useState('');
  const [occupancySuccess, setOccupancySuccess] = useState('');
  const [partyError, setPartyError] = useState('');
  const [joinQueueAlert, setJoinQueueAlert] = useState('');
  // Display queue information for users if 'check queue' button is clicked
  const [checkLine, setCheckLine] = useState(false);
  // CSS classes
  const [contentClass, setContentClass] = useState('content');
  const [visitBarClass, setVisitBarClass] = useState(10);
  const [visitBarClass02, setVisitBarClass02] = useState(10);
  // prevent spam click
  const [doubleClick, setDoubleClick] = useState(false);

  // global tokens and store_id
  const refreshToken = localStorage.getItem('refreshToken');
  let accessToken = localStorage.getItem('accessToken');
  const store_id = localStorage.getItem('store');

  useEffect(() => {
    (async () => {
      try {
        if (!store_id) {
          return history.push('/findStore');
        }

        await refreshPageData();

        // Refresh every 10 seconds
        // const interval = setInterval(async () => {
        //   console.log('refreshing data', log);
        //   await refreshPageData();
        // }, 10000 );
        // return () => clearInterval(interval);

      } catch (error) {
        console.log('response.data not found');
      }
    })();
  }, []);


  // Fetch a store's visits for today
  async function getStoreVisits() {
    try {
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
      
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let storeVisits = await axios.get(`/visits/${store_id}`, { headers });
  
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
   
      // console.log('VISITS:', visitSearchList);
      return visitSearchList;
      
    } catch (error) {
      console.log('error in getStoreVisits');
    }
  }


  // Fetch page data again
  async function refreshPageData() {
    try {
      let user = await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');

      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      // Get store object and verify the user's accessToken
      let response = await axios.get(`/store/${store_id}`, { headers });

      if (!response.data) {
        return history.push('/findStore');
      }

      console.log(response.data.avgVisitLength);

      if (response.data.queue.length > 0 && user.clockedIn) {
        setContentClass('content dashboardContent');
        setVisitBarClass(6);
        setVisitBarClass02(8);
      } else {
        setContentClass('content smallDashContent');
      }
      setIsClockedIn(user.clockedIn);
  
      // Else we know at this point, the user's token is verified
      // Set our store data to be displayed
      setStoreData(response.data);    
  
      // Set our donut chart data
      const vacantSpots = response.data.maxOccupants - (response.data.currentCount);
      let filledSpots = response.data.currentCount;
      if (filledSpots > response.data.maxOccupants) {
        filledSpots = response.data.maxOccupants;
      }
      let donutOptions = {
        datasets: [{
          // data: [20, 40], //0a6096
          data: [filledSpots, vacantSpots],
          backgroundColor: ['#0a6096', '#b2b8c2'],
          hoverBorderColor: ['#000000', 'grey'],
          hoverBorderWidth: 2,
          borderWidth: 3
        }],
        labels: ['Customers Present', 'Vacant Spots']
      };
      setDonutData(donutOptions);                
      
      
      if (response.data.open24hours) {
        setOpenCloseStatus('open 24/7');
      } else {
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
    
        // If currentHour falls outside of business hours 
        if (businessOpenHours < businessCloseHours) {
          if (currentHour > businessCloseHours || currentHour < businessOpenHours ) {
            setOpenCloseStatus('closed');
          }
          // If currentHour is within the CLOSING hour, ensure current time is not too LATE
        } else if (currentHour === businessCloseHours) {
          if (currentMins > businessCloseMins) {
            setOpenCloseStatus('closed');
          }
          // If currentHour is within the OPENING hour, ensure current time is not too EARLY
        } else if (currentHour === businessOpenHours) {
          if (currentMins < businessOpenMins) {
            setOpenCloseStatus('closed');
          }
          // Ensure current time is not too early
        } else if ( (currentHour !== 0) && (currentHour < businessOpenHours)) {
          setOpenCloseStatus('closed');
          // Ensure current time is not too late
        } else if ( (businessCloseHours !== 0) && (currentHour > businessCloseHours) ) {
          setOpenCloseStatus('closed');
        }
    
        // Ensure the store is open
        if (!businessDay.open) {
          setOpenCloseStatus('closed');
        }  
      }
      /**        END            ***/

      /********************Validation checks for employee view********************/
      if (user.role !== 'employee' && user.role !== 'manager' && user.role !== 'owner' && !user.clockedIn) {
        return;
      }
      // Get store's company_id
      const storeCompany_id = response.data.company_id;
      // If the user's business_id does not mach store_id or company_id then clock them out else just return.
      if (user.business_id === store_id || user.business_id === storeCompany_id) {
        setEmployeeStatus(true);
        setEmployeeRole(user.role);
      } else if (user.clockedIn === true) {
        // clock user out
        setIsClockedIn(false);
        let user_id = user._id;
        await axios.post('/clockOut', {user_id}, { headers });
      } else {
        return; 
      }
      /*******************     END       **************** */
              
      //set our search data
      setSearchData(await getStoreVisits());
      
    } catch (error) {
      history.push('/findStore');
      console.log('error in refreshPageData');
    }

  }


  async function handleClockInOut() {
    let clockInOut = '';
    if (isClockedIn) {
      clockInOut = '/clockOut';
    } else if (!isClockedIn) {
      clockInOut = '/clockIn';
    }
    try {
      const user = await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');

      const user_id = user._id;
      // Clock user in or out
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      await axios.post(clockInOut, {user_id}, { headers });
      handleClose();
      // Refresh our user's token so that their clockIn status is updated in localstorage
      await refresh(refreshToken);
      await delay(500);
      setDoubleClick(false);
      // refresh page
      window.location.reload(false);      
    } catch (error) {
      handleClose();
      console.log('err in handle clock in and out');
    }
  }


  async function confirmVisitHandler() {
    try {
      var visit_id;
      // Get the store's id from our generated search list 
      const getVisitId = searchData.find( ({label}) => label === selectedVisit);
      if (getVisitId)
        visit_id = getVisitId.value;
    
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
      // if an error occurs, then catch block will be triggered
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let response = await axios.delete(`/confirmVisit/${visit_id}`, { headers });
      handleClose();

      if (response.data.message) {
        setErrorMessage(response.data.message);
        await delay(500);
        setDoubleClick(false);
        await delay(8000);
        setErrorMessage('');
        setSelectedVisit('');
        return;
      }
      
      // Set our delete alert for 5 seconds
      setDeleteAlert('Visit confirmed.');
      await delay(500);
      setDoubleClick(false);
      await delay(2000);
      setDeleteAlert('');
      setSelectedVisit('');
      // // Sleep function
      // await delay(1500);
      await refreshPageData();

    } catch (error) {
      handleClose();
      console.log('error in confirmVisit handler');
    }
  }


  async function changeOccupancy() {
    try {
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
  
      // Clock user in or out
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      const newStoreData = await axios.put('/changeCount', { store_id, occupancyChangeValue, storeData }, { headers });
      handleClose();
      // Warning if validation did not pass
      if (newStoreData.data.message) {
        setAmountError(newStoreData.data.message);
        await delay(500);
        setDoubleClick(false);
        await delay(9000);        
        setAmountError('');
        return;
      }
  
      setStoreData(newStoreData.data);
      await delay(500);
      setDoubleClick(false);
      // Success alert
      setOccupancySuccess('Occupancy changed.');
      await delay(1000);
      setOccupancySuccess('');
    } catch (error) {
      handleClose();
      console.log('error in change occupancy');
    }
  }


  async function joinQueue() {
    try {
      let user = await protectPage(accessToken, refreshToken);  

      let customer = {
        user_id: user._id,
        phoneNumber: user.phoneNumber,
        partyAmount: parseInt(partyAmount),
        minsLate: 0,
        startTime: Date.now(),
        alerted: false
      };

      accessToken = localStorage.getItem('accessToken');
      // Clock user in or out
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
  
      let joinQueue = await axios.put('/queue/append', { customer, store_id, storeData }, { headers });
      handleClose();

      // set alert if user is in queue
      if (joinQueue.data.message) {
        setPartyError(joinQueue.data.message);
        await delay(500);
        setDoubleClick(false);
        await delay(5000);
        setPartyError('');
        return;
      }

      // Set our delete alert for 5 seconds
      setJoinQueueAlert('You\'ve joined the queue! We will send you a text message once it\'s your turn.' +
                        '\nYour cell: ' + customer.phoneNumber);

      await delay(500);
      setDoubleClick(false);
      // refresh page
      setStoreData(joinQueue.data);
      
    } catch (error) {
      handleClose();
      console.log('error in joinQueue');
    }
  }


  async function popQueue() {
    try {
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
      // Clock user in or out
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
  
      let popQueue = await axios.post('/queue/pop', { store_id }, { headers });
      handleClose();

      if (popQueue.data.message) {
        setErrorMessage(popQueue.data.message);
        await delay(500);
        setDoubleClick(false);
        await delay(3000);
        setErrorMessage('');
        return;
      }
  
      // Set our delete alert for 5 seconds
      setDeleteAlert('Line moved forward.');
      await delay(500);
      setDoubleClick(false);
      await delay(2500);
      setDeleteAlert('');

      if (popQueue.data.queue.length === 0) {
        await delay(1500);
        window.location.reload(false);     
        return; 
      }

      await refreshPageData();
      
    } catch (error) {
      handleClose();
      console.log('error in popQueue');
    }
  }


  async function skipCustomer() {
    try {
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
      // Clock user in or out
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
  
      let skipCustomer = await axios.put('/queue/skip', { store_id }, { headers });
      handleClose();

      // Set our delete alert for 5 seconds
      setDeleteAlert('Customer skipped.');
      await delay(500);
      setDoubleClick(false);
      await delay(2000);
      setDeleteAlert('');

      if (skipCustomer.data.queue.length === 0) {
        await delay(1500);
        window.location.reload(false);     
        return; 
      }

      await refreshPageData();
    } catch (error) {
      handleClose();
      console.log('error in skipCustomer');
    }
  }


  async function cancelVisit() {
    try {
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
  
      // Get the store's id from our generated search list 
      var visit_id;
      const getVisitId = searchData.find( ({label}) => label === selectedVisit);
      if (getVisitId)
        visit_id = getVisitId.value;

      // Clock user in or out
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      const response = await axios.delete(`/myvisits/${visit_id}`, { headers });
      handleClose();

      if (response.data.message) {
        setErrorMessage(response.data.message);
        await delay(500);
        setDoubleClick(false);
        await delay(4000);
        setErrorMessage('');
        return;
      }

      // Set our delete alert for 5 seconds
      setDeleteAlert('Visit canceled.');
      await delay(500);
      setDoubleClick(false);
      setSelectedVisit('');
      await delay(2000);
      setDeleteAlert('');
      await refreshPageData();
      
    } catch (error) {
      handleClose();
      console.log('error in cancel visit');
    }
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
  
  
  async function handleModal() {
    setDoubleClick(true);
    if (runFunc === 'handleClockInOut') {
      await handleClockInOut();
    } else if (runFunc === 'confirmVisitHandler') {
      await confirmVisitHandler();
    } else if (runFunc === 'joinQueue') {
      await joinQueue();
    } else if (runFunc === 'popQueue') {
      await popQueue();
    } else if (runFunc === 'changeOccupancy') {
      await changeOccupancy();
    } else if (runFunc === 'skipCustomer') {
      await skipCustomer();
    } else if (runFunc === 'cancelVisit') {
      await cancelVisit();
    }
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
    },

    control: base => ({
      ...base,
      '&:hover': { border: '1px solid #445469', boxShadow: '0px 0px 1px #445469' }, // border style on hover
      border: '1px solid #445469',
      // This line disable the blue border
      boxShadow: 'none'
    })
  };

  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container className='dashboard'>
      {/* Modal */}
      <Modal show={show} onHide={() => { handleClose(); setSelectedVisit(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          { !doubleClick && 
            <Button variant="primary" onClick={() => handleModal()}>
              Yes
            </Button>
          }
          <Button variant="secondary" onClick={() => { handleClose(); setSelectedVisit(''); }}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
      {/* End of Modal */}

      <div className={contentClass}>

        {/* Main dashboard content */}
        { storeData.location && 
          <React.Fragment>
            <h2 className='dash-storeName'>{storeData.storeName}</h2>
            <h5 className='dashboardAddress'>{storeData.location.address1} {storeData.location.address2}</h5>
            <h5 className={ openCloseStatus === 'open' || openCloseStatus === 'open 24/7' ? 
              'dashboardOpen' : 'dashboardClosed'}> Currently <strong>{openCloseStatus}</strong></h5>
            { closeTime && 
              <h5 className='closesAt'> Closes at <strong>{formatTime(closeTime)} today</strong></h5>
            }
    
            { employeeStatus && employeeRole === 'manager' || employeeRole === 'owner' &&
              <button className="submit-btn dashEmployees" onClick={() => history.push('/employees')}>← View Employees</button>
            }
    
            <h5 className="currentCapacity">Current occupancy: <strong>{storeData.currentCount}</strong>/{storeData.maxOccupants}</h5>
    
            <h2><strong>{Math.floor(((storeData.currentCount) / storeData.maxOccupants) * 100) }%</strong></h2>
          
            <div className='donutChart'>
              <Doughnut data = {donutData} />  
            </div>
    
            { (storeData.queue.length > 0 || storeData.currentCount + storeData.upcomingVisits >= storeData.maxOccupants) && !isClockedIn &&
              <p className='theresAline'>You can join the queue <br/> to get better priority</p>
            }
    
            { (storeData.queue.length > 0 || storeData.currentCount + storeData.upcomingVisits >= storeData.maxOccupants) && !checkLine && !isClockedIn &&
              <button onClick={() => setCheckLine(true)} className='secondary-btn checkLine'>Check queue</button>
            }
    

            {/* Customer queue section only viewabale when store is full or there is a queue */}
            { checkLine &&
              <React.Fragment>
                <p className='dash-queueLength'>Customers waiting in queue: <strong>{storeData.queue.length}</strong></p>
                <Form.Label className='dash-partyLabel'>Enter your party size to join the queue <br/> (include yourself)</Form.Label>
                <Form.Control className='dash-partySize' placeholder="Party size" onChange={evt => setPartyAmount(evt.target.value)}/>

                <p className='dash-maxParty'>Max party allowed: <strong>{storeData.maxPartyAllowed}</strong></p>


                { partyError &&
                  <Alert className='dash-alerts' variant='warning'>
                    {partyError}
                  </Alert>
                }

                { joinQueueAlert &&
                  <Alert variant='success'>{joinQueueAlert}</Alert>
                }

                <button className='secondary-btn joinQueue' onClick={() => { setRunFunc('joinQueue'); setModalTitle('Join the queue?'); setModalMessage('Would you like to join the current queue of ' + storeData.queue.length + ' people?'); handleShow();}} >
                  Join Queue?
                </button>

                <p>After joining the queue, <br/>  you will receive a <strong>text message</strong> <br/> once it&apos;s your turn to enter the store.</p>

              </React.Fragment>
            }
        

            { employeeStatus && isClockedIn ?
              ''
              :
              <Button className="submit-btn refresh-btn" onClick={() => refreshPageData()}>
                Refresh
              </Button>
            }

          </React.Fragment>
        }

        {/* Employee content */}
        { isClockedIn && employeeStatus &&
          <React.Fragment>
            <h5 className='dash-h5'>Change occupancy</h5>

            <button className='submit-btn decreaseCount' onClick={() => { setOccupancyChangeValue(prevCount => prevCount-1); }}>
              -
            </button>

            <Form.Control className='dashboard-amount' type="number" placeholder={occupancyChangeValue} readOnly onChange={evt => setOccupancyChangeValue(evt.target.value)}/>

            <button className='submit-btn increaseCount' onClick={() => { setOccupancyChangeValue(prevCount => prevCount+1); }}>
              +
            </button>

            <br/>

            <button className='secondary-btn changeOccupancy' onClick={() => { setRunFunc('changeOccupancy'); setModalTitle('Change occupancy by ' + occupancyChangeValue + ' ?'); setModalMessage('Are you sure?'); handleShow();} }>
              Change
            </button>


            { occupancySuccess &&
            /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
              <Alert className="alertBox occupancySuccess" variant='success'>
                {occupancySuccess}
              </Alert>
            }

            { amountError &&
            /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
              <Alert className="alertBox amountError" variant='warning'>
                {amountError}
              </Alert>
            }

            {/* Visit search bar and queue section */}
            <Row>
              {/* Visit search bar */}
              <Col className='dash-visitSelect' xs={visitBarClass02} md={visitBarClass}>
                { selectedVisit &&
                  <h6 className='selectedVisit'>Visit selected:<br/><strong> {selectedVisit}</strong></h6>
                }
                <h5>Today&apos;s Visits</h5>
                { storeData.upcomingVisits > 0 ? 
                  <p>Upcoming visits: <strong>{storeData.upcomingVisits}</strong></p>
                  : ''  
                }
                { storeData.lateVisits > 0 ? 
                  <p className='lateVisits'>Visits 15 mins or more late: <strong>{storeData.lateVisits}</strong></p>
                  : ''  
                }
                <Select
                  key={`unique_select_key_${selectedVisit}`}
                  value={selectedVisit || ''}
                  classname="searchBar"
                  styles={customStyles}
                  options={searchData}
                  onChange = {evt => setSelectedVisit(evt.label)}
                />
                <button className="submit-btn cancelVisit" onClick={() => { setRunFunc('cancelVisit'); setModalTitle(selectedVisit); setModalMessage('Are you sure you want to cancel this visit?'); handleShow();}}>
                  Cancel Visit
                </button>
                <button className="secondary-btn confirmVisit" onClick={() => { setRunFunc('confirmVisitHandler'); setModalTitle(selectedVisit); setModalMessage('Are you sure you want to confirm this visit?'); handleShow();}}>
                  Confirm
                </button>
                { errorMessage ? 
                  <Alert className="alertBox dash-warning" variant='warning'>
                    {errorMessage}
                  </Alert>
                  : ''
                }
                { deleteAlert &&
                  <Alert variant="success">
                    {deleteAlert}
                  </Alert>
                }
              </Col>
              <br/>


              {/* Employee queue section */}
              { storeData.queue.length > 0 &&
                <React.Fragment>
                  <Col className='employeeQueue' xs={8} md={6}>
                    <h5 className='dash-custmersInLine'>Customers in queue: {storeData.queue.length}</h5>   
                    <div className='dash-border'>
                      { storeData.queue.length > 0 &&
                        <React.Fragment>
                          <p>Next in line:</p>
                          <p className='queue-head'>{storeData.queue[0].phoneNumber} - Party of <strong>{storeData.queue[0].partyAmount}</strong></p>
                          <p className='queue-head'><strong>{(-storeData.queue[0].minsLate).toString()}</strong> minutes late</p>
                          <button className='submit-btn dash-skip' onClick={() => { setRunFunc('skipCustomer'); setModalTitle('Skip this person?'); setModalMessage('Would you like to skip the line forward?'); handleShow();}}>
                            Skip
                          </button>
                          <button className='secondary-btn dash-moveForward' onClick={() => { setRunFunc('popQueue'); setModalTitle('Check this person in?'); setModalMessage('Would you like to move the line forward?'); handleShow();}}>
                            Check In
                          </button>
                        </React.Fragment>
                      }
                    </div>
                  </Col>
                </React.Fragment>
              }
            </Row>
          </React.Fragment>
        }

        { employeeStatus &&
          <p className='p-clockIn'>Clock in/out below to switch views.</p>
        }

        { isClockedIn &&
          <Button className="clockOut-btn" onClick={() => { setRunFunc('handleClockInOut'); setModalTitle('Clock out?'); setModalMessage('Are you sure you want to clock out?'); handleShow();}}>Clock Out?</Button>
        }

        { employeeStatus && !isClockedIn &&
          <Button className="clockIn-btn" onClick={() => { setRunFunc('handleClockInOut'); setModalTitle('Clock in?'); setModalMessage('Are you sure you want to clock in?'); handleShow();}}>Clock In?</Button>
        }

      </div>

    </Container>
  );
}

export default Dashboard;