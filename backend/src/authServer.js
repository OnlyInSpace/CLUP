// Import express and mongoose
const express = require('express');
const mongoose = require('mongoose');
// Import bcrypt for password decrypting and comparing
const bcrypt = require('bcrypt');
// Import User model for our login
const User = require('./models/User');
// Import JWT package
const jwt = require('jsonwebtoken');
// cors allows us to do requests from different devices without compromise
const cors = require('cors');
const app = express();
const PORT = 4000;

// Listen for whatever PORT is set to
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
// If we are NOT starting our server as a development environment, then import our .env 
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// Telling the app to use cors, express.json, and routes
app.use(cors());
app.use(express.json());
// Connecting our database
try {
  mongoose.connect(process.env.MONGO_DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  });
  console.log('MongoDB connected sucessfully!');
} catch (error) {
  console.log(error);
}


// Register a user and send a generated access and refresh token back to frontend
app.post('/user/register', async function (req, res) {
  try {
    let {phoneNumber, email, password} = req.body;
    if (!phoneNumber || !email || !password) {
      return res.status(200).json({
        message: 'Required information is missing.'
      });
    }
    email = email.toLowerCase();

    // Check if user exists
    let message = '';
    const existingEmail = await User.findOne({email});
    const existingPhoneNumber = await User.findOne({phoneNumber});
    if (existingEmail) {
      message = 'This email already exists. Try logging in below?';
    }
    if (existingPhoneNumber) {
      message = 'This phone number already exists. Try logging in below?';
    }

    if (!existingEmail && !existingPhoneNumber) {
      // Hash the password with bcrypt module
      // 13 option is how much salt we give the password which is a decent amount 
      const hashedPassword = await bcrypt.hash(password, 13);
      // Create a new user with mongoose .create()
      const user = await User.create({
        phoneNumber,
        email,
        password: hashedPassword
      });

      const userData = {
        _id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        business_id: user.business_id,
        role: user.role,
        clockedIn: user.clockedIn
      };

      // Sign both access and refresh token with different secrets
      const accessToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '720s' });
      const refreshToken = jwt.sign(userData, process.env.JWT_REFRESH, { expiresIn: '365d' });
      // Update refreshToken in MongoDB for user
      await User.findOneAndUpdate({email: user.email}, {refreshToken: refreshToken});

      // Encrypt user object via JSON web token, then send the token and user_id back to frontend
      return res.json({
        accessToken,
        refreshToken
      });

    }
    // Else if user exists, display message.
    return res.status(200).json({ message });
  } catch (error) {
    throw Error(`Error while registering a new user : ${error}`);
  }
});


// Log a user in and send a generated access and refresh token back to frontend
app.post('/login', async function (req, res) {
  try {
    // Get email and password from body
    let {email, password} = req.body;
    // If email or password field are empty
    if (!email || !password) {
      return res.status(200).json({message: 'Required field(s) missing'});
    }
    
    email = email.toLowerCase();
    // Get user
    const user = await User.findOne({email});
    // If user does not exist, display error message
    if (!user) {
      return res.status(200).json({message: 'This email does not exist, but you can register a new account below'});
    }

    // Else if user exists and the password matches what's in the database
    // Then create userResponse object to be stored in cookies
    if (user && await bcrypt.compare(password, user.password)) {
      const userData = {
        _id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        business_id: user.business_id,
        role: user.role,
        clockedIn: user.clockedIn
      };

      const accessToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '720s'});
      const refreshToken = jwt.sign(userData, process.env.JWT_REFRESH, { expiresIn: '800d'});
      // Update refreshToken in MongoDB for user
      await User.findOneAndUpdate({email: user.email}, {refreshToken: refreshToken});

      // Encrypt user object via JSON web token, then send the token and user_id back to frontend
      return res.json({
        accessToken,
        refreshToken
      });
    
    } else {
      return res.status(200).json({message: 'Email or Password does not match'});
    }
  } catch (error) {
    throw Error(`Error while trying to login a User ${error}`);
  }
});


// Since we call verifyAccessToken before /logout, we ensure the user's token is verified before logging out
app.post('/logout', async function (req, res) {
  const { user } = req.body;
  // Verify that we have a user object
  if (user) {
    // If so, go ahead and delete the refresh token so nobody can make API calls from the user's account
    await User.findOneAndUpdate({ email: user.email }, { refreshToken: '' });
    return res.sendStatus(204);
  } else { 
    return res.sendStatus(401);
  }
});


// This function is used in ProtectedRoute to prevent a page from rendering if a user doesnt have a valid accessToken
// This function protects our frontend whereas the other verifyToken function in routes.js protects our backend
app.get('/verifyAccessToken', async function (req, res) {
  // Verify accessToken is legit
  if (req.headers.authorization) {
    const accessToken = req.headers.authorization.split(" ")[1];
    // Verify the token is legit and unexpired! If it is, then go ahead and return success = true
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
      if (user) {
        // At this point, we know that the access token is legit and unexpired so send back success and the user object to frontend
        return res.json({
          success: true,
          user
        });
      } else if (err.message === 'jwt expired') { // else if jwt is expired, notify frontend so we can refresh it
        console.log('Token expired, refreshing. . .');
        return res.json({
          success: false,
          message: 'Access token expired'
        });
      } else { // else token doesnt exist or could be unlegit, return 403 forbidden status back to frontend and have user login again
        console.log('\nverify failed in authServer.\n');
        console.log('\nuser:', user);
        console.log('\nheaders:', req.headers.authorization);
        return res.status(403).json({ err, message: 'User not authenticated' });
      }
    }); 

  } else { 
    console.log('no token in auth headers (from authServer.js)')
    return res.sendStatus(401);
  }
});


// Creates a new accessToken using the given refreshToken;
app.get('/refresh', async function (req, res) {
  const refreshToken = req.header('refreshToken');
  // Check if refreshToken is in MongoDB
  const user = await User.findOne({ refreshToken: refreshToken }); 
  if (!refreshToken || !user) {
    return res.json({ message: 'Refresh token not found!' });
  }
  // If the refresh token is valid, create a new accessToken and return it.
  jwt.verify(refreshToken, process.env.JWT_REFRESH, (err, refresh) => {
    if (!err) {
      // Set our userData
      const userData = {
        _id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        business_id: user.business_id,
        role: user.role,
        clockedIn: user.clockedIn
      };
      // Create new access token
      const newAccessToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '720s' });
      return res.json({
        success: true, 
        newAccessToken
      });
    } else {
      return res.json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  });
});