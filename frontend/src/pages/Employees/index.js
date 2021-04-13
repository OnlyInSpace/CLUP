import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {Container, Button, Alert, Table, Modal, Form, FormControl, Row, Col, InputGroup} from 'react-bootstrap';
import PropTypes from 'prop-types';
import { withRouter, useHistory } from 'react-router-dom';
import Select from 'react-select';
import {
  protectPage
} from '../verifyTokens/tokenFunctions';

import './employees.css';

function Employees() {
  let history = useHistory();

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

  // Store's id
  const [selectedStore, setSelectedStore] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchData, setSearchData] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState('');


  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);



  // const tableData = [
  //   { id: 1, firstName: 'Martha', lastName: 'Henry', email: 'martha@test.com', role: 'manager' },
  //   { id: 2, firstName: 'Larry', lastName: 'Lenford', email: 'larry@test.com', role: 'employee' },
  //   { id: 3, firstName: 'Luis', lastName: 'Flounder', email: 'luis@test.com', role: 'owner' }];
  
  const refreshToken = localStorage.getItem('refreshToken');

  useEffect(async () => {
    try {
      let accessToken = localStorage.getItem('accessToken');

      const user = await protectPage(accessToken, refreshToken);

      if (user.role !== 'manager' && user.role !== 'owner') {
        history.push('/dashboard');
      }
      
      const company_id = user.business_id;

      let routeName = `/stores/${company_id}`;

      if (user.role === 'manager') {
        routeName = `/store/${company_id}`;
      }

      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let storeList = await api.get(routeName, { headers });

      // If token comes back as expired, refresh the token and make api call again
      if (storeList.data.message === 'Access token expired') {
        const user = await protectPage(accessToken, refreshToken);
        // If the access token or refresh token are unlegit, then return.
        if (!user) {
          setErrorMessage('Please log in again.');
          console.log('no user!');
          history.push('/login');
        } else {
          // Return store by company_id
          // overwrite storeList with the new access token.
          let newAccessToken = localStorage.getItem('accessToken');
          headers = {
            authorization: `Bearer ${newAccessToken}`
          };
          storeList = await api.get(routeName, { headers });
        }
      }

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
  }, []);



  function goToDashboard() {
    history.push('/dashboard');
  }


  async function removeEmployeeHandler(email) {
    try {
      let accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let removeEmployee = await api.post('/removeEmployee', { email }, { headers });
  
      // If token comes back as expired, refresh the token and make api call again
      if (removeEmployee.data.message === 'Access token expired') {
        const user = await protectPage(accessToken, refreshToken);
        // If the access token or refresh token are unlegit, then return.
        if (!user) {
          console.log('no user!');
          history.push('/login');
        } else {
          // overwrite removeEmployee with the new access token.
          let newAccessToken = localStorage.getItem('accessToken');
          accessToken = newAccessToken;
          headers = {
            authorization: `Bearer ${newAccessToken}`
          };
          removeEmployee = await api.post('/removeEmployee', { email }, { headers });
        }
      } 
      
      console.log('removed:', removeEmployee.data);

      setShow(false);

      setRemoveAlert('Employee successfully removed. Refreshing page');
      setRemoveAlert('Employee successfully added to table below.');
      setTimeout(() => {
        setRemoveAlert('');
      }, 4000);
        
      await handleSubmit(true);

    } catch (error) {
      console.log('Error in removeEmployeeHandler');
    }
  }

  // Sleep function
  const delay = ms => new Promise(res => setTimeout(res, ms));

  async function addEmployeeHandler() {
    try {

      if (!employeeEmail || !employeeFirstname || !employeeLastname || !employeeRole) {
        setAddInfoAlert('Missing required information.');
        setTimeout(() => {
          setAddInfoAlert('');
        }, 5000);
        return;
      }
        
      let accessToken = localStorage.getItem('accessToken');
      
      let headers = {
        authorization: `Bearer ${accessToken}`
      };
      let addEmployee = await api.post('/addEmployee', { 'email': employeeEmail, 'role': employeeRole, 'firstName': employeeFirstname, 'lastName': employeeLastname, 'store_id': selectedStore_id, company_id }, { headers });
  
      // If token comes back as expired, refresh the token and make api call again
      if (addEmployee.data.message === 'Access token expired') {
        const user = await protectPage(accessToken, refreshToken);
        // If the access token or refresh token are unlegit, then return.
        if (!user) {
          console.log('no user!');
          history.push('/login');
        } else {
          // overwrite addEmployee with the new access token.
          let newAccessToken = localStorage.getItem('accessToken');
          accessToken = newAccessToken;
          headers = {
            authorization: `Bearer ${newAccessToken}`
          };
          addEmployee = await api.post('/addEmployee', { 'email': employeeEmail, 'role': employeeRole, 'firstName': employeeFirstname, 'lastName': employeeLastname, 'store_id': selectedStore_id, company_id }, { headers });
        }
      } 
      
      if (addEmployee.data.message) {
        setAddInfoAlert(addEmployee.data.message);
        setTimeout(() => {
          setAddInfoAlert('');
        }, 14000);
        return;
      } 

      setAddAlert('Employee successfully added to table below.');
      setTimeout(() => {
        setAddAlert('');
      }, 4000);
      
      await handleSubmit(true);
      
    } catch (error) {
      console.log('error in addEmployeeHandler');
    }

  }

  async function changeRoleHandler(email, role) {
    try {
      console.log(role);

      if (!role) {
        setInfoAlert('You didn\'t enter a role.');
        setTimeout(() => {
          setInfoAlert('');
        }, 5000);
        setShow(false);
        return;
      }

      if (role === 'employee' || role === 'manager') {
        let accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        let headers = {
          authorization: `Bearer ${accessToken}`
        };
        let changeRole = await api.post('/changeRole', { email, role }, { headers });
          
        // If token comes back as expired, refresh the token and make api call again
        if (changeRole.data.message === 'Access token expired') {
          const user = await protectPage(accessToken, refreshToken);
          // If the access token or refresh token are unlegit, then return.
          if (!user) {
            console.log('no user!');
            history.push('/login');
          } else {
            // overwrite changeRole with the new access token.
            let newAccessToken = localStorage.getItem('accessToken');
            accessToken = newAccessToken;
            headers = {
              authorization: `Bearer ${newAccessToken}`
            };
            changeRole = await api.post('/changeRole', { email, role }, { headers });
          }
        } 
              
        setShow(false);
        
        console.log(changeRole.data);
        
        if (changeRole.data.user) {
          setRemoveAlert('Employee\'s role successfully changed. Refreshing page');
        } else if (changeRole.data.message) {
          setInfoAlert(changeRole.data.message);
          setTimeout(() => {
            setInfoAlert('');
          }, 5000);
          setShow(false);
          return;
        }

        await delay(2300);

        // refresh page
        window.location.reload(false);

      } else {
        setInfoAlert('Sorry, you need to enter either \'employee\' or \'manager\' in the textbox to change their role.');
        setTimeout(() => {
          setInfoAlert('');
        }, 5000);
        setShow(false);
        return;
      }
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
            <FormControl onClick={() => { setRunFunc('changeRoleHandler'); setModalTitle('Change role?'); setModalMessage('Are you sure you want to change their role?'); }} onChange={evt => setChangeRole(evt.target.value)} placeholder={employee.role} placearia-describedby="basic-addon1" />
            <InputGroup.Append>
              <Button onClick={() => { setEmployeeEmail(employee.email); setRunFunc('changeRoleHandler'); setModalTitle('Change role?'); setModalMessage('Are you sure you want to change their role?'); handleShow(); }} variant="outline-secondary" className='changeRole-btn'>
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


  // Set store
  async function handleSubmit(hide) {
    console.log('handle submit');
    
    if (!hide) {
      setSelectedAlert('Store selected! Scroll down to see the employee page');
      setTimeout(() => {
        setSelectedAlert('');
      }, 4300);
    } 

    let store_id;
    if (!selectedStore) {
      setErrorMessage('Please select a store.');
    } else {
      // Get the store's id from our generated search list 
      const getStoreId = searchData.find( ({label}) => label === selectedStore);
      store_id = getStoreId.value;
      setSelectedStore_id(store_id);
    }

    let accessToken = localStorage.getItem('accessToken');

    let headers = {
      authorization: `Bearer ${accessToken}`
    };
    let storeData = await api.get(`/store/${store_id}`, { headers });

    // If token comes back as expired, refresh the token and make api call again
    if (storeData.data.message === 'Access token expired') {
      const user = await protectPage(accessToken, refreshToken);
      // If the access token or refresh token are unlegit, then return.
      if (!user) {
        console.log('no user!');
        history.push('/login');
      } else {
        // overwrite storeData with the new access token.
        let newAccessToken = localStorage.getItem('accessToken');
        accessToken = newAccessToken;
        headers = {
          authorization: `Bearer ${newAccessToken}`
        };
        storeData = await api.get(`/store/${store_id}`, { headers });
      }
    }

    console.log(storeData.data);


    setCompany_id(storeData.data.company_id);


    let getEmployees = await api.get(`/getEmployees/${store_id}`, { headers }); 
    // If token comes back as expired, refresh the token and make api call again
    if (getEmployees.data.message === 'Access token expired') {
      const user = await protectPage(accessToken, refreshToken);
      // If the access token or refresh token are unlegit, then return.
      if (!user) {
        console.log('no user!');
        history.push('/login');
      } else { 
        // overwrite getEmployees with the new access token.
        let newAccessToken = localStorage.getItem('accessToken');
        accessToken = newAccessToken;
        headers = {
          authorization: `Bearer ${newAccessToken}`
        };
        getEmployees = await api.get(`/store/${store_id}`, { headers });
      }
    }

    let employeesList = getEmployees.data;

    console.log('EmployeesList:', employeesList);

    if (!employeesList) {
      console.log('No employees');
      return;
    }

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
        <Select
          classname="searchBar"
          styles={customStyles}
          options={searchData}
          onChange = {evt => setSelectedStore(evt.label)}
        />
        <p>Selected store: <br/> <strong>{selectedStore}</strong></p>

        <Button className="secondary-btn" onClick={() => handleSubmit(false)}>
          Select Store
        </Button>
        <br/>
        <button className="submit-btn dashboard" onClick={goToDashboard}>
        ← Dashboard
        </button>

        {selectedAlert ?
        /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox" variant='success'>
            {selectedAlert}
          </Alert>
          : ''}

        {errorMessage ?
        /* ^^^^^^^^^^^^^^^^ is a ternary operator: Is party amount > 0? If no, then display the alert*/
          <Alert className="alertBox" variant='warning'>
            {errorMessage}
          </Alert>
          : ''}
      </div>


      {selectedStore_id && 
          <EmployeesContent 
            setEmployeeEmail={setEmployeeEmail}
            setEmployeeRole={setEmployeeRole}
            setEmployeeFirstname={setEmployeeFirstname}
            setEmployeeLastname={setEmployeeLastname}
            addInfoAlert={addInfoAlert}
            addAlert={addAlert}
            addEmployeeHandler={addEmployeeHandler}
            goToDashboard={goToDashboard}
            removeAlert={removeAlert}
            infoAlert={infoAlert}
            tableData={tableData}
            renderTableRows={renderTableRows}
          />
      }

    </Container>
  );
}
export default withRouter(Employees); 

function EmployeesContent({
  setEmployeeEmail,
  setEmployeeRole,
  setEmployeeFirstname,
  setEmployeeLastname,
  addInfoAlert,
  addAlert,
  addEmployeeHandler,
  goToDashboard,
  removeAlert,
  infoAlert,
  tableData,
  renderTableRows
}) {
  return (
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
          <Form.Control className='select-dropdown' as="select" onChange={evt => setEmployeeRole(evt.target.value)}>
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
            <li><strong>employee</strong> - able to change store occupancy and confirm customer visits. They cannot view this page</li>
            <li><strong>manager</strong> - able to do the same as an employee but can view this page to add employees, change their roles, or remove them from the store</li>
          </ol>
        </li>
        <li>Removing an employee revokes all of their powers and removes any link between the employee and store</li>
        <li>If an employee transfers to another store, make sure to re-add them to that new store and they will automatically be removed and transferred from their old store</li>
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
  );
}

// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
Employees.propTypes = {
  history: PropTypes.object.isRequired
};

EmployeesContent.propTypes = {
  setEmployeeRole: PropTypes.func.isRequired,
  setEmployeeFirstname: PropTypes.func.isRequired,
  setEmployeeLastname: PropTypes.func.isRequired,
  tableData: PropTypes.array.isRequired,
  removeAlert: PropTypes.string.isRequired,
  infoAlert: PropTypes.string.isRequired,
  addInfoAlert: PropTypes.string.isRequired,
  addAlert: PropTypes.string.isRequired,
  goToDashboard: PropTypes.func.isRequired,
  addEmployeeHandler: PropTypes.func.isRequired,
  renderTableRows: PropTypes.func.isRequired,
  setEmployeeEmail: PropTypes.func.isRequired,
};