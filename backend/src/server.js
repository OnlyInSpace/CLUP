const express = require('express');
const mongoose = require('mongoose');
// cors allows us to do requests from different devices without compromise
const cors = require('cors');
const routes = require('./routes');
const app = express();

// This line is needed for later deployment
const PORT = process.env.PORT || 8000;

// If we are starting our server as a development environment, then import our .env 
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

app.use(cors());
app.use(express.json());

// Connecting our database
try {
  mongoose.connect(process.env.MONGO_DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  });
  console.log('MongoDB connected sucessfully!');
} catch (error) {
  console.log(error);
}

app.use(routes);

// Listen for whatever PORT is got set
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});