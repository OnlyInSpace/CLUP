const Visit = require('../models/Visit');
const User = require('../models/User');
const Store = require('../models/Store');

module.exports = {
  // Create an async event
  async createVisit(req, res) {
    // console.log("\nCONTROLLER\n")
    // console.log("req.body:", req.body);

    // Get all info from body
    const { phoneNumber, user_id, scheduledDate, partyAmount, store_id } = req.body;
    console.log(scheduledDate);

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
      // Create the visit
      const visit = await Visit.create({
        phoneNumber,
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
      const visit = await Visit.findById(visitId);

      // If visit is reserved, make sure to decrement reserved partyAmount
      if ( visit.reserved ) {
        await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'reservedCustomers': -visit.partyAmount}});
      }
      if ( visit.late ) {
        await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'lateVisits': -1}});
      }
      // delete visit
      await Visit.findByIdAndDelete(visitId);
      // 204 code: server succesfully fulfilled the request Delete
      return res.sendStatus(204);
            
    } catch (error) {
      return res.status(400).json({message: 'No visit found with that ID'});

    }
  },


  // Confirm a visit
  async confirmVisit(req, res) {
    const { visit_id } = req.params;
    console.log(visit_id);
    try {
      const visit = await Visit.findById(visit_id);
      const store = await Store.findById(visit.store);

      if (visit.partyAmount + store.currentCount > store.maxOccupants) {
        console.log('Store will overflow.');
        return res.json({message: 'Store will overflow.'});
      }

      // If visit is reserved, make sure to decrement reserved partyAmount
      if (visit.reserved ) {
        // if visit is late, decrement late visits
        if ( visit.late ) {
          await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'lateVisits': -1}});
        }
        // decrement reserved
        await Store.findByIdAndUpdate(visit.store, {$inc: {'reservedCustomers': -visit.partyAmount}});
        // increment store occupancy
        await Store.findByIdAndUpdate(visit.store, {$inc: {'currentCount': visit.partyAmount}});
        // delete visit 
        await Visit.findByIdAndDelete(visit_id);
        return res.sendStatus(204);
      } else {
        console.log('VISIT NOT RESERVED!');
        return res.json({message: 'Visit is not reserved.'});
      }
            
    } catch (error) {
      return res.status(400).json({message: 'Confirm visit error'});

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


  // Get all visits specific to only the user and a store
  async getUserStoreVisits(req, res) {
    // get user_id
    console.log(req.params);
    const { store_id, user_id } = req.params;

    try {
      // Return all visits tied to user at that store
      const visits = await Visit.find({'user': user_id, 'store': store_id});
      // If visits exist, send the visits
      if (visits) {
        return res.json(visits);
      }
    } catch (error) {
      return res.status(400).json({message: 'No visits are scheduled.'});
    }
  },


  // Get all visits specific to only a store
  async getStoreVisits(req, res) {
    // get user_id
    const { store_id } = req.params;
  
    try {
      // Return all visits tied to that store
      const visits = await Visit.find({ 'store': store_id });
      // If visits exist, send the visits
      if (visits) {
        return res.json(visits);
      }
    } catch (error) {
      return res.status(400).json({message: 'No visits are scheduled.'});
    }
  },


  // Get all visits
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