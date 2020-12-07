import React from 'reactstrap';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import Login from './pages/Login/';
import Dashboard from './pages/Dashboard/';
import Register from './pages/Register';
import CreateCompany from './pages/CreateCompany';
import CreateStore from './pages/CreateStore';
import ScheduleVisit from './pages/ScheduleVisit'
import FindStore from './pages/FindStore';
import MyVisits from './pages/MyVisits';
import Navbar from './pages/Navbar/navbar';
import { Container } from 'react-bootstrap';

export default function Routes() {
    return(
        <BrowserRouter>
            <Navbar />
            <Switch>
                <Route path='/' exact component = {Dashboard} />
                <Route path='/user/register' exact component = {Register} />
                <Route path='/login' exact component = {Login} />
                <Route path='/company/create' exact component = {CreateCompany} />
                <Route path='/store/create' exact component = {CreateStore} />
                <Route path='/visit/schedule' exact component = {ScheduleVisit} />
                <Route path='/myvisits' exact component = {MyVisits} />
                <Route path='/findstore' component = {FindStore} />
            </Switch>
        </BrowserRouter>
    );
}