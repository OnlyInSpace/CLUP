require('dotenv').config();
// Import express and mongoose
const express = require('express');
const mongoose = require('mongoose');
// cors allows us to do requests from different devices without compromise
const cors = require('cors');
const routes = require('./routes');
const app = express();
const cron = require('node-cron');
// For checking our visits every 15 mins
const Visit = require('./models/Visit');
const Store = require('./models/Store');
// Import User model for our login authentication
const User = require('./models/User');
// Import JWT package
const jwt = require('jsonwebtoken');
// Import bcrypt for password decrypting and comparing
const bcrypt = require('bcrypt');
// Nodemailer for sending emails
const nodemailer = require('nodemailer');

// This line is needed for later deployment
const PORT = process.env.PORT || 8000;

// Telling the app to use cors, express.json, and routes
app.use(cors());
app.use(express.json());

// Register a user and send a generated access and refresh token back to frontend
app.post('/user/register', async function (req, res) {
  try {
    let { phoneNumber, email, password } = req.body;
    if (!phoneNumber || !email || !password) {
      return res.json({message: 'Required information is missing.'});
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
      
      //************  Sending Email  **************/
      // Make ethereal test account
      // let testAccount = await nodemailer.createTestAccount();

      // create reusable transporter object using the default SMTP transport
      let transporter = nodemailer.createTransport({
        service: 'gmail',
        // service: 'smtp.ethereal.email',
        // port: 587, // default: 587
        // secure: false, // true for 465, false for other ports
        auth: {
          type: 'OAuth2',
          user: process.env.MAIL_ACC,
          pass: process.env.MAIL_PASS,
          clientId: process.env.OAUTH_CLIENTID,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
      });

      // send mail with defined transport object
      await transporter.sendMail({
        from: '"CLUP" <CustomerLineup@CLUP.com>', // sender address
        to: `CLUP User <${user.email}>`, // list of receivers
        subject: 'Confirm Email', // Subject line
        text: '', // plain text body
        // html: '<b><a href=\'confirmEmail\'>Confirm Email</a></b><br/><img src="cid:customer_lineup_logo@logo.com />', // html body
        html: '<h3 style="text-align: center; margin-bottom: 7px;">Click the link below to confirm your email</h3><b><h2 style="text-align: center;"><a href=\'http://localhost:3000/confirmEmail\'>Confirm Email</a></h2></b><br/><img style="width: 300px; margin-left: auto; margin-right: auto; display: block;" src="cid:customer_lineup_logo_made"/>', // html body
        attachments: [{
          // Image file attachment
          filename: 'logo.png',
          path: __dirname + '/client/src/pages/LandingPage/img/logo.png',
          cid: 'customer_lineup_logo_made'
        }]
      });
      // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      //***********End of Email***********/
      
      
      // Create JWTs
      const userData = {
        _id: user._id,
        confirmed: user.confirmed,
        email: user.email,
        phoneNumber: user.phoneNumber,
        business_id: user.business_id,
        role: user.role,
        clockedIn: user.clockedIn
      };
      // Sign both access and refresh token with different secrets
      const accessToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '820s' });
      const refreshToken = jwt.sign(userData, process.env.JWT_REFRESH, { expiresIn: '365d' });
      // Update refreshToken in MongoDB for user
      await User.findOneAndUpdate({email: user.email}, {refreshToken: refreshToken});

      // Encrypt user object via JSON web token, then send the token and user_id back to frontend
      return res.status(200).json({
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
    if (await bcrypt.compare(password, user.password)) {
      const userData = {
        _id: user._id,
        confirmed: user.confirmed,
        email: user.email,
        phoneNumber: user.phoneNumber,
        business_id: user.business_id,
        role: user.role,
        clockedIn: user.clockedIn
      };

      const accessToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '820s'});
      const refreshToken = jwt.sign(userData, process.env.JWT_REFRESH, { expiresIn: '365d'});
      // Update refreshToken in MongoDB for user
      await User.findOneAndUpdate({email: user.email}, {refreshToken: refreshToken});

      // Encrypt user object via JSON web token, then send the token and user_id back to frontend
      return res.status(200).json({
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
    // Get token from auth headers
    const accessToken = req.headers.authorization.split(' ')[1];
    // Verify the token is legit and unexpired! If it is, then go ahead and return success = true
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
      if (user) {
        // At this point, we know that the access token is legit and unexpired so send back success and the user object to frontend
        return res.status(200).json({
          success: true,
          user
        });
      } else if (err.message === 'jwt expired' || accessToken === 'undefined') { // else if jwt is expired, notify frontend so we can refresh it
        console.log('Access token expired. . .');
        return res.json({
          success: false,
          message: 'Access token expired'
        });
      } else { // else token doesnt exist or could be unlegit, return 403 forbidden status back to frontend and have user login again
        console.log('\naccess token verify failed in authServer.\n');
        console.log('\nuser:', user, typeof(user));
        console.log('\nheaders:', req.headers.authorization);
        return res.status(403).json({ err, message: 'User not authenticated' });
      }
    }); 

  } else { 
    console.log('no token in auth headers (from authServer.js)');
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
    if (refresh) {
      console.log('refreshing  token!');
      // Set our userData
      const userData = {
        _id: user._id,
        confirmed: user.confirmed,
        email: user.email,
        phoneNumber: user.phoneNumber,
        business_id: user.business_id,
        role: user.role,
        clockedIn: user.clockedIn
      };
      // Create new access token
      const newAccessToken = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '820s' });
      return res.status(200).json({
        success: true, 
        newAccessToken
      });
    } else if (err.message === 'jwt expired') {
      console.log('Refresh token expired. . .');
      return res.json({
        success: false,
        message: 'Refresh token expired'
      });
    } else {
      console.log('\rrefresh token verify failed in authServer.\n');
      console.log('\nuser:', user);
      console.log('\nheaders:', req.headers.authorization);
      return res.status(403).json({ err, message: 'User not authenticated' });
    }
  });
});


app.use(routes);


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



cron.schedule('*/1 * * * *', async () => {
  try {
    // Return all visits from database in an array
    const visits = await Visit.find({});
    // For each visit in array, check if visit is late and delete if so
    visits.forEach(visit => updateVisits(visit));

    // Send SMS alerts
    const stores = await Store.find({});
    stores.forEach(store => sendEmail(store));

    console.log('running a task every minute');
  } catch (error) {
    console.log(error);
  }
});


async function updateVisits(visit) {
  try {
    // get current time and convert to minutes
    let currentTime = Math.floor(Date.now() / 60000);
    // get the time of visit in minutes
    let timeOfVisit = Math.floor(Date.parse(visit.date) / 60000);
    // Calculate time difference
    let timeDifference = timeOfVisit - currentTime;
  
    // Get store's average visit length
    const store = await Store.findById(visit.store);
  
    // this offset is needed to ensure a user's party gets reserved in the system before their visit 
    let visitLengthOffset = store.avgVisitLength * 2;
    if (store.avgVisitLength <= 10) {
      visitLengthOffset += 5;
    } else if (store.avgVisitLength <= 20) {
      visitLengthOffset += 10;
    } else if (store.avgVisitLength <= 30) {
      visitLengthOffset += 20;
    } else if (store.avgVisitLength <= 60) {
      visitLengthOffset += 30;
    } else {
      visitLengthOffset += 40;
    } 

    // if time of visit is within avg visit length plus 15 minutes, then reserve user's party by incrementing current count by partyAmount
    if (!visit.reserved && timeDifference <= visitLengthOffset ) {
      await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'upcomingVisits': 1}});
      await Visit.findOneAndUpdate({_id: visit._id}, {'reserved': true});
    }
  
    // If timeOfVisit is -15 minutes or more late, then mark visit as late in the database and increment late visits
    if (!visit.late && timeDifference <= -15) {
      await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'lateVisits': 1}});
      await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'upcomingVisits': -1}});
      await Visit.findByIdAndUpdate({_id: visit._id}, {'late': true});
    }

    // If visit is really late, then just remove it and decrement 
    if (timeDifference <= -300 && visit.late) {
      await Visit.findByIdAndDelete({_id: visit._id});
      await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'lateVisits': -1}});
    }

  } catch (error) {
    console.log(error);
    console.log('error in updateVisits server.js');
  }
}


// updating an array of documents
// https://docs.mongodb.com/manual/reference/operator/update/positional/#mongodb-update-up.-
async function sendEmail(store) {
  try {
    
    // if store doesn't have a queue, then just exit
    if (store.queue.length === 0) {
      return;
    }

    // head of queue
    let head = store.queue[0];

    // If head of queue has been alerted, set their minsLate to (current time - their start time)
    if (head.alerted) {
      // get current time and convert to minutes
      let currentTime = Math.floor(Date.now() / 60000);
      // get the start time of being at head of queue in minutes
      let startTime = Math.floor(head.startTime / 60000);

      // Calculate time difference
      let timeDifference = startTime - currentTime;
      
      // set their minsLate to the time difference
      await Store.updateOne(
        {_id: store._id, 'queue.email': head.email },
        { $set: { 'queue.$.minsLate': timeDifference} }
      );

    }

    // If customer at head of queue has not been alerted, then send them an SMS and set their alerted proerty to true
    if (!head.alerted) {
      // Update their alerted property to true
      const setAlerted = await Store.updateOne(
        {_id: store._id, 'queue.email': head.email },
        { $set: { 'queue.$.alerted': true} }
      );

      console.log('sending message');
      // Send text message to first person in queue
      if (setAlerted) {

        //************  Sending Email  **************/
        // Make ethereal test account
        // let testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          // service: 'smtp.ethereal.email',
          // port: 587, // default: 587
          // secure: false, // true for 465, false for other ports
          auth: {
            type: 'OAuth2',
            user: process.env.MAIL_ACC,
            pass: process.env.MAIL_PASS,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
          }
        });

        // send mail with defined transport object
        await transporter.sendMail({
          from: '"CLUP" <CustomerLineup@CLUP.com>', // sender address
          to: `CLUP User <${head.email}>`, // list of receivers
          subject: 'CLUP Queue Alert', // Subject line
          text: '', // plain text body
          // html: '<b><a href=\'confirmEmail\'>Confirm Email</a></b><br/><img src="cid:customer_lineup_logo@logo.com />', // html body
          html: '<p style="margin-bottom: 7px; font-size: 16px;">CLUP ALERT: <br/><br/>You are next in line at ' + store.storeName + '<br/><br/>Please walk into the entrance of the store within 15 minutes of getting this message or you might lose your spot!' + 
          '<br/><br/>Have a nice day,<br/>Thank you</p><b><h2 style="text-align: center;"></h2></b><br/><br/><img style="width: 300px; margin-left: auto; margin-right: auto; display: block;" src="cid:customer_lineup_logo_made"/>', // html body
          attachments: [{
          // Image file attachment
            filename: 'logo.png',
            path: __dirname + '/client/src/pages/LandingPage/img/logo.png',
            cid: 'customer_lineup_logo_made'
          }]
        });
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        //***********End of Email***********/

        // Once alerted, set their start time to the current time
        await Store.updateOne(
          {_id: store._id, 'queue.email': head.email },
          { $set: { 'queue.$.startTime': Date.now()} }
        );
      }
    }
  
  
  } catch (error) {
    console.log(error);
    console.log('error in sendEmail server.js');
  }
}


// if in production - point to React app
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static('client/build'));

  // Right before your app.listen(), add this:
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API Running');
  });
}


// Listen for whatever PORT is set
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});