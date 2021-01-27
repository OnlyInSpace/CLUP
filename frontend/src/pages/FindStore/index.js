import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import auth from '../../services/auth';
import Cookies from 'js-cookie';
import {Container, Button, Alert} from 'react-bootstrap';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { withRouter, useHistory } from 'react-router-dom';

import './findstore.css';

function FindStore() {
  let history = useHistory();
  // Store's id
  const [selectedStore, setSelectedStore] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchData, setSearchData] = useState([]);
  // For backend
  const [errMessage, setErrMessage] = useState('');
  

  console.log(searchData);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = Cookies.get('accessToken');
        let refreshToken = Cookies.get('refreshToken');

        let storeList = await api.get('/store', { headers: {'accessToken': accessToken }});

        // If token comes back as expired, refresh the token and make api call again
        if (storeList.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            setErrMessage('Please log in again.');
            console.log(errMessage);
            history.push('/login');
          } else {
            // overwrite storeList with the new access token.
            let newAccessToken = Cookies.get('accessToken');
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
          const label = storeName + ' - ' + storeCity + ', ' + storeState + ' ' + storeAddress1 + ' ' + storeAddress2;
          return {label, value: storeId};
        });
        setSearchData(formattedData);
        
      } catch (error) {
        console.log(error);
        history.push('/login');
      }
    };
    fetchData();
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
    return response.data.user.userData;     
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


  // Function that will talk to server api when button is clicked
  const handleSubmit = async evt => {
    evt.preventDefault();
    if (!selectedStore) {
      setErrorMessage('Please select a store.');
    } else {
      // Get the store's id from our generated search list 
      const getStoreId = searchData.find( ({label}) => label === selectedStore);
      const storeId = getStoreId.value;
      console.log(getStoreId);
      // set storeId to selected store in a cookie with secure option set. meaning this cookie is only readable on HTTPS
      Cookies.set('store', storeId, { secure: true });
      history.push('/dashboard');
    }
  };

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
        <h5>Selected store: <strong>{selectedStore}</strong></h5>
        <p><br></br>You can search via the store&apos;s name or its address like so: <strong>101 Zoey St</strong> 
          <br></br><br></br>You can also view all supported stores in your city like so: <strong> MyCityName, TX</strong>
        </p>
        <Button className="submit-btn" onClick = {handleSubmit} variant="secondary" type="submit">Select Store</Button>
        {errorMessage ? (
        /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox" variant='warning'>
            {errorMessage}
          </Alert>
        ): ''}
      </div>
    </Container>
  );
}
export default withRouter(FindStore); 

// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
FindStore.propTypes = {
  history: PropTypes.object.isRequired
};