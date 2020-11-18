const Visit = require('../models/Visit');

module.exports = {
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
                return res.status(400).json({message: 'Visit Id does not exist!'})
            }
        },
    
        // Get all visits
        async getAllVisits(req, res) {
            try {
                // Return all visits from visit model
                const visits = await Visit.find({});
                // If visits exist, send the visits
                if (visits) {
                    return res.json(visits)
                }
            } catch (error) {
                return res.status(400).json({message: 'No visits are scheduled.'})
            }
        }
}