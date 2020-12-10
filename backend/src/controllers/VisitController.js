const Visit = require('../models/Visit');
const User = require('../models/User');
const Store = require('../models/Store');
const { store } = require('./LoginController');

module.exports = {
    //TODO: Ensure user does not go over Store.maxPartyAllowed
    // Create an async event
    async createVisit(req, res) {
        // Get all info from body
        console.log("\nCONTROLLER\n")
        console.log("req.body:", req.body);
        const { scheduledDate, partyAmount, store_id } = req.body;
        const { user_id } = req.headers;

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
                console.log("visit Exists!", visitExists);
                return res.status(200).json({message: 'Visit already exists'});
            }
            // Else: 
            // Create the visit
            const visit = await Visit.create({
                date: scheduledDate,
                partyAmount,
                store: store_id,
                user: user_id
            });
            console.log("newly created visit:", visit);

            // // populate our visit with its respective store object, only returning the store's location.
            // await visit
            //     .populate('store', 'storeName')
            //     .execPopulate();

            // Send the visit
            console.log("Visit:", visit);
            return res.json(visit);
        } catch (error) {
            throw Error(`Error creating a new visit : ${error}`)
        }
    },

    async setVisitStore(req, res) {
        try {
            const { visit_id, store_id } = req.body;
            // Push a visit inside the store visitsScheduled: [] property
            const updateStore = await Store.updateOne(
                { _id: store_id},
                { $push: {visitsScheduled: visit_id}}
            );
            if (updateStore) {
                return res.status(200).json({message: 'Store was transferred to its company'})
            } else {
                return res.status(400).jsaon({message: 'No store found.'})
            }
        } catch (error) {
            return res.status(400).json({message: 'Visit ID or Store ID not correct'})
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
            return res.status(200).json({message: 'Visit Id does not exist!'})
        }
    },

    // Get all visits specific to only the user
    async getAllVisits(req, res) {

        // // Do i have a user_id or store_id? No, then return all visits
        // const query_store = store_id ? { store_id } : {};
        // const query_user = user_id ? { user_id } : {};
        // console.log("\nstoreId: " + store_id + "\nuserId: " + user_id);

        const { user_id } = req.params;

        try {
            // Return all visits tied to user at that store
            const visits = await Visit.find({'user': user_id});
            // If visits exist, send the visits
            if (visits) {
                return res.json(visits);
            }
        } catch (error) {
            return res.status(400).json({message: 'No visits are scheduled.'})
        }
    }
}