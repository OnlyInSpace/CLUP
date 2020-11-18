const mongoose = require('mongoose');

// Setup a store object via mongoose schema
// All stores are stored under a Company schema
const StoreSchema = new mongoose.Schema({
    name: String,
    queue: [],
    hours: {                
        "openTimes": [],    // openTimes:  [1200, 1400, 1400, 1400, 1400, 1400, 1400]
        "closeTimes": []    // closeTimes: [2000, 2200, 2200, 2200, 2200, 2200, 2200]
    },
    location: {
        "city": String,
        "state": String,
        "address": String,
        "postalCode": String
    },
    customerCount: {
        "currentCount": Number,
        "maxOccupants": Number
    },
    employees: [{
        type: String
    }]
});

module.exports = mongoose.model('Store', StoreSchema);