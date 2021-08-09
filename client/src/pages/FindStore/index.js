import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {Container, Button, Alert} from 'react-bootstrap';
import Select from 'react-select';
import { useHistory } from 'react-router-dom';
import {
  protectPage
} from '../verifyTokens/tokenFunctions';

import './findstore.css';

function FindStore() {
  const history = useHistory();

  // Store's id
  const [selectedStore, setSelectedStore] = useState('');
  const [preSelectedStore, setPreSelectedStore] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchData, setSearchData] = useState([]);

  const store_id = localStorage.getItem('store');
  
  let accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  useEffect(() => {
    let controller = new AbortController();
    (async () => {
      try {
        await protectPage(accessToken, refreshToken);
        accessToken = localStorage.getItem('accessToken');
        let headers = {
          authorization: `Bearer ${accessToken}`
        };
        // Get search list data
        let storeList = await axios.get('/store/getall', { signal: controller.signal, headers });
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
        
        // If user has preselected store, display it
        if (store_id) {
          let storeData = await axios.get(`/store/get/${store_id}`, { signal: controller.signal, headers });
          if (storeData.data)
            setPreSelectedStore(storeData.data.storeName);
        }

        
      } catch (error) {
        console.log(error);
      }
    })();
    return () => controller?.abort();
  }, []);
  
  
  // Function that will talk to server api when button is clicked
  const handleSubmit = async evt => {
    evt.preventDefault();
    if (!selectedStore) {
      setErrorMessage('Please first select a store in the search bar.');
      setTimeout(() => {
        setErrorMessage('');
      }, 7000);
      return;
    } else {
      // Get the store's id from our generated search list 
      const getStoreId = searchData.find( ({label}) => label === selectedStore);
      const storeId = getStoreId.value;
      // set storeId to selected store in a cookie with secure option set. meaning this cookie is only readable on HTTPS
      localStorage.setItem('store', storeId, { secure: true });

      // refresh page
      window.location.reload(false);
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
      <div className="content findStore">
        <h4>Find your store</h4>
        <Select
          classname="searchBar"
          styles={customStyles}
          options={searchData}
          onChange = {evt => setSelectedStore(evt.label)}
        />

        { preSelectedStore && !selectedStore ? 
          <p>Select a new store below </p>
          : ''
        }

        { selectedStore && 
          <p>Select a new store below <br/> <strong>{selectedStore}</strong></p>
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

        { preSelectedStore ?
        /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox clickDashBtn" variant='success'>
            <strong>{preSelectedStore} is currently selected. All other pages are viewable.</strong>
          </Alert>
          : ''
        }

        { preSelectedStore ? ''
          :
          <Alert className="alertBox clickDashBtn" variant='warning'>
            <strong>Select a store to start scheduling visits and view a store&apos;s occupancy.</strong>
          </Alert>
        }

        { preSelectedStore ? 
          <button className="submit-btn dashboard" onClick={() => history.push('/dashboard')}>
          ← Dashboard
          </button>
          :
          <br/>
        }
        <br />
        { preSelectedStore ? 
          <button className="submit-btn findStore-visit" onClick={() => history.push('/visit/schedule')}>
                  ← Schedule a Visit
          </button>
          :
          <br/>
        }



        <p className='findStore-p2'><br></br>You can search via the store&apos;s name like so: 
          <br/><strong>Wonder World Co.</strong>
          <br/>or its address:
          <br/><strong>101 Redwood St</strong>
          <br></br><br></br>You can also view all supported stores in your city like so: <br/> <strong> MyCityName, TX</strong>
        </p>
        <br/>

        <p>Want setup your <strong>own store?</strong></p>
        <button className="submit-btn find-createStore" onClick={() => history.push('/store/create')}>
          Create a store
        </button>
      </div>
    </Container>
  );
}
export default FindStore; 