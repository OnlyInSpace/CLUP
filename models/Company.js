const mongoose = require('mongoose');

// Setup a company object via mongoose schema
// Each company will have an array of stores and an owner
const CompanySchema = new mongoose.Schema({
  companyName: String,
  // Owner = a user _id
  ownerId: String,
});

module.exports = mongoose.model('Company', CompanySchema);