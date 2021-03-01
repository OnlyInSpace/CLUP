import React from 'react';
// import {Container, Button, Form} from 'react-bootstrap';
// import './landing.css';
// import { useHistory } from 'react-router-dom';

import './css/style.css';
import './css/simple-lightbox.min.css';
import SimpleReactLightbox from 'simple-react-lightbox';
import { SRLWrapper } from 'simple-react-lightbox';
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
    <SimpleReactLightbox>
      <SRLWrapper>
        <div className="landingPage">
          <meta charSet="UTF-8" />
          {/* <meta name="viewport" content="width=device-width, initial-sclae=1.0" /> */}
          <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
          <link href="https://fonts.googleapis.com/css2?family=Catamaran&display=swap" rel="stylesheet" />
          <title>CLup</title>
          <nav className="navbar">
            <div className="container">
              <h1 className="logo">CLup</h1>
              <ul className="nav">
                <li><a href="http://localhost:3000/user/register">Register</a></li>
                <li><a href="http://localhost:3000/login">Login</a></li>
              </ul>
            </div>
          </nav>
          {/* Showcase */}
          <section className="section-a">
            <div className="container">
              <div>
                <h1>The Customer Line Up</h1>
                <p>Reducing risk and maintaining a safe environment for customers is our top priority</p>
                <a href="http://localhost:3000/login" className="btn">Schedule</a>
              </div>
              <img src={logo} alt="Logo" /> 
            </div>
          </section>
          {/* Overlay Text*/}
          <section className="section-b">
            <div className="overlay">
              <div className="section-b-inner">
                <h3>Shop Safe</h3>
                <h2>A Virtual Queue Manager</h2>
                <p>
                To offer an easy to use virtual queue manager
                for any retail or resturaunts  such as that people
                can safely  enter the specified building while 
                practicing social distancing</p>
              </div>
            </div>
          </section>
          {/* Footer */}
          <footer className="section-footer">
            <p>Copyright © 2021 Customer Line Up</p>
          </footer>
        </div>
      </SRLWrapper>
    </SimpleReactLightbox>
    
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