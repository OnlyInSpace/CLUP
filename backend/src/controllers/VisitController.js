const Visit = require('../models/Visit');
const User = require('../models/User');

module.exports = {
  // Create an async event
  async createVisit(req, res) {
    // console.log("\nCONTROLLER\n")
    // console.log("req.body:", req.body);

    // Get all info from body
    const { user_id, scheduledDate, partyAmount, store_id } = req.body;

    try {
      if (partyAmount <= 0) {
        return res.status(200).json({
          message: 'Required information is missing.'
        });
      }
      const user = await User.findById(user_id);
      // Display error if user does not exist
      if (!user) {
        return res.status(200).json({message: 'User or store does not exist!'});
      }
      // Check if visit already exists
      const visitExists = await Visit.findOne({'date': scheduledDate, 'store': store_id, 'user': user_id});
      if (visitExists) {
        console.log('visit Exists!', visitExists);
        return res.status(200).json({message: 'This visit already exists. Got to \'My Visits\' to view your visits.'});
      }
      // Else: 
      // Create the visit
      const visit = await Visit.create({
        date: scheduledDate,
        partyAmount,
        store: store_id,
        user: user_id
      });
      return res.json(visit);
    } catch (error) {
      throw Error(`Error creating a new visit : ${error}`);
    }
  },

  
  // Delete a visit
  async delete(req, res) {
    const { visitId } = req.params;
    try {
      await Visit.findByIdAndDelete(visitId);
      // 204 code: server succesfully fulfilled the request Delete
      return res.sendStatus(204);
            
    } catch (error) {
      return res.status(400).json({message: 'No visit found with that ID'});

    }
  },


  // Get a visit by ID!
  async getVisitById(req, res) {
    // Get visit ID from URL /visit/<visitid>
    const { visitId } = req.params;
    try {
      const visit = await Visit.findById(visitId);
      // If visit exists, send the visit
      if (visit) {
        return res.json(visit);
      }
    } catch (error) {
      return res.status(200).json({message: 'Visit Id does not exist!'});
    }
  },

  // Get all visits specific to only the user
  async getUserVisits(req, res) {
    // get user_id
    const { user_id } = req.params;

    try {
      // Return all visits tied to user at that store
      const visits = await Visit.find({'user': user_id});
      // If visits exist, send the visits
      if (visits) {
        return res.json(visits);
      }
    } catch (error) {
      return res.status(400).json({message: 'No visits are scheduled.'});
    }
  },


  // Get all visits specific to only the user
  async getAllVisits(req, res) {
    // get user_id  
    try {
      // Return all visits tied to user at that store
      const visits = await Visit.find({});
      // If visits exist, send the visits
      if (visits) {
        return res.json(visits);
      }
    } catch (error) {
      return res.status(400).json({message: 'No visits are scheduled.'});
    }
  }
};