const User = require('../models/User');

module.exports = {

  async addEmployee(req, res) {
    try {
      let { email, role, firstName, lastName, store_id, company_id } = req.body;

      email = email.toLowerCase();

      let checkStatus = await User.find({ email });

      if (!checkStatus[0]) {
        return res.status(200).json({
          message: 'This person does not have an account with us, make sure they have an account first before adding them as an employee.'
        });
      }

      checkStatus = checkStatus[0];

      if (checkStatus.business_id === store_id) {
        return res.status(200).json({
          message: 'This person is already an employee. Please refer to the Employee table if you want to remove them or change their role.'
        });
      } else if (checkStatus.business_id === company_id) {
        return res.status(200).json({
          message: 'This person is already the owner of the store.'
        });
      }

      // Update user's role and name, new: true option means we want to return the newest updated object
      const user = await User.findOneAndUpdate({ email }, { '$set': { firstName, lastName, role, 'business_id': store_id }}, { new: true });

      return res.json(user);

    } catch (error) {
      return res.status(400).json({message: 'Error setting role'});
    }
  },
  

  async setOwnerRole(req, res) {
    try {
      const { user_id } = req.body;
      // Update user's role
      const user = await User.findByIdAndUpdate(user_id, { role: 'owner' }, { new: true });

      if (!user) {
        return res.status(200).json({
          message: 'user does not exist'
        });
      }

      return res.json(user);
    } catch (error) {
      return res.status(400).json({message: 'Error setting role to owner'});
    }
  },

  async changeRole(req, res) {
    try {
      let { email, role } = req.body;

      email = email.toLowerCase();

      let checkStatus = await User.find({ email });
      checkStatus = checkStatus[0];

      if (checkStatus.role === role) {
        return res.status(200).json({
          message: 'No changes made, this person\'s role is already ' + role  
        });
      }


      // Update user's role, new: true option means we want to return the newest updated object
      const user = await User.findOneAndUpdate({ email }, { '$set': { role }}, { new: true });

      return res.json({user});

    } catch (error) {
      return res.status(400).json({message: 'Error setting role to owner'});
    }
  },


  async removeEmployee(req, res) {
    try {
      let { email } = req.body;
      email = email.toLowerCase();

      // Update user's role
      const user = await User.findOneAndUpdate({email: email}, { '$set': { role: 'user', business_id: '' }}, { new: true });

      return res.json(user);
    } catch (error) {
      return res.status(400).json({message: 'Error setting role to owner'});
    }
  },


  async setBusiness_id(req, res) {
    try {
      const { user_id, business_id } = req.body;
      // Update user's role
      const user = await User.findByIdAndUpdate(user_id, { business_id: business_id }, { new: true });

      if (!user) {
        return res.status(200).json({
          message: 'user does not exist'
        });
      }

      return res.json(user);
    } catch (error) {
      return res.status(400).json({message: 'Error setting role to owner'});
    }
  }
};