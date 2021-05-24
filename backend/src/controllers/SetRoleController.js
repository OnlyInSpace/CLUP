const User = require('../models/User');

module.exports = {

  async addEmployee(req, res) {
    try {
      let { email, role, firstName, lastName, store_id, company_id } = req.body;

      if (!email || !role || !firstName || !lastName) {
        return res.json({ message: 'Missing required information.'});
      }

      email = email.toLowerCase();
      let checkStatus = await User.find({ email });

      if (!checkStatus[0]) {
        return res.json({
          message: 'This person does not have an account with us, make sure they have an account first before adding them as an employee.'
        });
      }

      checkStatus = checkStatus[0];

      if (checkStatus.business_id === store_id) {
        return res.json({
          message: 'This person is already an employee. Please refer to the Employee table if you want to remove them or change their role.'
        });
      } else if (checkStatus.business_id === company_id) {
        return res.json({
          message: 'This person is already the owner of the store.'
        });
      }

      // Update user's role and name, new: true option means we want to return the newest updated object
      const user = await User.findOneAndUpdate({ email }, { '$set': { firstName, lastName, role, 'business_id': store_id }}, { new: true });

      return res.status(200).json(user);

    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },
  

  async setOwnerRole(req, res) {
    try {
      const { user_id } = req.body;
      // Update user's role
      const user = await User.findByIdAndUpdate(user_id, { role: 'owner' }, { new: true });

      if (!user) {
        return res.json({
          message: 'user does not exist'
        });
      }

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },

  
  async changeRole(req, res) {
    try {
      // Get email and role from frontend
      let { email, role } = req.body;

      if (!role)
        return res.json({ message: 'You didn\'t enter a valid role.'});
      
      if (role.toLowerCase() === 'employee' || role.toLowerCase() === 'manager') {
        email = email.toLowerCase();
        role = role.toLowerCase();
  
        let checkStatus = await User.find({ email });
        checkStatus = checkStatus[0];
        // Ensure role change is not the same
        if (checkStatus.role === role) {
          return res.json({
            message: 'No changes made, this person\'s role is already ' + role  
          });
        }
  
        // Update user's role, new: true option means we want to return the newest updated object
        const user = await User.findOneAndUpdate({ email }, { '$set': { role }}, { new: true });
        return res.status(200).json({user});
      } else {
        return res.json({ message: 'Sorry, you need to enter either \'employee\' or \'manager\' in the textbox to change their role.'});
      }

    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  async removeEmployee(req, res) {
    try {
      let { email } = req.body;
      email = email.toLowerCase();

      // Update user's role
      const user = await User.findOneAndUpdate({email: email}, { '$set': { role: 'user', business_id: '' }}, { new: true });

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  async setBusiness_id(req, res) {
    try {
      const { user_id, business_id } = req.body;
      // Update user's role
      const user = await User.findByIdAndUpdate(user_id, { business_id: business_id }, { new: true });

      if (!user) {
        return res.status(200).json({ message: 'user does not exist' });
      }

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  }
};