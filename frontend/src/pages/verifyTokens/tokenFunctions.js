import auth from '../../services/auth';

// Function to refresh a user's access token if it is unexpired
export const refresh = async (refreshToken) => {
  console.log('refreshing token. . .');
  let response = await auth.get('/refresh', { headers: { refreshToken }});
  // if refresh token was unlegit or not found, then return false
  if (response.data.success === false) {
    console.log('resolving false.');
    return false;
  } else { // else we get the new access token, set the cookie, and return it!
    const newAccessToken = response.data.newAccessToken;
    localStorage.setItem('accessToken', newAccessToken, { secure: true });
    return newAccessToken;
  }
};
      

// returns true or false depending on whether the access token is legit : )
export const verifyAccess = async (accessToken, refreshToken) => {
  const headers = {
    authorization: `Bearer ${localStorage.getItem('accessToken')}`
  };

  let response = await auth.get('/verifyAccessToken', { headers });
  if (response.data.success === false) {
    // If the access token is expired, then go ahead and create a new access token with the refresh token
    if (response.data.message === 'Access token expired') { 
      const newAccessToken = await refresh(refreshToken);
      // Now that we have a new access token, let's verify the user and return the user
      return await verifyAccess(newAccessToken, refreshToken);
    }
    // If token comes back as invalid, return false
    return false;
  }
  // else the token is valid, return the user object with their data
  return response.data.user;     
};
      
      
// This function returns the user's object data within the token if it's legit, otherwise returns false.
// This function also handles refreshing the token if needed
export const protectPage = async (accessToken, refreshToken) => {
  // If user doesnt have a refresh token: have user login 
  if (!refreshToken){
    console.log('Please log out and log back in.');
  }
  // If we have a refresh token but no access token, then go ahead and create a new token
  if (accessToken === undefined) {
    // This returns either an access token or false if the refresh token is unlegit
    accessToken = await refresh(refreshToken);
  }
  // If token is legit, return false
  if (!accessToken) {
    console.log('Please log out and log back in.');
  }
  // If the access or refresh token is unlegit, this returns false, otherwise it returns the user's object data : )
  return await verifyAccess(accessToken, refreshToken);
};