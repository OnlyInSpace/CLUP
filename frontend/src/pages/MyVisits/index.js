import React, {useEffect, useState} from 'react';
import api from '../../services/api';
import {Container, Card, Button} from 'react-bootstrap';
import './myvisits.css';

// Dashboard will show a store's current stats
export default function MyVisits() {
    // Return userId from localStorage
    const user_id = localStorage.getItem('user');
    const [visitCards, setVisitCards] = useState([]);
    
    const customCards = [{
        storeName: "Sick Store",
        date: "12/05/2015",
        time: "10:30 AM"
    }]
    
    useEffect(() => {
        (async () => {
            const result = await getVisits();
            setVisitCards(result);
        })();
    }, []);

    console.log("visitCards:", visitCards)


    // Function to return all visits tied to user
    const getVisits = async () => {
        const response = await api.get(`/myvisits/${user_id}`);
        const userVisits = response.data;
        const getCards = await Promise.all( userVisits.map(async function (visit) {
            const newDate = new Date(visit.date);
            const date = newDate.toDateString();
            const hour = newDate.getHours();
            let minutes = newDate.getMinutes();
            // Add a 0 to minutes to make it ==> :00 instead of :0
            if (minutes === 0) {
                minutes += "0";
            }

            const time = hour + ":" + minutes;
            // Get store name
            const response = await api.get(`/store/${visit.store}`);
            const sName = response.data.storeName;

            return {
                storeName: sName,
                date: date,
                time: time,
                partyAmount: visit.partyAmount
            }
        }))
        return getCards;
    };


    // everything inside the return is JSX (like HTML) and is what gets rendered to screen
    return (
        <Container>
            <div className="content">
            <h3>Your Visits</h3>
            {visitCards &&
                visitCards.map((i) => {
                    return <MyCard storeName={i.storeName} date={i.date} time={i.time} /> 
            })}
            {!visitCards.length &&
                <h5 className="noVisits">Go to "Schedule a visit" in the navigation menu to schedule a visit.</h5>
            }
            </div>
        </Container>
    );
}

const MyCard = ({ storeName, date, time }) => {
    // Here i can define any state variables i need that only this component will use
    return (
        <Card>
            <Card.Body>
                <Card.Title>{storeName}</Card.Title>
                <Card.Title>{date}</Card.Title>
                <Card.Text>{time}</Card.Text>
            </Card.Body>
            <Card.Footer>
                <small className="text-muted">
                    <Button className="submit-btn">Delete</Button>
                    Cancel this visit?
                </small>
            </Card.Footer>
        </Card>
    )
}
