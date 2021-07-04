const mongoose = require('mongoose');

// Setup a store object via mongoose schema
// All stores are stored under a Company schema
const StoreSchema = new mongoose.Schema({
  company_id: String,
  storeName: String,
  // Queue will hold array of userid's
  queue: [{}],
  lateVisits: {
    type: Number,
    default: 0
  },
  upcomingVisits: {
    type: Number,
    default: 0
  },
  location: {
    city: String,
    state: String,
    address1: String,
    address2: String,
    postalCode: String
  },
  currentCount: {
    type: Number,
    default: 0
  },
  maxOccupants: Number,
  maxPartyAllowed: Number,
  avgVisitLength: Number,
  open24hours: {
    type: Boolean,
    default: false
  },
  businessHours: { 
    sunday: {
      day: String, 
      open: String,
      close: String
    },
    monday: {
      day: String, 
      open: String,
      close: String
    },
    tuesday: {
      day: String, 
      open: String,
      close: String
    },
    wednesday: {
      day: String, 
      open: String,
      close: String
    },
    thursday: {
      day: String, 
      open: String,
      close: String
    },
    friday: {
      day: String, 
      open: String,
      close: String
    },
    saturday: {
      day: String, 
      open: String,
      close: String
    }           
  }
});

module.exports = mongoose.model('Store', StoreSchema);