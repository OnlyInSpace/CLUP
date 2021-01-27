const User = require('../models/User');
require('dotenv').config();


module.exports = {
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
      console.log('Getting all usrs...');
      // If visits exist, send the visits
      if (users) {
        return res.json(users);
      }
    } catch (error) {
      return res.status(400).json({message: 'No users found.'});
    }
  }
};