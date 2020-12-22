const Store = require('../models/Store');
const Company= require('../models/Company');

module.exports = {

  // Create an async event
  async createStore(req, res) {
    try {
      // console.log(req.body)
      const {storeName, location, maxOccupants, maxPartyAllowed} = req.body;
      if (!storeName || !location || !maxOccupants || !maxPartyAllowed) {
        return res.status(200).json({
          message: 'Required information is missing.'
        });
      }
      // Check if store exists
      const existingStore = await Store.findOne({storeName: storeName, 'location.address1': location.address1, 'location.city': location.city});
      if (!existingStore) {
        // Create a new store with await
        const store = await Store.create({
          storeName,
          location,
          maxOccupants,
          maxPartyAllowed
        });
        // Respond by sending the store back
        return res.json(store);
      }
      // Else if store exists, display message.
      return res.status(200).json({
        message: 'This store already exists.'
      });
    } catch (error) {
      throw Error(`Error while registering a new store : ${error}`);
    }
  },

    
  async setStoreCompany(req, res) {
    try {
      const { storeId, owner_id } = req.body;
      // Push a store inside the company's stores: [] property
      const updateCompany = await Company.updateOne(
        { owner: owner_id},
        { $push: {stores: storeId}}
      );
      if (updateCompany) {
        return res.status(200).json({message: 'Store was transferred to its company'});
      } else {
        return res.status(400).json({message: 'Store was NOT transferred to its company'});
      }
    } catch (error) {
      return res.status(400).json({message: 'Error setting store company'});
    }
  },

  // Get a store by ID!
  async getStoreById(req, res) {
    // Get store ID from URL
    console.log('CONTROLLER: Params =', req.params);
    const { store_id } = req.params;
    try {
      const store = await Store.findById(store_id);
      // If visit exists, send the visit
      if (store) {
        return res.json(store);
      }
    } catch (error) {
      return res.status(400).json({message: 'Store Id does not exist!'});
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