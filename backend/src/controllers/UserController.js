const User = require('../models/User');
const bcrypt = require('bcrypt');

module.exports = {
    // Async function means that we make a connection with the server and need to AWAIT
    async createUser(req, res) {
        try {
            //console.log(req.body)
            const {phoneNumber, email, password} = req.body;
            // Check if user exists
            const existingUser = await User.findOne({email});
            if (!existingUser) {
                // Hash the password with bcrypt module
                const hashedPassword = await bcrypt.hash(password, 10);
                // Create a new user with await
                const user = await User.create({
                    phoneNumber,
                    email,
                    password: hashedPassword
                });
                // Respond by sending the user
                return res.json(user)
            }
            // Else if user exists, display message.
            return res.status(400).json({
                message: 'This email already exists. Try logging in?'
            });
        } catch (error) {
            throw Error(`Error while registering a new user : ${error}`)
        }
    },

    async getUserById(req, res) {
        // Get user ID
        const { userId } = req.params;
        
        try {
            // Find user via mongoDB object ID using the model
            const user = await User.findById(userId);
            return res.json(user);
        } catch (error) {
            return res.status(400).json({
                message: 'User ID does not exist, register instead?'
            });
        }

    },

    // Get all users
    async getAllUsers(req, res) {
        try {
            // Return all visits from visit model
            const users = await User.find({});
            // If visits exist, send the visits
            if (users) {
                return res.json(users)
            }
        } catch (error) {
            return res.status(400).json({message: 'No users found.'})
        }
    }
}