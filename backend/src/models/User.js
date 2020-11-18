const mongoose = require('mongoose');

// Setup a user via mongoose
const UserSchema = new mongoose.Schema({
    phoneNumber: String,
    email: String,
    password: String,
    permissions: {
        companyId: String,
        type: String,
        default: 'user',
        enum: ['user', 'manager','owner']
    },
    accessToken: String
});

module.exports = mongoose.model('User', UserSchema);