const Store = require('../models/Store');

module.exports = {

    // Create an async event
    async createStore(req, res) {
        try {
            // console.log(req.body)
            const {name, hours, location, customerCount} = req.body;
            const address = location.address;
            // Check if store exists
            const existingStore = await Store.findOne({'name': name, 'location.address': address});
            if (!existingStore) {
                // Create a new store with await
                const store = await Store.create({
                    name,
                    hours,
                    location,
                    customerCount
                });
                // Respond by sending the store back
                return res.json(store);
            }
            // Else if store exists, display message.
            return res.status(400).json({
                message: 'This store already exists.'
            });
        } catch (error) {
            throw Error(`Error while registering a new store : ${error}`)
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
                return res.json(store)
            }
        } catch (error) {
            return res.status(400).json({message: 'Store Id does not exist!'})
        }
    },

    // Get all stores
    async getAllStores(req, res) {
        try {
            // Return all stores from Store model
            const store = await Store.find({});
            // If stores exist, send the stores 
            if (store) {
                return res.json(store);
            }
        } catch (error) {
            return res.status(400).json({message: 'No comapnies exist.'});
        }
    }
}