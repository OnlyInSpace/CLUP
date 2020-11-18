const mongoose = require('mongoose');

// Setup a visit object via mongoose schema
const VisitSchema = new mongoose.Schema({
    date: Date,
    approved: Boolean,
    partyAmount: Number,
    store: String,
    user: String
});

module.exports = mongoose.model('Visit', VisitSchema);