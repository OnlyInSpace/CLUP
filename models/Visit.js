const mongoose = require('mongoose');

// Setup a visit object via mongoose schema
const VisitSchema = new mongoose.Schema({
  phoneNumber: String,
  date: Date,
  partyAmount: Number,
  // Store id tied to visit
  store: String,
  // User id tied to the visit
  user: String,
  late: {
    type: Boolean,
    default: false
  },
  reserved: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Visit', VisitSchema);