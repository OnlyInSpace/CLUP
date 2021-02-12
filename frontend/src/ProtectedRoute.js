import React from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import { Route, Redirect } from 'react-router-dom';
import jwt from 'jsonwebtoken';

// This protects all pages to ensure users have legit tokens that refresh every 15 minutes!
function ProtectedRoute({ component: Component, ...rest }) {
  // Verify user has a refresh token
  const refreshToken = Cookies.get('refreshToken');
  const decodeRefresh = jwt.decode(refreshToken);
  let isAuth = true;
  if (decodeRefresh) {
    isAuth = true;
  } else {
    isAuth = false;
  }


  return (
    <Route
      {...rest}
      render={(props) => {
        if (isAuth) {
          return <Component />;
        } else {
          return (
            <Redirect to={{ pathname: '/login', state: { from: props.location }}} />
          );
        }
      }}
    />
  );
}
export default ProtectedRoute;

// In order for our component to be properly reusable, we can require certain props so that they pop up in intellisense 
ProtectedRoute.propTypes = {
  component: PropTypes.func.isRequired,
  isAuth: PropTypes.bool,
  location: PropTypes.object
};