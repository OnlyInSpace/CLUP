const Visit = require('../models/Visit');
const User = require('../models/User');
const Store = require('../models/Store');

module.exports = {
    // Create an async event
    async createVisit(req, res) {
        // Get all info from body
        const {date, approved, partyAmount } = req.body;
        // Get the user's ID from API headers
        const { user_id } = req.headers;
        // Get store's ID from URL 
        const { storeId } = req.params;

        try {
            // Check if store and user actually exist
            const store = await Store.findById(storeId);
            const user = await User.findById(user_id);
            // Display error if user does not exist
            if (!user || !store) {
                return res.status(400).json({message: 'User or store does not exist!'});
            }
            // Check if visit already exists
            const visitExists = await Visit.findOne({'user': user_id, 'store': storeId});
            if (visitExists) {
                return res.status(400).json({message: 'Visit already exists'});
            }
    
            // Create the visit
            const visit = await Visit.create({
                date,
                approved,
                partyAmount,
                store: storeId,
                user: user_id
            });
            // Now we populate the visit with a store and user object given their id's
            // await visit
            //     .populate('store')
            //     .populate('user')
            //     .execPopulate();
            // Send the visit
            return res.json(visit);
        } catch (error) {
            throw Error(`Error creating a new visit : ${error}`)
        }
    },

    // Delete a visit
    async delete(req, res) {
        const { visitId } = req.params;
        try {
            await Visit.findByIdAndDelete(visitId);
            // 204 code: server succesfully fulfilled the request Delete
            return res.status(204).send();
            
        } catch (error) {
            return res.status(400).json({message: 'No visit found with that ID'});

        }
    }
}