const express = require('express')
// Controllers
const UserController = require('./controllers/UserController');
const VisitController = require('./controllers/VisitController');
const StoreController = require('./controllers/StoreController');
const CompanyController = require('./controllers/CompanyController');
const LoginController = require('./controllers/LoginController');
const ChangeCountController = require('./controllers/ChangeCountController');

// Assign the router
const routes = express.Router();

// a verification endpoint
routes.get('/status', (req, res)=> {
    res.send({ status: 200})
});


//******PAGE DATA****** */

// Create user
routes.post('/user/register', UserController.createUser);

// Create a company
routes.post('/company/create', CompanyController.createCompany);

// Create a store
routes.post('/store/create', StoreController.createStore);

// User Login
routes.post('/login', LoginController.store);

// Customer Count Page
// Increase Customer Count
routes.post('/count/increase/:storeId', ChangeCountController.increaseCount);
// Decrease Customer Count
routes.post('/count/decrease/:storeId', ChangeCountController.decreaseCount);

// Visits
// Return all visits specific to currently logged in user
routes.get('/myvisits/:user_id', VisitController.getAllVisits);
// Create a visit
routes.post('/visit/create', VisitController.createVisit);
// Delete visit
routes.delete('/myvisits/:visitId', VisitController.delete);
// Send the visit into a chosen Store model
routes.post('/visit/setVisitStore', VisitController.setVisitStore);

// Dashboard
// Return current store statistics
routes.get('/dashboard', StoreController.getStoreById);

// FindStore
// Return all stores 
routes.get('/findstore', StoreController.getAllStores);

// Store a retail store into it's respective company
routes.post('/store/setStoreCompany', StoreController.setStoreCompany);

//***********QUERIES FOR API TESTING****************** */

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
routes.get('/store', StoreController.getAllStores);
// Get store by id
routes.get('/store/:store_id', StoreController.getStoreById);



module.exports = routes;