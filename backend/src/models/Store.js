const mongoose = require('mongoose');

// Setup a store object via mongoose schema
// All stores are stored under a Company schema
const StoreSchema = new mongoose.Schema({
  storeName: String,
  // Queue will hold array of userid's
  queue: [{
    type: String
  }],
  // hours: {                
  //     "openTimes": [],    // openTimes:  [1200, 1400, 1400, 1400, 1400, 1400, 1400]
  //     "closeTimes": []    // closeTimes: [2000, 2200, 2200, 2200, 2200, 2200, 2200]
  // },
  location: {
    'city': String,
    'state': String,
    'address1': String,
    'address2': String,
    'postalCode': String
  },
  currentCount: {
    type: Number,
    default: 0
  },
  maxOccupants: Number,
  maxPartyAllowed: Number,
  visitsScheduled: [{
    type: String
  }],
  employees: [{
    type: String
  }]
});

module.exports = mongoose.model('Store', StoreSchema);