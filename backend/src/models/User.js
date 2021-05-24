const mongoose = require('mongoose');

// Setup a user via mongoose
const UserSchema = new mongoose.Schema({
  phoneNumber: String,
  email: String,
  password: String,
  refreshToken: String,
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  clockedIn: {
    type: Boolean,
    default: false
  },
  business_id: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'employee', 'manager', 'owner']
  }
});

module.exports = mongoose.model('User', UserSchema);