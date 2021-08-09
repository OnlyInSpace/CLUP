// import express
const express = require('express');
// import controllers
const UserController = require('./controllers/UserController');
const VisitController = require('./controllers/VisitController');
const StoreController = require('./controllers/StoreController');
const CompanyController = require('./controllers/CompanyController');
const SetRoleController = require('./controllers/SetRoleController');
const QueueController = require('./controllers/QueueController');
const VerificationController = require('./controllers/VerificationController');

// import jwt
const jwt = require('jsonwebtoken');
// import access token secret, refresh token secret, mongoDB ssl  
require('dotenv').config();
// Assign the router
const routes = express.Router();


// This is a middleware function which verifies every API query made
function verifyToken(req, res, next) {
  if (req.headers.authorization) {
    // Get token from headers.authorization
    const token = req.headers.authorization.split(' ')[1];
    // Verify the token is legit! and if so, set req.user to user and call next()
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (user) {
        // If token is legit, set req.accessToken = user, so now we can call req.accessToken if we wanted to
        // req.accessToken = user;
        // next() is required so the program can continue and now run the controller's api call
        next();  
      } else if (err.message === 'jwt expired') { // else if jwt is expired, notify our frontend so we can refresh it
        return res.json({
          success: false,
          message: 'Access token expired'
        });
      } else { // else token doesnt exist or could be unlegit, return 403 forbidden status back to frontend and have user login again
        console.log('\nverify failed in routes\n');
        return res.status(403).json({ err, message: 'User not authenticated' });
      }
    }); 
  } else {
    console.log('Routes: no req.headers.authorization in verifyToken');
    return res.sendStatus(401);
  }
}

// Token verification and login/logout authentication
routes.post('/user/register', VerificationController.registerUser);
routes.post('/user/login', VerificationController.userLogin);
routes.post('/user/logout', VerificationController.userLogout);
routes.get('/user/verifyToken', VerificationController.verifyAccessToken);
routes.get('/user/refreshToken', VerificationController.refreshAccessToken);
// Get user by id
routes.get('/user/:user_id', verifyToken, UserController.getUserById);
// Confirm user email
routes.put('/user/confirmEmail/:user_id', verifyToken, UserController.confirmUser);
/* Setting clock in and out */
// Clock user IN
routes.post('/user/clockIn', verifyToken, UserController.setClockIn);
// Clock user OUT
routes.post('/user/clockOut', verifyToken, UserController.setClockOut);


/* Setting roles and business id */
// Add employee
routes.post('/role/addEmployee', verifyToken, SetRoleController.addEmployee);
// Change employee's role
routes.post('/role/changeRole', verifyToken, SetRoleController.changeRole);
// Set owner role
routes.post('/role/owner', verifyToken, SetRoleController.setOwnerRole);
// Remove employee
routes.post('/role/removeEmployee', verifyToken, SetRoleController.removeEmployee);
// Set business_id
routes.post('/role/business_id', verifyToken, SetRoleController.setBusiness_id);


/* Getting employees */
routes.get('/store/getEmployees/:store_id', verifyToken, StoreController.getAllEmployees);
// Create a company
// Notice how verifyToken is placed before the api call, which means it will run before the api call.
routes.post('/store/createCompany', verifyToken, CompanyController.createCompany);
// Create a store
routes.post('/store/create', verifyToken, StoreController.createStore);
/* Customer count functions */
// Increase Customer Count
routes.put('/store/changeCount', verifyToken, StoreController.changeCount);
// Get company by user id
routes.get('/store/company/:user_id', verifyToken, CompanyController.getCompanyByUserId);
// Return all stores
routes.get('/store/getall', verifyToken, StoreController.getAllStores);
// Return all user owned stores
routes.get('/store/owned/:company_id', verifyToken, StoreController.getOwnedStores);
// Get store by id
routes.get('/store/get/:store_id', verifyToken, StoreController.getStoreById);



/* Visits */
// Return all visits specific to currently logged in user
routes.get('/visits/myvisits/:user_id', verifyToken, VisitController.getUserVisits);
// Get all visits tied to specific store
routes.get('/visits/store/:store_id', verifyToken, VisitController.getStoreVisits);
// Get all visits tied to user and specific store
routes.get('/visits/myvisits/:store_id/:user_id', verifyToken, VisitController.getUserStoreVisits);
// Create a visit
routes.post('/visits/create', verifyToken, VisitController.createVisit);
// Delete visit
routes.delete('/visits/myvisits/:visitId', verifyToken, VisitController.delete);
// Confirm a visit
routes.delete('/visits/confirm/:visit_id', verifyToken, VisitController.confirmVisit);
// Get visit by id
routes.get('/visits/:visitId', verifyToken, VisitController.getVisitById);


// Customer queue - append, pop, and skip
routes.put('/queue/append', verifyToken, QueueController.appendUser);
routes.post('/queue/pop', verifyToken, QueueController.popUser);
routes.put('/queue/skip', verifyToken, QueueController.skipUser);

module.exports = routes;