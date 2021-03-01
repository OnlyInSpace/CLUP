const User = require('../models/User');

module.exports = {
  async setOwnerRole(req, res) {
    try {
      // Get store id from URL and amount from api call
      const { user_id } = req.body;
      if (!user_id) {
        return res.status(200).json({
          message: 'user_id missing in controller'
        });
      }
      // Update user's role
      const user = await User.findByIdAndUpdate(user_id, { role: 'owner' }, { new: true });
      return res.json(user);
    } catch (error) {
      return res.status(400).json({message: 'Error setting role to owner'});
    }
  },
    
  async setManagerRole(req, res) {
    try {
      // Get store id from URL and amount from api call
      const { email } = req.body;
      if (!email) {
        return res.status(200).json({
          message: 'email missing in controller'
        });
      }
      // Update user's role
      const user = await User.findOneAndUpdate({email: email}, {role: 'manager'}, { new: true });
      return res.json(user);
    } catch (error) {
      return res.status(400).json({message: 'Error setting role to owner'});
    }
  },

  async setEmployeeRole(req, res) {
    try {
      // Get store id from URL and amount from api call
      const { email } = req.body;
      if (!email) {
        return res.status(200).json({
          message: 'email missing in controller'
        });
      }
      // Update user's role
      const user = await User.findOneAndUpdate({email: email}, {role: 'manager'}, { new: true });
      return res.json(user);
    } catch (error) {
      return res.status(400).json({message: 'Error setting role to owner'});
    }
  },

  async setBusiness_id(req, res) {
    try {
      // Get store id from URL and amount from api call
      const { user_id, business_id } = req.body;
      if (!user_id || !business_id) {
        return res.status(200).json({
          message: 'user_id or business_id missing in controller'
        });
      }
      // Update user's role
      const user = await User.findByIdAndUpdate(user_id, { business_id: business_id }, { new: true });
      return res.json(user);
    } catch (error) {
      return res.status(400).json({message: 'Error setting role to owner'});
    }
  }
};