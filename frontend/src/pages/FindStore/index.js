import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {Container, Button, Alert} from 'react-bootstrap';
import Select from 'react-select';
import logo from '../Login/logo.png';

import './findstore.css';

export default function FindStore({ history }) {
    // Store's id
    const [selectedStore, setSelectedStore] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const searchList = [];
    useEffect(() => {
      const fetchData = async () => {
        const storeList = await api.get('/store');
        // populate our search list
        storeList.data.forEach(function (store) {
            const storeName = store.storeName;
            const storeCity = store.location.city;
            const storeState = store.location.state;
            const storeAddress1 = store.location.address1;
            const storeAddress2 = store.location.address2;
            const storeId = store._id;
            const label = storeName + ' - ' + storeCity + ', ' + storeState + ' ' + storeAddress1 + ' ' + storeAddress2;
            searchList.push({label: label, value: storeId});
        });
        console.log("Our options: ", searchList);
      }
      fetchData();
    }, [searchList]);

    // Function that will talk to server api when button is clicked
    const handleSubmit = async evt => {
      evt.preventDefault();
      if (!selectedStore) {
        setErrorMessage("Please select a store.");
      } else {
        // Get the store's id from our generated search list
        const getStoreId = searchList.find( ({label}) => label === selectedStore);
        const storeId =  getStoreId.value;
        console.log(getStoreId);
        // set storeId to selected store in local storage
        localStorage.setItem('store', storeId);
        history.push('/');
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

        singleValue: (provided, state) => {
          return { ...provided };
        }
    }

    // everything inside the return is JSX (like HTML) and is what gets rendered to screen
    return (
      <Container>
        <div className="content">
        <h4>Find your store</h4>
          <Select
            classname="searchBar"
            styles={customStyles}
            options={searchList}
            onChange = {evt => setSelectedStore(evt.label)}
          />
          <h5>Selected store: <strong>{selectedStore}</strong></h5>
          <p><br></br>You can search via the store's name or its address like so: <strong>101 Zoey St</strong> 
          <br></br><br></br>You can also view all supported stores in your city like so: <strong> MyCityName, TX</strong>
          </p>
          <Button className="submit-btn" onClick = {handleSubmit} variant="secondary" type="submit">Select Store</Button>
          {errorMessage ? (
      /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox" variant='warning'>
            {errorMessage}
          </Alert>
        ): ""}
        </div>
      </Container>
      );
}