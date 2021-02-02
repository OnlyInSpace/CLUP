import React from 'react';
import Dashboard from './pages/Dashboard/';
import Register from './pages/Register';
import CreateCompany from './pages/CreateCompany';
import CreateStore from './pages/CreateStore';
import ScheduleVisit from './pages/ScheduleVisit';
import FindStore from './pages/FindStore';
import MyVisits from './pages/MyVisits';
import Navbar from './pages/Navbar/navbar';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from './pages/Login/';
import LandingPage from './pages/LandingPage';

function Routes() {
  return(
    <BrowserRouter>
      <Navbar />
      <Switch>
        <Route exact path='/' component={LandingPage} />
        <Route exact path='/user/register' component={Register} />
        <Route exact path='/login' component={Login} />
        <ProtectedRoute exact path='/dashboard' component={Dashboard} />
        <ProtectedRoute exact path='/company/create' component={CreateCompany} />
        <ProtectedRoute exact path='/store/create' component={CreateStore} />
        <ProtectedRoute exact path='/visit/schedule' component={ScheduleVisit} />
        <ProtectedRoute exact path='/myvisits' component={MyVisits} />
        <ProtectedRoute exact path='/findstore' component={FindStore} />
      </Switch>
    </BrowserRouter>
  );
}

export default Routes;