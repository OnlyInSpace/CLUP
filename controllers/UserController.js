const User = require('../models/User');
require('dotenv').config();


module.exports = {
  async confirmUser(req, res) {
    try {
      const { user_id } = req.params;
      
      // Update confirm property so user can use the app
      await User.findByIdAndUpdate(user_id, {'confirmed': true});
      return res.sendStatus(200);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  async getUserById(req, res) {
    try {
      // Get user ID
      const { user_id } = req.params;
      // Find user via mongoDB object ID using the model
      const user = await User.findById(user_id);

      return res.status(200).json(user);

    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all users
  async getAllUsers(req, res) {
    try {
      // Return all visits from visit model
      const users = await User.find({});
      console.log('Getting all usrs...');
      // If visits exist, send the visits
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // clock user in
  async setClockIn(req, res) {
    try {
      const { user_id } = req.body;
      await User.findByIdAndUpdate(user_id, {clockedIn: true});

      return res.sendStatus(204);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // clock user out
  async setClockOut(req, res) {
    try {
      const { user_id } = req.body;
      await User.findByIdAndUpdate(user_id, {clockedIn: false});
  
      return res.sendStatus(204);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  }
};