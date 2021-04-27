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


// Twilio setup
const accountSid = 'AC0ea3fddea1f7c73c4c6e52f781faa95e'; 
const authToken = '8bef6e0919178da4379fde875463e79a'; 
const client = require('twilio')(accountSid, authToken); 


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
    // Return all visits from database in an array
    const visits = await Visit.find({});
    // For each visit in array, check if visit is late and delete if so
    visits.forEach(visit => updateVisits(visit));

    // Send SMS alerts
    const stores = await Store.find({});
    stores.forEach(store => sendSMS(store));

    console.log('running a task every minute');
  } catch (error) {
    console.log(error);
  }
});


async function updateVisits(visit) {
  try {
    // get current time and convert to minutes
    let currentTime = Math.floor(Date.now() / 60000);
    // get the time of visit in minutes
    let timeOfVisit = Math.floor(Date.parse(visit.date) / 60000);
    // Calculate time difference
    let timeDifference = timeOfVisit - currentTime;
  
    // Get store's average visit length
    const store = await Store.findById(visit.store);
  
    // this offset is needed to ensure a user's party gets reserved in the system before their visit 
    let visitLengthOffset = store.avgVisitLength * 2;
    if (store.avgVisitLength <= 10) {
      visitLengthOffset += 5;
    } else if (store.avgVisitLength <= 20) {
      visitLengthOffset += 10;
    } else if (store.avgVisitLength <= 30) {
      visitLengthOffset += 20;
    } else if (store.avgVisitLength <= 60) {
      visitLengthOffset += 30;
    } else {
      visitLengthOffset += 40;
    } 

    // if time of visit is within avg visit length plus 15 minutes, then reserve user's party by incrementing current count by partyAmount
    if (!visit.reserved && timeDifference <= visitLengthOffset ) {
      await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'upcomingVisits': 1}});
      await Visit.findOneAndUpdate({_id: visit._id}, {'reserved': true});
    }
  
    // If timeOfVisit is -15 minutes or more late, then mark visit as late in the database and increment late visits
    if (!visit.late && timeDifference <= -15) {
      await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'lateVisits': 1}});
      await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'upcomingVisits': -1}});
      await Visit.findByIdAndUpdate({_id: visit._id}, {'late': true});
    }
  } catch (error) {
    console.log(error);
    console.log('error in updateVisits server.js');
  }
}


// updating an array of documents
// https://docs.mongodb.com/manual/reference/operator/update/positional/#mongodb-update-up.-
async function sendSMS(store) {
  try {
    
    // if store doesn't have a queue, then just exit
    if (store.queue.length === 0) {
      return;
    }

    // head of queue
    let head = store.queue[0];

    // If head of queue has been alerted, set their minsLate to (current time - their start time)
    if (head.alerted) {
      // get current time and convert to minutes
      let currentTime = Math.floor(Date.now() / 60000);
      // get the start time of being at head of queue in minutes
      let startTime = Math.floor(head.startTime / 60000);

      // Calculate time difference
      let timeDifference = startTime - currentTime;
      
      // set their minsLate to the time difference
      await Store.updateOne(
        {_id: store._id, 'queue.phoneNumber': head.phoneNumber },
        { $set: { 'queue.$.minsLate': timeDifference} }
      );

    }

    // If customer at head of queue has not been alerted, then send them an SMS and set their alerted proerty to true
    if (!head.alerted) {
      // Update their alerted property to true
      const setAlerted = await Store.updateOne(
        {_id: store._id, 'queue.phoneNumber': head.phoneNumber },
        { $set: { 'queue.$.alerted': true} }
      );

      console.log('sending message');
      // Send text message to first person in queue
      if (setAlerted) {
        client.messages 
          .create({ 
            body: '\nCLUP ALERT: \n\nYou are next in line at ' + store.storeName + 
                  '\n\nPlease walk into the entrance of the store within 15 minutes of getting this message or you might lose your spot!' + 
                  '\n\nHave a nice day,\nThank you',  
            messagingServiceSid: 'MGb2a42db17b3508e4802e24b44a94bcd3',      
            to: '+1' + head.phoneNumber 
          }) 
          .then(message => console.log(message.sid)) 
          .done();

        // Once alerted, set their start time to the current time
        await Store.updateOne(
          {_id: store._id, 'queue.phoneNumber': head.phoneNumber },
          { $set: { 'queue.$.startTime': Date.now()} }
        );
      }
    }
  
  
  } catch (error) {
    console.log(error);
    console.log('error in sendSMS server.js');
  }
}


// Listen for whatever PORT is set
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});