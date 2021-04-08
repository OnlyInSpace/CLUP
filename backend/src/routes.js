// import express
const express = require('express');
// import controllers
const UserController = require('./controllers/UserController');
const VisitController = require('./controllers/VisitController');
const StoreController = require('./controllers/StoreController');
const CompanyController = require('./controllers/CompanyController');
const ChangeCountController = require('./controllers/ChangeCountController');
const SetRoleController = require('./controllers/SetRoleController');
// import jwt
const jwt = require('jsonwebtoken');
// import access token secret, refresh token secret, mongoDB ssl  
require('dotenv').config();
// Assign the router
const routes = express.Router();


// This is a middleware function which verifies every API database query made by users

// function verifyToken(req, res, next) {
//   // Get token from headers.authorization
//   const token = req.header('accessToken');

//   console.log('\n\n\nToken:', token);

//   if (token) {
//     // Verify the token is legit! and if so, set req.user to user and call next()
//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//       if (user) {
//         // If token is legit, set req.accessToken = user, so now we can call req.accessToken if we wanted to
//         req.accessToken = user;
//         // next() is required so the program can continue and now run the controller's api call
//         next();  
//       } else if (err.message === 'jwt expired') { // else if jwt is expired, notify our frontend so we can refresh it
//         return res.json({
//           success: false,
//           message: 'Access token expired'
//         });
//       } else { // else token doesnt exist or could be unlegit, return 403 forbidden status back to frontend and have user login again
//         console.log(err);
//         return res.status(403).json({ err, message: 'User not authenticated' });
//       }
//     }); 
//   } else {
//     return res.sendStatus(401);
//   }
// }

function verifyToken(req, res, next) {

  if (req.headers.authorization) {
    // Get token from headers.authorization
    const token = req.headers.authorization.split(" ")[1];
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
        console.log('\nverify failed in routes.js\n');
        return res.status(403).json({ err, message: 'User not authenticated' });
      }
    }); 
  } else {
    return res.sendStatus(401);
  }
}

/* Setting roles and business id */
// Add employee
routes.post('/addEmployee', verifyToken, SetRoleController.addEmployee);
// Change employee's role
routes.post('/changeRole', verifyToken, SetRoleController.changeRole);
// Set owner role
routes.post('/role/owner', verifyToken, SetRoleController.setOwnerRole);
// Remove employee
routes.post('/removeEmployee', verifyToken, SetRoleController.removeEmployee);
// Set business_id
routes.post('/business_id', verifyToken, SetRoleController.setBusiness_id);
/* Setting clock in and out */
// Clock user IN
routes.post('/clockIn', verifyToken, UserController.setClockIn);
// Clock user OUT
routes.post('/clockOut', verifyToken, UserController.setClockOut);

/* Getting employees */
routes.get('/getEmployees/:store_id', verifyToken, StoreController.getAllEmployees);

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
// Get all visits tied to specific store
routes.get('/visits/:store_id', verifyToken, VisitController.getStoreVisits);
// Get all visits tied to user and specific store
routes.get('/myvisits/:store_id/:user_id', verifyToken, VisitController.getUserStoreVisits);
// Create a visit
routes.post('/visit/create', verifyToken, VisitController.createVisit);
// Delete visit
routes.delete('/myvisits/:visitId', verifyToken, VisitController.delete);

// FindStore -  returns all stores 
routes.get('/findstore', verifyToken, StoreController.getAllStores);


//***********QUERIES FOR GETTING DATA****************** */

// Visit
// Get visit by id
routes.get('/visit/:visitId', verifyToken, VisitController.getVisitById);

// User
// Get user by id
routes.get('/user/:user_id', verifyToken, UserController.getUserById);

// Company
// Get company by user id
routes.get('/company/:user_id', verifyToken, CompanyController.getCompanyByUserId);

// Store
// Return all stores
routes.get('/store', verifyToken, StoreController.getAllStores);
// Return all owned stores
routes.get('/stores/:company_id', verifyToken, StoreController.getOwnedStores);

// Get store by id
// returns store data
routes.get('/store/:store_id', verifyToken, StoreController.getStoreById);



module.exports = routes;