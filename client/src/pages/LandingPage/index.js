import React from 'react';
// import {Container, Button, Form} from 'react-bootstrap';
// import './landing.css';
// import { useHistory } from 'react-router-dom';

import './css/style.css';
import './css/simple-lightbox.min.css';
import logo from './img/logo.png';


function Landingpage() {
  //***************************************** */
  // let history = useHistory();


  // Function that will talk to server api
  // const handleSubmit = async evt => {
  //   // Prevent default event when button is clicked
  //   evt.preventDefault();
  //   history.push('/login');
  // };
  //***************************************** */

  return (
    <div className="landingPage">
      <meta charSet="UTF-8" />
      {/* <meta name="viewport" content="width=device-width, initial-sclae=1.0" /> */}
      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <link href="https://fonts.googleapis.com/css2?family=Catamaran&display=swap" rel="stylesheet" />
      <title>CLUP</title>
      <nav className="navbar">
        <div className="container">
          <h1 className="logo">CLUP</h1>
          <ul className="nav">
            <li><a href="/user/register">Register</a></li>
            <li><a href="/login">Login</a></li>
          </ul>
        </div>
      </nav>
      {/* Showcase */}
      <section className="section-a">
        <div className="container">
          <div>
            <h1>Customer Lineup</h1>
            <p><strong>This is a student project and should not be used for an actual business.</strong></p>
            <p>
              Customer Lineup is a web application built with
              the MERN stack and its purpose is to serve as a virtual queue
              manager for retail stores. The inspiration for this project was
              to solve long customer lines due to
              limited customer occupancy within businesses
              during the COVID-19 pandemic.
            </p>
            <a href="/login" className="btn">Schedule</a>
          </div>
          <img src={logo} alt="Company logo" /> 
        </div>
      </section>
      {/* Overlay Text*/}
      <section className="section-b">
        <div className="overlay">
          <div className="section-b-inner">
            <h2>Shopping Safely</h2>
            {/* <h2>A Virtual Queue Manager</h2> */}

            <p>Project Features</p>
            <ul>
              <li>Email verification and queue alerts using Nodemailer</li>
              <li>Custom visit schedule handling with Javascript Dates</li>
              <li>Enhanced security and authentication with JSON Web Tokens</li>
              <li>Data cleanup scheduling and date tracking with node-cron</li>
              <li>Control store occupancy and customer queues</li>
              <li>Schedule and confirm visits</li>
              <li>Remote check-ins via email</li>
              <li>Manage employees for multiple stores</li>
            </ul>
            {/* <p>Reducing risk and maintaining a safe environment for customers is a top priority.</p> */}

            {/* <p> Offering an easy-to-use virtual queue manager
                    for ensuring social distancing at retail businesses </p> */}
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="section-footer">
        <p>A student project by <a href='https://www.stevensalomon.dev/'>Steven Salomon</a> (2021)</p>
      </footer>
    </div>
    
  );

  //******************************************/
  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  // return (
  //   <Container>
  //     <div className="content">
  //       <h3>Landing Page</h3>
  //       <p>Login to your <strong>account</strong> below</p>
  //       <Form onSubmit = {handleSubmit}>
  //         <Form.Group>
  //           <Button className="submit-btn" variant="secondary" type="submit">Login</Button>
  //         </Form.Group>
  //         <Form.Group>
  //           <p className="register-p">Need an account?</p>
  //           <Button className="secondary-btn" onClick={() => history.push('/user/register')} variant="secondary" type="button">
  //             New Account
  //           </Button>
  //         </Form.Group>
  //       </Form>
  //     </div>
  //   </Container>
  // );



  
}

// {/* <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
//     <script src="js/simple-lightbox.min.js"></script>
//     <script>
//         $(function () {
//             const $gallery = $('.gallery a').simpleLightbox();
//         })
//     </script> */}

export default Landingpage;