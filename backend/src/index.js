const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
// cors allows us to do requests from different devices without compromise
const cors = require('cors');
const routes = require('./routes');

// Listen for whatever PORT is set
const app = express();

// Telling the app to use cors, express.json, and routes
app.use(cors());
app.use(express.json());
app.use(routes);

// Connecting our database
try {
  mongoose.connect(process.env.MONGO_DB_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  });
  console.log('MongoDB connected sucessfully!');
} catch (error) {
  console.log(error);
}

module.exports = app;