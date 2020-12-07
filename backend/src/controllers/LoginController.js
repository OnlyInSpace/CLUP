const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { response } = require('express');

//TODO: Generate a secret for json web token

module.exports = {
    async store(req, res) {
        try {
            // Get email and password from body
            console.log(req.body);
            const {email, password} = req.body;
            // If email or password field are empty
            if (!email || !password) {
                return res.status(200).json({message: 'Required field(s) missing'})
            }
            
            // Get user
            const user = await User.findOne({email});
            // If user does not exist, display error message
            if (!user) {
                return res.status(200).json({message: 'User not found, register instead?'})
            }

            // Else if user exists and the password matches what's in the database
            // Then create userResponse object to be stored in cookies
            if (user && await bcrypt.compare(password, user.password)) {
                const userResponse = {
                    _id: user._id,
                    email: user.email
                }
                // return jwt.sign({ user: userResponse }, process.env.JWT_SECRET, expiresIn (err, token) => {
                //     return response.json({
                //         user: token,
                //         user_id: userResponse._id
                //     })
                // })
                return res.json(userResponse);
            } else {
                return res.status(200).json({message: 'Email or Password does not match'})
            }

        } catch (error) {
            throw Error(`Error while trying to Authenticate a User ${error}`);
        }
    }

}
