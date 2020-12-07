import React, { useState } from 'react';
import { useLocation } from 'react-router';
import api from '../../services/api';
import { Navbar, NavDropdown, Nav, InputGroup, Form, Button, FormControl } from 'react-bootstrap';
import './navbar.css';
import logo from '../../pages/Login/logo.png';

export default function NavigationBar() {
    const pathname = useLocation().pathname;   //returns the current url minus the domain name

    if (pathname === '/login' || pathname === '/user/register') {
        return false;
    } else {
        return (
            <Navbar collapseOnSelect expand="lg" bg="dark" variant="dark">
            <Navbar.Brand href="/">
                CLUP
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="mr-auto">
                <Nav.Link href="/myvisits">My visits</Nav.Link>
                <Nav.Link href="/visit/schedule">Schedule a visit</Nav.Link>
                <Nav.Link href="/findstore">Select a store</Nav.Link>
                <NavDropdown title="Account" id="collasible-nav-dropdown">
                    <NavDropdown.Item href="/store/create">Create a new store</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.2">Manage stores</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">Company</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#action/3.4">Settings</NavDropdown.Item>
                </NavDropdown>
                </Nav>
                {/* <Nav>
                <Nav.Link href="#deets">More deets</Nav.Link>
                <Nav.Link eventKey={2} href="#memes">
                    Dank memes
                </Nav.Link>
                </Nav> */}
            </Navbar.Collapse>
            </Navbar>
        );
    }
}