import React, { } from 'react';
import Dashboard from './pages/Dashboard/';
import Register from './pages/Register';
import CreateCompany from './pages/CreateCompany';
import CreateStore from './pages/CreateStore';
import ScheduleVisit from './pages/ScheduleVisit';
import FindStore from './pages/FindStore';
import MyVisits from './pages/MyVisits';
import Navbar from './pages/Navbar/navbar';
import Employees from './pages/Employees';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from './pages/Login/';
import LandingPage from './pages/LandingPage';
// import {
//   protectPage
// } from './pages/verifyTokens/tokenFunctions';


function Routes() {
  // const [isAuth, setIsAuth] = useState(false);

  // Verify user has a refresh token
  // let isAuth = false;
  // const [isAuth, setIsAuth] = useState(false);

  // const accessToken = localStorage.getItem('accessToken');
  // const refreshToken = localStorage.getItem('refreshToken');

  // async function operation() {
  //   return new Promise(function(resolve, reject) {
  //     const user = protectPage(accessToken,refreshToken);
  //     // may be a heavy db call or http request?
  //     resolve(user); // successfully fill promise
  //   });
  // }

  // async function makeCall() {
  //   let user = await operation();
  //   if (user) {
  //     isAuth = true;
  //   }
  // }

  // makeCall();

  // (async () => {
  //   if (accessToken && refreshToken) {
  //     if (await protectPage(accessToken, refreshToken)) {
  //       // isAuth = true;
  //       setIsAuth(true);
  //     }
  //   }
  // })();

  // isAuth = true;

  // console.log(isAuth);

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
        <ProtectedRoute exact path='/employees' component={Employees} />
      </Switch>
    </BrowserRouter>
  );
}

export default Routes;