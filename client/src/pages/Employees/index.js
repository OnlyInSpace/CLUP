import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {Container, Button, Alert, Table, Modal, Form, FormControl, Row, Col, InputGroup} from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import Select from 'react-select';
import {
  protectPage
} from '../verifyTokens/tokenFunctions';

import './employees.css';

function Employees() {
  let history = useHistory();
  // Add employee information
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [changeRole, setChangeRole] = useState('');
  const [employeeFirstname, setEmployeeFirstname] = useState('');
  const [employeeLastname, setEmployeeLastname] = useState('');
  const [tableData, setTableData] = useState([]);
  const [removeAlert, setRemoveAlert] = useState('');
  const [infoAlert, setInfoAlert] = useState('');
  const [addInfoAlert, setAddInfoAlert] = useState('');
  const [addAlert, setAddAlert] = useState('');
  const [company_id, setCompany_id] = useState('');

  // For showing dialogue box
  const [show, setShow] = useState(false);
  // determining which function to run if user clicks yes in modal
  const [runFunc, setRunFunc] = useState(''); 
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [selectedStore_id, setSelectedStore_id] = useState('');

  // Store select
  const [selectedStore, setSelectedStore] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchData, setSearchData] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState('');


  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Hard-coded table for testing
  // const tableData = [
  //   { id: 1, firstName: 'Martha', lastName: 'Henry', email: 'martha@test.com', role: 'manager' },
  //   { id: 2, firstName: 'Larry', lastName: 'Lenford', email: 'larry@test.com', role: 'employee' },
  //   { id: 3, firstName: 'Luis', lastName: 'Flounder', email: 'luis@test.com', role: 'owner' }];
  
  const refreshToken = localStorage.getItem('refreshToken');
  let accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    (async () => {
      try {
        const user = await protectPage(accessToken, refreshToken);
        if (user.role !== 'manager' && user.role !== 'owner') {
          history.push('/dashboard');
        }
        
        const company_id = user.business_id;
        let routeName = `/stores/${company_id}`;
        if (user.role === 'manager') {
          routeName = `/store/${company_id}`;
        }
        
        accessToken = localStorage.getItem('accessToken');
        let headers = {
          authorization: `Bearer ${accessToken}`
        };
        let storeList = await axios.get(routeName, { headers });
        // format search data
        let formattedData;
        if (user.role === 'manager') {
          const storeName = storeList.data.storeName;
          const storeCity = storeList.data.location.city;
          const storeState = storeList.data.location.state;
          const storeAddress1 = storeList.data.location.address1;
          const storeAddress2 = storeList.data.location.address2;
          const storeId = storeList.data._id;
          const label = storeName + ' - ' + storeCity + ', ' + storeState + ' ' + storeAddress1 + ' ' + storeAddress2;
          formattedData = [{label, value: storeId}];
        } else {
        // populate our search list
          formattedData = storeList.data.map(store => {
            const storeName = store.storeName;
            const storeCity = store.location.city;
            const storeState = store.location.state;
            const storeAddress1 = store.location.address1;
            const storeAddress2 = store.location.address2;
            const storeId = store._id;
            const label = storeName + ' - ' + storeCity + ', ' + storeState + ' ' + storeAddress1 + ' ' + storeAddress2;
            return {label, value: storeId};
          });
        }

        setSearchData(formattedData);

      } catch (error) {
        console.log(error);
      }
    })();
  }, []);


  function goToDashboard() {
    history.push('/dashboard');
  }


  async function removeEmployeeHandler(email) {
    try {
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');    
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      await axios.post('/removeEmployee', { email }, { headers });
      handleClose();
      
      setRemoveAlert('Employee successfully added to table below.');
      await delay(4000);
      setRemoveAlert('');
        
      await populateTable();

    } catch (error) {
      console.log('Error in removeEmployeeHandler');
    }
  }

  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));

  async function addEmployeeHandler() {
    try {   
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let addEmployee = await axios.post('/addEmployee', { 'email': employeeEmail, 'role': employeeRole, 'firstName': employeeFirstname, 'lastName': employeeLastname, 'store_id': selectedStore_id, company_id }, { headers });

      if (addEmployee.data.message) {
        setAddInfoAlert(addEmployee.data.message);
        await delay(14000);
        setAddInfoAlert('');
        return;
      } 

      setAddAlert('Employee successfully added to table below.');
      await delay(4000);
      setAddAlert('');
      await populateTable();
      
    } catch (error) {
      console.log('error in addEmployeeHandler');
    }

  }

  async function changeRoleHandler(email, role) {
    try {
      await protectPage(accessToken, refreshToken);
      accessToken = localStorage.getItem('accessToken');
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let changeRole = await axios.post('/changeRole', { email, role }, { headers });
      handleClose();
 
      // handle warning
      if (changeRole.data.message) {
        setInfoAlert(changeRole.data.message);
        await delay(14000);
        setInfoAlert('');
        return;
      }

      setRemoveAlert('Employee\'s role successfully changed. Refreshing table');
      await delay(5000);
      setRemoveAlert('');
      await populateTable();
    } catch (error) {
      console.log('Error in changeRoleHandler');
    }
  }

  async function handleModal() {
    if (runFunc === 'changeRoleHandler') {
      console.log('running changeRole');
      await changeRoleHandler(employeeEmail, changeRole);
    } else if (runFunc === 'removeEmployeeHandler') {
      console.log('running removeEmployee');
      await removeEmployeeHandler(employeeEmail);
    }
  }

  // Render card component
  const renderTableRows = (employee, index) => {
    let className;
    if (employee.role === 'manager') {
      className = 'managerCol';
    } else if (employee.role === 'owner') {
      className = 'ownerCol';
    } else if (employee.role === 'employee') {
      className = 'employeeCol';
    }

    return (
      <tr key={index}>
        <td>{employee.id}</td>
        <td>{employee.lastName}, <br/>
          {employee.firstName}
        </td>
        <td>{employee.email}</td>
        <td className={className}>
          <InputGroup className="mb-3">
            <FormControl onChange={evt => setChangeRole(evt.target.value)} placeholder={employee.role} placearia-describedby="basic-addon1" />
            <InputGroup.Append>
              <Button onClick={() => { setEmployeeEmail(employee.email); setRunFunc('changeRoleHandler'); setModalTitle('Change role to ' + changeRole + '?'); setModalMessage('Are you sure you want to change their role?'); handleShow(); }} variant="outline-secondary" className='changeRole-btn'>
                Change
              </Button>
            </InputGroup.Append>
          </InputGroup>       
        </td>
        <td> 
          <Button onClick={() => { setEmployeeEmail(employee.email); setRunFunc('removeEmployeeHandler'); setModalTitle('Remove Employee?'); setModalMessage('Are you sure you want to remove this employee?'); handleShow(); }} className="btn-action removeEmployee" >
            <span>Remove?</span>
          </Button>       
        </td>
      </tr>
    );
  }; 


  async function selectStore() {
  
    // Get the store's id from our generated search list 
    const getStoreId = searchData.find( ({label}) => label === selectedStore);
    let store_id = getStoreId.value;
    setSelectedStore_id(store_id);
    await protectPage(accessToken, refreshToken);
    accessToken = localStorage.getItem('accessToken');
    let headers = {
      authorization: `Bearer ${accessToken}`
    };
    let storeData = await axios.get(`/store/${store_id}`, { headers });

    // Handle warning
    if (storeData.data.message) {
      setErrorMessage('Please select a store.');
      await delay(3000);
      setErrorMessage('');
    }
  
    setCompany_id(storeData.data.company_id);
    setSelectedAlert(storeData.data.storeName);
    await populateTable();
  }


  // populate table
  async function populateTable() {
    // Get the store's id from our generated search list 
    const getStoreId = searchData.find( ({label}) => label === selectedStore);
    let store_id = getStoreId.value;
    await protectPage(accessToken, refreshToken);
    accessToken = localStorage.getItem('accessToken');
    let headers = {
      authorization: `Bearer ${accessToken}`
    };
    let getEmployees = await axios.get(`/getEmployees/${store_id}`, { headers }); 
    let employeesList = getEmployees.data;

    let id = 0;
    const employeeTable = employeesList.map(employee => {
      const firstName = employee.firstName;
      const lastName = employee.lastName;
      const email = employee.email;
      const role = employee.role;
      id += 1;
      return ({id, firstName, lastName, email, role});
    });

    setTableData(employeeTable);

    // hard coded table
    // const employeeTable = [
    //   { id: 1, firstName: 'Martha', lastName: 'Henry', email: 'martha@test.com', role: 'manager' },
    //   { id: 2, firstName: 'Larry', lastName: 'Lenford', email: 'larry@test.com', role: 'employee' },
    //   { id: 3, firstName: 'Luis', lastName: 'Flounder', email: 'luis@test.com', role: 'owner' }];
  }

  // Custom stylin for our searchbar
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.isFocused ? 'white' : 'black',
      background: state.isFocused ? '#0875bb' : 'white',
      transition: '100ms',
    }),
  
    singleValue: (provided) => {
      return { ...provided };
    },
  
    control: base => ({
      ...base,
      '&:hover': { border: '1px solid #445469', boxShadow: '0px 0px 1px #445469' }, // border style on hover
      border: '1px solid #445469',
      // This line disable the blue border
      boxShadow: 'none',
    })
  };

    
  // everything inside the return is JSX (like HTML) and is what gets rendered to screen
  return (
    <Container>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => handleModal()}>
            Yes
          </Button>
          <Button variant="secondary" onClick={handleClose}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
      
      <div className="employeesContent">
        <h4>Employees</h4>
        <p>Please select a store to view its employees</p>
        <p>Store: <br/> <strong>{selectedStore}</strong></p>
        <Select
          classname="searchBar employee-plz"
          styles={customStyles}
          options={searchData}
          onChange = {evt => setSelectedStore(evt.label)}
        />
        

        { selectedAlert &&
        /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
            <Alert className="alertBox" variant='success'>
              Currently selected store: <strong>{selectedAlert}</strong>
            </Alert>
        }

        <Button className="secondary-btn" onClick={() => selectStore()}>
          Select Store
        </Button>
        <br/>
        <button className="submit-btn dashboard" onClick={goToDashboard}>
          ← Dashboard
        </button>


        {errorMessage ?
        /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox" variant='warning'>
            {errorMessage}
          </Alert>
          : ''}
      </div>

      {/* Employee content */}
      { selectedStore_id && 
        <React.Fragment>
          <div className="employeesContent">
            <h4>Add an Employee Below</h4>
            <Row>
              <ul className='addEmployee-ul'>
                <li>Before you can add an employee, make sure they register an account <a href='/user/register'> here </a>first.</li>
                <li>After adding an employee, have that employee go to the dashboard and refresh the page to see their changes.</li>          
              </ul>
              <Col>
                <Form.Label>Employee&apos;s Email</Form.Label>
                <Form.Control className='addEmployeeEmail' type="email" placeholder="Email" onChange={evt => setEmployeeEmail(evt.target.value)} />
              </Col>
              <Col>
                <Form.Label>Employee&apos;s Role</Form.Label>
                <Form.Control className='select-dropdown employeeRole' as="select" onChange={evt => setEmployeeRole(evt.target.value)}>
                  <option value="">Role</option>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </Form.Control>
              </Col>
            </Row>
            <h5>Employee&apos;s first and last name</h5>
            <Row>
              <Col>
                <Form.Label>Firstname</Form.Label>
                <Form.Control placeholder="Firstname" onChange = {evt => setEmployeeFirstname(evt.target.value)} />
              </Col>
              <Col>
                <Form.Label>Lastname</Form.Label>
                <Form.Control placeholder="Lastname" onChange = {evt => setEmployeeLastname(evt.target.value)} />
              </Col>
            </Row>

            {addInfoAlert ? (
            /* ^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
              <Alert className="loginAlertBox" variant='warning'>
                {addInfoAlert}
              </Alert>
            ): ''}

            {addAlert ? (
            /* ^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
              <Alert className="loginAlertBox" variant='success'>
                {addAlert} 
              </Alert>
            ): ''}

            <Button onClick={addEmployeeHandler} className="btn-action addEmployee">
              <span>Add Employee?</span>
            </Button>
          
            <h5 className='employees-h5'>Changing an employee&apos;s role:</h5>

            <ol className='employees-ul'>
              <li>Enter the new role of the employee in the textbox that&apos;s under the <strong>Role</strong> column</li>
              <li>Then hit the <strong>change</strong> button right below the textbox and confirm the change</li>
            </ol>
            <h5>Note:</h5>
            <ul className='employees-ul'>
              <li>You can only change 1 employee&apos;s role at a time</li>
              <li>There are 2 Roles: 
                <ol className='nestedEmployees-ul'>
                  <li><strong>employee</strong> - able to change store occupancy and confirm customer visits. They cannot access this page.</li>
                  <li><strong>manager</strong> - able to do the same as an employee but can view this page to add employees, change employee roles, or remove them from the store</li>
                </ol>
              </li>
              <li>Removing an employee revokes all of their powers and removes any link between the employee and store</li>
              <li>If an employee transfers to another store, make sure to re-add them to that new store and they will automatically be removed from the old store and transferred to the new one.</li>
            </ul>

            {removeAlert ? (
            /* ^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
              <Alert className="loginAlertBox" variant='success'>
                {removeAlert}
              </Alert>
            ): ''}

            {infoAlert ? (
            /* ^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
              <Alert className="loginAlertBox" variant='warning'>
                {infoAlert} 
              </Alert>
            ): ''}

            <h4>Employees</h4>
            <Table className='employeeTable' hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th className='col-role'>Role</th>
                </tr>
              </thead>
              <tbody>
                {tableData ? tableData.map(renderTableRows) 
                  :
                  ''}
              </tbody>
            </Table>
          
            <button className="submit-btn dashboard" onClick={goToDashboard}>
              ← Dashboard
            </button>
          </div>
        </React.Fragment>
      }

    </Container>
  );
}
export default Employees; 