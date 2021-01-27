const mongoose = require('mongoose');

// Setup a user via mongoose
const UserSchema = new mongoose.Schema({
  phoneNumber: String,
  email: String,
  password: String,
  timesSkipped: {
    type: Number,
    default: 0
  },
  employee_store_id: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'employee', 'manager','owner']
  },
  pin: {
    type: Number,
    default: 0
  },
  refreshToken: String
});

module.exports = mongoose.model('User', UserSchema);