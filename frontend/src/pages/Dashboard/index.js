import React, {useEffect, useState} from 'react';
import api from '../../services/api';
import { Doughnut } from 'react-chartjs-2';
import { Container } from 'react-bootstrap';
import './dashboard.css';

// Dashboard will show a store's current stats
export default function Dashboard() {

  const user_id = localStorage.getItem('user');
  console.log('Dashboard - userId:', user_id);
  const store_id = localStorage.getItem('store');
  const [donutData, setDonutData] = useState({});
  const [storeData, setStoreData] = useState({});

  console.log(storeData);

  useEffect(() => {
    (async () => {
      const response = await api.get(`/store/${store_id}`);
      setStoreData(response.data);
      // const vacantSpots = response.data.maxOccupants - response.data.currentCount;
      const donutOptions = {
        datasets: [{
          data: [20, 40],
          // data: [response.data.currentCount, vacantSpots],
          backgroundColor: ['#0a6096', '#445469'],
          hoverBorderColor: ['grey', 'grey'],
          hoverBorderWidth: 2,
          borderWidth: 3
        }],
        labels: ['Customers Present', 'Vacant Spots'],
      };
      setDonutData(donutOptions);
    })();
  }, []);
      

  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <div className="content">
        { storeData.storeName &&
          <h2>{storeData.storeName}</h2>
        }
        { storeData.location && 
          <h6>
            {storeData.location.address1} {storeData.location.address2}
          </h6>
        }
        { storeData.storeName &&
          <p className="currentCapacity">Current capacity: <strong>20</strong>/60</p>
        }
        {!storeData.storeName &&
          <h5 className="currentCapacity">Go to &quot;Select a store&quot; in the navigation bar to select a store</h5>
        }
        {/* <p>Current capacity: {storeData.currentCount}/{storeData.maxOccupants}</p> */}
        { donutData &&
          <Doughnut data = {donutData} />
        }
      </div>
    </Container>
  );
}