require('dotenv').config();
// Import User model for our login authentication
const User = require('../models/User');
// Import JWT package
const jwt = require('jsonwebtoken');
// Import bcrypt for password decrypting and comparing
const bcrypt = require('bcrypt');
// Nodemailer for sending emails
const nodemailer = require('nodemailer');

module.exports = {
// Register a user and send a generated access and refresh token back to frontend
  async registerUser(req, res) {
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

        console.log(__dirname);
        // send mail with defined transport object
        await transporter.sendMail({
          from: '"CLUP" <CustomerLineup@CLUP.com>', // sender address
          to: `CLUP User <${user.email}>`, // list of receivers
          subject: 'Confirm Email', // Subject line
          text: '', // plain text body
          // html: '<b><a href=\'confirmEmail\'>Confirm Email</a></b><br/><img src="cid:customer_lineup_logo@logo.com />', // html body
          html: '<h3 style="text-align: center; margin-bottom: 7px;">Click the link below to confirm your email</h3>' +
            '<b><h2 style="text-align: center;"><a href=\'http://localhost:3000/confirmEmail\'>Confirm Email</a></h2></b>' + 
            '<h3 style="text-align: center; margin-bottom: 7px;">A project by <strong>Steven Salomon</strong></h3>' +
            '<br/><img style="width: 50%; margin-left: auto; margin-right: auto; display: block;" src="cid:customer_lineup_logo_made"/>', // html body
          attachments: [{
            // Image file attachment
            filename: 'logo.png',
            path: __dirname + '/logo.png',
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
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Since we call verifyAccessToken before /logout, we ensure the user's token is verified before logging out
  async userLogin(req, res) {
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
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Since we call verifyAccessToken before /logout, we ensure the user's token is verified before logging out
  async userLogout(req, res) {
    try {
      const { user } = req.body;
      // Verify that we have a user object
      if (user) {
        // If so, go ahead and delete the refresh token so nobody can make API calls from the user's account
        await User.findOneAndUpdate({ email: user.email }, { refreshToken: '' });
        return res.sendStatus(204);
      } else { 
        return res.sendStatus(401);
      }
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all stores owned by owner 
  async verifyAccessToken(req, res) {
    try {
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
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all stores 
  async refreshAccessToken(req, res) {
    try {
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
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  }
};