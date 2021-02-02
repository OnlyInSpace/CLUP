// import express
const express = require('express');
// import controllers
const UserController = require('./controllers/UserController');
const VisitController = require('./controllers/VisitController');
const StoreController = require('./controllers/StoreController');
const CompanyController = require('./controllers/CompanyController');
const ChangeCountController = require('./controllers/ChangeCountController');
// import jwt
const jwt = require('jsonwebtoken');
// import access token secret, refresh token secret, mongoDB ssl  
require('dotenv').config();
// Assign the router
const routes = express.Router();


// This is a middleware function which verifies every API database query made by users
//  - Parameters: 
//  - Return: it returns a req.user back to the frontend which contains  

function verifyToken(req, res, next) {
  // Get token from headers.authorization
  const token = req.header('accessToken');
  if (token) {
    // Verify the token is legit! and if so, set req.user to user and call next()
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (user) {
        // If token is legit, set req.accessToken = user, so now we can call req.accessToken if we wanted to
        req.accessToken = user;
        // next() is required so the program can continue and now run the controller's api call
        next();  
      } else if (err.message === 'jwt expired') { // else if jwt is expired, notify our frontend so we can refresh it
        return res.json({
          success: false,
          message: 'Access token expired'
        });
      } else { // else token doesnt exist or could be unlegit, return 403 forbidden status back to frontend and have user login again
        console.log(err);
        return res.status(403).json({ err, message: 'User not authenticated' });
      }
    }); 
  } else {
    return res.sendStatus(401);
  }
}


// Create a company
// Notice how verifyToken is placed before the api call, which means it will run before the api call.
routes.post('/company/create', verifyToken, CompanyController.createCompany);

// Create a store
routes.post('/store/create', verifyToken, StoreController.createStore);


/* Customer count functions */
// Increase Customer Count
routes.post('/count/increase', verifyToken, ChangeCountController.increaseCount);
// Decrease Customer Count
routes.post('/count/decrease', verifyToken, ChangeCountController.decreaseCount);

/* Visits */
// Return all visits specific to currently logged in user
routes.get('/myvisits/:user_id', verifyToken, VisitController.getUserVisits);
// Create a visit
routes.post('/visit/create', verifyToken, VisitController.createVisit);
// Delete visit
routes.delete('/myvisits/:visitId', verifyToken, VisitController.delete);

// FindStore -  returns all stores 
routes.get('/findstore', verifyToken, StoreController.getAllStores);
//***********QUERIES FOR GETTING DATA****************** */

// Visit
// Get visit by id
routes.get('/visit/:visitId', VisitController.getVisitById);

// Get user by id
routes.get('/user/:userId', UserController.getUserById);
// Get all users
routes.get('/user', UserController.getAllUsers);

// Company
// Return all companies
routes.get('/company', CompanyController.getAllCompanies);
// Get company by id
routes.get('/company/:companyId', CompanyController.getCompanyById);

// Store
// Return all stores
routes.get('/store', verifyToken, StoreController.getAllStores);

// Get store by id
// Used by Dashboard - returns current store occupancy
routes.get('/store/:store_id', verifyToken, StoreController.getStoreById);



module.exports = routes;