const express = require('express')
// Controllers
const UserController = require('./controllers/UserController');
const VisitController = require('./controllers/VisitController');
const StoreController = require('./controllers/StoreController');
const CompanyController = require('./controllers/CompanyController');
const DashboardController = require('./controllers/DashboardController');
const LoginController = require('./controllers/LoginController');
const IncreaseCountController = require('./controllers/IncreaseCountController');
const DecreaseCountController = require('./controllers/DecreaseCountController');

// Assign router
const routes = express.Router();

// Create a verification endpoint
routes.get('/status', (req, res)=> {
    res.send({ status: 200})
});


// TODO: get scheduled visit by ID
// TODO: ApproveVisitController
// TODO: RejectVisitController



// Schedule Visit
// Create a visit
//routes.post('/schedulevisit/:visitId', ScheduledVisitController.create);

// Login
routes.post('/login', LoginController.store);

// CustomerCount
// Increase Count
routes.post('/increasecount/:storeId', IncreaseCountController.increaseCount);
// Decrease Count
routes.post('/decreasecount/:storeId', DecreaseCountController.decreaseCount);


// Company
// Return all companies
routes.get('/company', CompanyController.getAllCompanies);
// Create a company
routes.post('/company', CompanyController.createCompany);
// Get company by id
routes.get('/company/:companyId', CompanyController.getCompanyById);


// Store
// Return all stores
routes.get('/store', StoreController.getAllStores);
// Create a store
routes.post('/store', StoreController.createStore);
// Get store by id
routes.get('/store/:storeId', StoreController.getStoreById);


// Dashboard
// Return all visits
routes.get('/dashboard', DashboardController.getAllVisits);
// Get visit by id
routes.get('/dashboard/:visitId', DashboardController.getVisitById);


// Visits
// Create a visit
routes.post('/visit/:storeId', VisitController.createVisit);
// Delete visit
routes.delete('/visit/:visitId', VisitController.delete);


// User
// Create user
routes.post('/user/register', UserController.createUser);
// Get user by id
routes.get('/user/:userId', UserController.getUserById);
// Get all users
routes.get('/user', UserController.getAllUsers);



module.exports = routes;