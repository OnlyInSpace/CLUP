const mongoose = require('mongoose');

// Setup a visit object via mongoose schema
const VisitSchema = new mongoose.Schema({
  date: Date,
  partyAmount: Number,
  // Store id tied to visit
  store: String,
  // User id tied to the visit
  user: String,
  reserved: Boolean
});

module.exports = mongoose.model('Visit', VisitSchema);