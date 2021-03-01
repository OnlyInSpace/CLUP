const Store = require('../models/Store');

module.exports = {

  // Create an async event
  async createStore(req, res) {
    try {
      // console.log(req.body)
      const {company_id, storeName, location, maxOccupants, maxPartyAllowed, avgVisitLength, open24hours, businessHours} = req.body;

      // Check if store exists
      const existingStore = await Store.findOne({storeName: storeName, 'location.address1': location.address1, 'location.city': location.city});
      if (!existingStore) {
        // Create a new store with await
        const store = await Store.create({
          company_id,
          storeName,
          location,
          maxOccupants,
          maxPartyAllowed,
          avgVisitLength,
          open24hours,
          businessHours
        });
        // Respond by sending the store back
        return res.json(store);
      }
      // Else if store exists, display message.
      return res.status(200).json({
        message: 'This store already exists in our system.'
      });
    } catch (error) {
      throw Error(`Error while registering a new store : ${error}`);
    }
  },

  // Get a store by ID!
  async getStoreById(req, res) {
    // Get store ID from URL
    const { store_id } = req.params;
    try {
      const store = await Store.findById(store_id);
      // If visit exists, send the visit
      if (store) {
        return res.json(store);
      }
    } catch (error) {
      return res.status(200).json({message: 'No Store Selected Yet, so no data is being displayed.'});
    }
  },

  // Get all stores 
  async getAllStores(req, res) {
    try {
      const stores = await Store.find({});
      // If stores exist, send the stores 
      if (stores) {
        return res.json(stores);

      }
    } catch (error) {
      return res.status(400).json({message: 'No stores found.'});
    }
  }
};