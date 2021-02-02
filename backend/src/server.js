// Import express and mongoose
const express = require('express');
const mongoose = require('mongoose');
// cors allows us to do requests from different devices without compromise
const cors = require('cors');
const routes = require('./routes');
const app = express();
const cron = require('node-cron');
// For checking our visits every 15 mins
const Visit = require('./models/Visit');
const Store = require('./models/Store');



// This line is needed for later deployment
const PORT = process.env.PORT || 8000;

// If we are NOT starting our server as a development environment, then import our .env 
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Telling the app to use cors, express.json, and routes
app.use(cors());
app.use(express.json());
app.use(routes);

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



cron.schedule('*/1 * * * *', async () => {
  try {
    // get current time and convert to minutes
    let currentTime = Math.floor(Date.now() / 60000);
    console.log('currentTime:', currentTime);
    // Return all visits
    const visits = await Visit.find({});
    visits.forEach(visit => updateVisits(visit, currentTime));

    console.log('running a task every minute');
  } catch (error) {
    console.log(error);
  }
});


async function updateVisits(visit, currentTime) {
  // get the time of visit in minutes
  let timeOfVisit = Math.floor(Date.parse(visit.date) / 60000);
  // Calculate time difference
  let timeDifference = timeOfVisit - currentTime;
  console.log(timeDifference);

  // if time of visit is within 45 minutes, then reserve user's party by incrementing current count by partyAmount
  if (timeDifference <= 45 && !visit.reserved ) {
    await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'currentCount': visit.partyAmount}});
    await Visit.findOneAndUpdate({_id: visit._id}, {'reserved': true});
  }

  // If timeOfVisit is 15 minutes or more late, then delete visit in database and unreserve the party
  if (timeDifference <= -15) {
    await Visit.findByIdAndDelete(visit._id);
    await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'currentCount': -visit.partyAmount}});
    console.log('late and deleted! Decrement of:', -visit.partyAmount);
  }
}





// Listen for whatever PORT is set
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});