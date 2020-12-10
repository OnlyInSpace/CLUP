import React, {useEffect, useState} from 'react';
import api from '../../services/api';
import {Container, Card, Button, Modal, Alert} from 'react-bootstrap';
import './myvisits.css';

// Dashboard will show a store's current stats
export default function MyVisits() {
    // Return userId from localStorage
    const user_id = localStorage.getItem('user');
    // For showing dialogue box
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // For deleting a visit
    const [visit_id, setVisit_id] = useState("");
    // Set our visit cards to an empty array state variable
    const [visitCards, setVisitCards] = useState([]);
    const [deleteAlert, setDeleteAlert] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    
    // Below can be used for error checking.
    // const customCards = [{
    //     storeName: "Sick Store",
    //     date: "12/05/2015",
    //     time: "10:30 AM"
    // }]
    

    useEffect(() => {
        (async () => {
            const result = await getVisits();
            setVisitCards(result);
        })();
    }, []);

    console.log("visitCards:", visitCards);
    console.log("user:", user_id);




    // Function to return all visits tied to user
    const getVisits = async () => {
        const response = await api.get(`/myvisits/${user_id}`);
        // Create a userVisits array of objects
        // Here .map means for every object in userVisits
        const userVisits = response.data;
        const getCards = await Promise.all( userVisits.map(async function (visit) {

            // Get the visit's id
            const visit_id = visit._id;

            // Parse our date 
            const newDate = new Date(visit.date);
            const date = newDate.toDateString();
            const hour = newDate.getHours();
            let minutes = newDate.getMinutes();

            // Add a 0 to minutes to make it ==> :00 instead of :0
            if (minutes === 0) {
                minutes += "0";
            }

            // Format the date now
            const time = hour + ":" + minutes;

            // Get store name
            const response = await api.get(`/store/${visit.store}`);
            const sName = response.data.storeName;

            // return first object in the array
            return {
                visit_id: visit_id,
                storeName: sName,
                date: date,
                time: time,
                partyAmount: visit.partyAmount
            }
        }))
        return getCards;
    };

    const deleteVisitHandler = async (visit_id) => {
        try {
            // delete the visit
            // if an error occurs, then catch block will be triggered
            await api.delete(`/myvisits/${visit_id}`);
            setDeleteAlert("Visit canceled.");
            setTimeout(() => {
                setDeleteAlert("");
            }, 5000)
            setShow(false);
            const response = await getVisits();
            setVisitCards(response);
        } catch (error) {
            setErrorMessage("Error: Visit was not deleted.");
            setTimeout(() => {
                setErrorMessage("");
            }, 4000)
        }
    }

    const renderCards = (card, index) => {
        return (
          <Card key={index}>
            <Card.Body>
                <Card.Title>{card.storeName}</Card.Title>
                <Card.Title>{card.date}</Card.Title>
                <Card.Text>{card.time}</Card.Text>
            </Card.Body>
            <Card.Footer>
                {/* passing arguments format: () */}
                <small className="text-muted">
                    <Button onClick={() => {
                        setVisit_id(card.visit_id); 
                        handleShow();
                    }}
                    className="delete-btn" >
                        Cancel
                    </Button>
                    Cancel this visit?
                </small>
            </Card.Footer>
          </Card>
        );
    }

    // everything inside the return is JSX (like HTML) and is what gets rendered to screen
    return (
        <Container>
            {/*  */}
            <Modal show={show} onHide={() => handleClose()} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Cancel visit?</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to cancel this visit?</Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => deleteVisitHandler(visit_id)}>
                        Yes
                    </Button>
                    <Button variant="secondary" onClick={() => handleClose()}>
                        No
                    </Button>
                </Modal.Footer>
            </Modal>
            <div className="content">
            <h3>Your Visits</h3>
            { deleteAlert &&
                <Alert variant="success">
                    Visit successfully canceled!
                </Alert>
            }
            { errorMessage &&
                <Alert variant="danger">
                    Error: Visit not canceled
                </Alert>
            }
            {/* {visitCards &&
                visitCards.map((i) => {
                    return <MyCard storeName={i.storeName} date={i.date} time={i.time} store_id={i.store_id} /> 
            })} */}
            { visitCards && visitCards.map(renderCards) }
            {!visitCards.length &&
                <h5 className="noVisits">Go to "Schedule a visit" in the navigation menu to schedule a visit.</h5>
            }
            </div>
        </Container>
    );
}

// Old way of doing cards globally

// const MyCard = ({ storeName, date, time, visit_id }) => {
//     // Here i can define any state variables i need that only this component will use
//     return (
//         <Card>
//             <Card.Body>
//                 <Card.Title>{storeName}</Card.Title>
//                 <Card.Title>{date}</Card.Title>
//                 <Card.Text>{time}</Card.Text>
//             </Card.Body>
//             <Card.Footer>
//                 {/* passing arguments format: () */}
//                 <small className="text-muted">
//                     <Button onClick={() => deleteVisitHandler(visit_id)}
//                     className="submit-btn" >
//                         Delete
//                     </Button>
//                     Cancel this visit?
//                 </small>
//             </Card.Footer>
//         </Card>
//     )
// }


// const deleteVisitHandler = async (visit_id) => {
//     try {
//         // delete the visit
//         // if an error occurs, then catch block will be triggered
//         await api.delete(`/visit/${visit_id}`);
//         deleteAlert = "Visit canceled";
//         setTimeout(() => {
//             setdeleteAlert("");
//         }, 3000)
//     } catch (error) {
//         setErrorMessage("Error: Visit was not deleted.");
//     }
// }