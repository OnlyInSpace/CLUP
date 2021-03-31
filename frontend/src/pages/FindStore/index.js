import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import auth from '../../services/auth';
import {Container, Button, Alert} from 'react-bootstrap';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { withRouter, useHistory } from 'react-router-dom';

import './findstore.css';

function FindStore() {
  const history = useHistory();

  // Store's id
  const [selectedStore, setSelectedStore] = useState('');
  const [preSelectedStore, setPreSelectedStore] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchData, setSearchData] = useState([]);

  const store_id = localStorage.getItem('store');
  
  console.log(searchData);

  
  useEffect(async () => {
    try {
      let accessToken = localStorage.getItem('accessToken');
      let refreshToken = localStorage.getItem('refreshToken');

      if (store_id) {
        let storeData = await api.get(`/store/${store_id}`, { headers: {'accessToken': accessToken }});
  
        // If token comes back as expired, refresh the token and make api call again
        if (storeData.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            console.log('no user!');
            history.push('/login');
          } else {
            // overwrite storeData with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            accessToken = newAccessToken;
            storeData = await api.get(`/store/${store_id}`, { headers: {'accessToken': newAccessToken }});
          }
        }
        setPreSelectedStore(storeData.data.storeName);
      }

      let storeList = await api.get('/store', { headers: {'accessToken': accessToken }});

      // If token comes back as expired, refresh the token and make api call again
      if (storeList.data.message === 'Access token expired') {
        const user = await protectPage(accessToken, refreshToken);
        // If the access token or refresh token are unlegit, then return.
        if (!user) {
          setErrorMessage('Please log in again.');
          console.log('no user!');
          history.push('/login');
        } else {
          // overwrite storeList with the new access token.
          let newAccessToken = localStorage.getItem('accessToken');
          storeList = await api.get('/store', { headers: {'accessToken': newAccessToken }});
        }
      }
      // populate our search list
      const formattedData = storeList.data.map(store => {
        const storeName = store.storeName;
        const storeCity = store.location.city;
        const storeState = store.location.state;
        const storeAddress1 = store.location.address1;
        const storeAddress2 = store.location.address2;
        const storeId = store._id;
        const label = storeName + ' - ' + storeCity + ', ' + storeState + ' - \r\n' + storeAddress1 + ' ' + storeAddress2;
        return {label, value: storeId};
      });
      setSearchData(formattedData);
        
    } catch (error) {
      console.log(error);
    }
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


  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));
  
  
  // Function that will talk to server api when button is clicked
  const handleSubmit = async evt => {
    evt.preventDefault();
    if (!selectedStore) {
      setErrorMessage('Please select a store.');
      return;
    } else {
      // Get the store's id from our generated search list 
      const getStoreId = searchData.find( ({label}) => label === selectedStore);
      const storeId = getStoreId.value;
      console.log(getStoreId);
      // set storeId to selected store in a cookie with secure option set. meaning this cookie is only readable on HTTPS
      localStorage.setItem('store', storeId, { secure: true });

      // refresh page
      window.location.reload(false);
      await delay(3000);
    }
  };

  
  function goToDashboard() {
    history.push('/dashboard');
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

  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        <h4>Find your store</h4>
        <Select
          classname="searchBar"
          styles={customStyles}
          options={searchData}
          onChange = {evt => setSelectedStore(evt.label)}
        />

        { preSelectedStore && !selectedStore ? 
          <p>Selected store: <br/> <strong>{preSelectedStore}</strong></p>
          : ''
        }

        { selectedStore && 
        <p>Selected store: <br/> <strong>{selectedStore}</strong></p>
        }

        <Button className="secondary-btn findstore" onClick={handleSubmit}>
          Select Store
        </Button>

        {errorMessage ?
        /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox findstore" variant='warning'>
            {errorMessage}
          </Alert>
          : ''
        }

        <p className='findStore-p1'>Click the button below to view the store&apos;s occupancy</p>

        <button className="submit-btn dashboard" onClick={goToDashboard}>
        ← Dashboard
        </button>


        <p className='findStore-p2'><br></br>You can search via the store&apos;s name or its address like so: <br/><strong>101 Zoey St</strong> 
          <br></br><br></br>You can also view all supported stores in your city like so: <br/> <strong> MyCityName, TX</strong>
        </p>
      </div>
    </Container>
  );
}
export default withRouter(FindStore); 

// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
FindStore.propTypes = {
  history: PropTypes.object.isRequired
};