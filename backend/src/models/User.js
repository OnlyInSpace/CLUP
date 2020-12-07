const mongoose = require('mongoose');

// Setup a user via mongoose
const UserSchema = new mongoose.Schema({
    phoneNumber: String,
    email: String,
    password: String,
    pin: {
        type: Number,
        default: 0
    },
    permissions: {
        type: String,
        default: 'user',
        enum: ['user', 'employee', 'manager','owner']
    },
});

module.exports = mongoose.model('User', UserSchema);