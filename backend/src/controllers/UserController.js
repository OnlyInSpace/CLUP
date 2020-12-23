const User = require('../models/User');
const bcrypt = require('bcrypt');

module.exports = {
  // To make a query to our database, we need to define this function as an async
  async createUser(req, res) {
    try {
      const {phoneNumber, email, password} = req.body;
      if (!phoneNumber || !email || !password) {
        return res.status(200).json({
          message: 'Required information is missing.'
        });
      }
      // Check if user exists
      const existingUser = await User.findOne({email});
      if (!existingUser) {
        // Hash the password with bcrypt module
        // 13 option is how much salt we give the password which is a decent amount 
        const hashedPassword = await bcrypt.hash(password, 13);
        // Create a new user with mongoose .create()
        const user = await User.create({
          phoneNumber,
          email,
          password: hashedPassword
        });
        // Respond to frontend by sending the user without the user's password
        return res.json({
          _id: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber
        });
      }
      // Else if user exists, display message.
      return res.status(200).json({
        message: 'This email already exists. Try logging in?'
      });
    } catch (error) {
      throw Error(`Error while registering a new user : ${error}`);
    }
  },

  async getUserById(req, res) {
    // Get user ID
    const { userId } = req.params;
        
    try {
      // Find user via mongoDB object ID using the model
      const user = await User.findById(userId);
      return res.json(user);
    } catch (error) {
      return res.status(400).json({
        message: 'User ID does not exist, register instead?'
      });
    }

  },

  // Get all users
  async getAllUsers(req, res) {
    try {
      // Return all visits from visit model
      const users = await User.find({});
      // If visits exist, send the visits
      if (users) {
        return res.json(users);
      }
    } catch (error) {
      return res.status(400).json({message: 'No users found.'});
    }
  }
};