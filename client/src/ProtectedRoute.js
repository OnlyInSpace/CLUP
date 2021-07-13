import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';
import {
  protectPage
} from './pages/verifyTokens/tokenFunctions';


// This protects all pages to ensure users have valid tokens that refresh every 15 minutes!
function ProtectedRoute({ component: Component, ...rest }) {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  useEffect(() => {
    (async () => {
      try {
        const user = await protectPage(accessToken, refreshToken);
        if (accessToken && refreshToken && accessToken !== 'undefined' && user.confirmed) {
          setIsAuth(true);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.log(error);
      }
    })();
  }, []);


  // return component if token is verified, else redirect to landing page.
  return (
    <>
      { isLoading ? ''
        :
        <Route
          {...rest}
          render={(props) => {
            if (isAuth) {
              return <Component />;
            } else {
              return (<Redirect to={{ pathname: '/', state: { from: props.location }}} />);
            }
          }}
        />
      }
    </>
  );
}
export default ProtectedRoute;

// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
ProtectedRoute.propTypes = {
  component: PropTypes.func.isRequired,
  isAuth: PropTypes.bool,
  location: PropTypes.object
};