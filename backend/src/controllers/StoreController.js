const Store = require('../models/Store');
const User = require('../models/User');


module.exports = {
  // Create an async event
  async createStore(req, res) {
    try {
      // console.log(req.body)
      const { company_id, storeName, location, maxOccupants, maxPartyAllowed, avgVisitLength, open24hours, businessHours } = req.body;
      
      // ensure fields are not missing
      if (!storeName || !maxOccupants || !maxPartyAllowed || !location.city || !location.state || !location.address1 || !location.postalCode || !avgVisitLength) {
        return res.json({message: 'Missing required information.'});
      }

      // Ensure positive numbers contain only digits and no other characters
      const isMaxParty = /^\d+$/.test(maxPartyAllowed);
      const isMaxOccupants = /^\d+$/.test(maxOccupants);
      const isPostalCode = /^\d+$/.test(location.postalCode);
      const isAvgVisitLength = /^\d+$/.test(avgVisitLength);
      if (!isMaxParty || !isMaxOccupants || !isPostalCode || !isAvgVisitLength) {
        return res.json({message: 'Please make sure to enter only digits in the number fields.'});
      }
      
      let validated = false;
      let hoursMessage;
      if (!open24hours) {
        // Convert business hours to array and do validation checks for days and business hours
        const hoursArr = Object.keys(businessHours).map(i => businessHours[i]);
        
        hoursArr.forEach((day) => {
          // If a day is checked but does not have open/close times
          if (day.enabled && (!day.open || !day.close)) {
            hoursMessage = day.day + ' is checked but it\'s open/close time is missing, please uncheck the day or select its hours.';
          }
          // If day is checked but hours not selected
          if (!day.enabled && (day.open || day.close)) {
            hoursMessage = day.day + ' is not checked but its hours are defined, please checkmark the day or remove the times by selecting \'time\' instead.';
          }
          // If open and close times are equal
          if (day.enabled && day.open == day.close) {
            hoursMessage = day.day + '\'s open and close times are equal.';
          }
          // Ensure user selects at least one day's business hours 
          if (day.enabled) {
            validated = true;
          }
        });

      } else {
        validated = true;
      }
      
      if (hoursMessage) {
        return res.json({message: hoursMessage});
      }

      if (!validated) {
        return res.json({message: 'Please define your store\'s business hours'});
      }
      
      // ensure parties are valid
      if (parseInt(maxPartyAllowed) > parseInt(maxOccupants)) {
        return res.json({message: 'The max party allowed cannot exceed total occupancy.'});
      }
      // Check if store exists
      const existingStore = await Store.findOne({storeName: storeName, 'location.address1': location.address1, 'location.city': location.city});
      if (existingStore) {
        return res.json({message: 'Sorry, this store already exists in our system.'});
      }

      console.log(avgVisitLength);
      // Create a new store with await
      const store = await Store.create({
        company_id,
        storeName,
        location,
        maxOccupants: parseInt(maxOccupants),
        maxPartyAllowed: parseInt(maxPartyAllowed),
        avgVisitLength: parseInt(avgVisitLength),
        open24hours,
        businessHours
      });
      // Respond by sending the store back
      return res.status(200).json(store);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get a store by ID!
  async getStoreById(req, res) {
    try {
      // Get store ID from URL
      const { store_id } = req.params;
      // handle warning
      if (store_id === 'undefined' || !store_id) 
        return res.json({ message: 'Please select a store.'});

      const store = await Store.findById(store_id);
      
      // If store exists, send the store, else return error
      return res.status(200).json(store);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all stores 
  async getAllStores(req, res) {
    try {
      const stores = await Store.find({});
      // If stores exist, send the stores 
      return res.status(200).json(stores);

    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all stores owned by owner 
  async getOwnedStores(req, res) {
    try {
      const { company_id } = req.params;

      const stores = await Store.find({'company_id': company_id});
      // If stores exist, send the stores 
      return res.status(200).json(stores);
  
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all stores 
  async getAllEmployees(req, res) {
    try {
      const { store_id } = req.params;

      const storeEmployees = await User.find({ 'business_id': store_id });

      // If employees exist, then send em back
      return res.status(200).json(storeEmployees);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  }
};