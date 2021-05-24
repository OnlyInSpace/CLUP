const Visit = require('../models/Visit');
const User = require('../models/User');
const Store = require('../models/Store');

module.exports = {
  // Create an async event
  async createVisit(req, res) {
    try {  
      // Get all info from body
      var { phoneNumber, user_id, scheduledDate, partyAmount, storeName, store_id, scheduledTime,
        avgVisitLength, maxPartyAmount, open24hours, businessHours, storeVisits } = req.body;
        



        
      if (!scheduledDate || scheduledDate === 'undefined')
        return res.json({ message: 'Please select a day.'});
        
      scheduledDate = new Date(scheduledDate);
      // Return hours and minutes in an array (Split the 24 time form: 15:36 into [15,36])
      const hoursMinutes = scheduledTime.split(':');
      // Set our date hours and minutes
      scheduledDate.setHours(parseInt(hoursMinutes[0]));
      scheduledDate.setMinutes(parseInt(hoursMinutes[1]));
        
      // Validating the scheduled visit is scheduled within AT LEAST avgVisitLength + 15 mins
      let currentMins = Math.floor(Date.now() / 60000);
      // Add average visit time plus 15 minutes to current time so that we ensure user's have enough time to have a reserved spot.
      currentMins += avgVisitLength * 1.75;
      let scheduledMins = Math.floor(Date.parse(scheduledDate) / 60000);


      // VALIDATION CHECKS       
      // Last validation checks of party size
      const isInt = /^\d+$/.test(partyAmount);
      const amount = parseInt(partyAmount);
      
      if (!isInt || amount <= 0) {
        return res.json({ message: 'Please enter a valid number for your party amount.'});
      } else if (amount > maxPartyAmount) {
        return res.json({ message: 'The maximum allowed members in a party is ' + maxPartyAmount});
      } else if (scheduledMins < currentMins) { // If the scheduled time is not ahead of current time + avgVisitLength + 15 mins
        return res.json({ message: 'Visits must be scheduled at least ' + (avgVisitLength + 15) + ' minutes from now'});
      }
      
      const scheduledDay = scheduledDate.getDay();
      let scheduledHours, businessDay, businessHoursMins, businessOpenHours, businessOpenMins, businessCloseHours, businessCloseMins;
      // Validating scheduled time falls within business hours.
      if (!open24hours) {
        // Get day of visit. Returns value 0-6 (Sun - Sat)
        // Get scheduled hours and scheduled mins
        scheduledHours = parseInt(hoursMinutes[0]);
        scheduledMins = parseInt(hoursMinutes[1]);     
        // Get business day and times 
        businessDay = businessHours[scheduledDay];
        businessHoursMins = businessDay.open.split(':');
        console.log('OpenTimes:', businessHoursMins);
        businessOpenHours = parseInt(businessHoursMins[0]);
        businessOpenMins = parseInt(businessHoursMins[1]);
        businessHoursMins = businessDay.close.split(':');
        console.log('CloseTimes:', businessHoursMins);
        businessCloseHours = parseInt(businessHoursMins[0]);
        businessCloseMins = parseInt(businessHoursMins[1]);
      }

      //************ Ensuring that the scheduled visit doesnt already exist for the same day, month, and year  ******************/
      // Here we ensure that visits can only be scheduled once for each day of the week.
      if (storeVisits) {
        const scheduledYMD = scheduledDate.toString().substr(0, 15);
        const scheduledHours = scheduledDate.getHours();
        const scheduledMins = scheduledDate.getMinutes();
          
        let visit, visitDate, visitUser;
        let visitYMD, visitHours, visitMins;

        for (let i = 0; i < storeVisits.length; i++) {
          visit = storeVisits[i];
          visitUser = visit.user;
          visitDate = new Date(visit.date);
          // Visit year, month, and day
          visitYMD = visitDate.toString().substr(0, 15);
          visitHours = visitDate.getHours();
          visitMins = visitDate.getMinutes();

          
          // Check if someone else has already scheduled for that exact time
          if ( scheduledYMD === visitYMD && visitHours === scheduledHours && visitMins === scheduledMins ) {
            return res.json({ message: 'Sorry, but someone else has already scheduled for this slot.'});
          }
          // Check if user has already scheduled for the same day
          if ( visitUser === user_id && scheduledYMD === visitYMD ) {
            return res.json({ message: 'Sorry, but you can only schedule a visit once per day. You can cancel your visit in \'My visits\' below'});
          }
        }
      }
      //*************End of same day check*********************/

      // ****SETTING OUR ACTUAL BUSINESS CLOSE TIMES WITH RESPECT TO THE AVERAGE VISIT LENGTH****
      // Check if store is open for that day
      if (!open24hours && !businessDay.open) {
        return res.json({ message: storeName + ' is closed for the day you\'re trying to schedule'});
      }  


      // If store closes at midnight, ensure the actual closing hour is set properly with respect to avgVisitLength
      if ( !open24hours && (businessCloseHours-1) < 0 ) {
        if ( (businessCloseMins - avgVisitLength) < 0 ) {
          businessCloseHours = 23;
        }
      } 
      
      // Set our actual business close mins with respect to avgVisitLength
      if ( !open24hours && (businessCloseMins-avgVisitLength) < 0 ) {
        businessCloseHours -= 1;
        businessCloseMins = 60 - (avgVisitLength - businessCloseMins);
      } else { // We can just subtract avgVisitLength to get actual closing mins with respect to visit length
        businessCloseMins -= avgVisitLength;
      }
      // *************END OF SETTING THE ACTUAL BUSINESS TIMES*************


      // BEGIN CHECKING IF SCHEDULED VISIT TIME FALLS WITHIN BUSINESS TIMES

      // Special cases: 
      //        --> When a business opens during the day and closes after midnight
      //        --> When a business closes at midnight

      // When a business opens during the day and closes after midnight add 23 hours to closeHours
      if ( !open24hours && businessOpenHours > businessCloseHours) {
        if ( (scheduledHours >= 0) && (scheduledHours <= businessCloseHours) ) {
          scheduledHours += 23;
        }
        businessCloseHours += 23;
      // If user is trying to schedule a visit within the CLOSING hour, ensure they aren't too LATE
      }
      if ( !open24hours && scheduledHours === businessCloseHours) { 
        if (scheduledMins > businessCloseMins) {
          return res.json({ message: 'Sorry, you can\'t schedule near closing time.'});
        }
      // If user is trying to schedule a visit within the OPENING hour, ensure they aren't too EARLY  
      } else if ( !open24hours && scheduledHours === businessOpenHours) {
        if (scheduledMins < businessOpenMins) {
          return res.json({ message: storeName + ' is closed for the time you\'re trying to schedule'});
        }
      // Ensure scheduled time is not too early  
      } else if ( !open24hours && (scheduledHours !== 0) && (scheduledHours < businessOpenHours)) { 
        return res.json({ message: storeName + ' is closed for the time you\'re trying to schedule'});
      // Ensure scheduled time is not too late  
      } else if ( !open24hours && (businessCloseHours !== 0) && (scheduledHours > businessCloseHours) ) {
        return res.json({ message: 'Sorry, you can\'t schedule near closing time or after business hours.'}); 
      }
    
      if (amount <= 0) {
        return res.json({ message: 'Required information is missing.'});
      }
      const userExists = await User.findById(user_id);
      // Display error if user does not exist
      if (!userExists) {
        return res.json({ message: 'User or store does not exist!'});
      }
      // Create the visit
      const visit = await Visit.create({
        phoneNumber,
        date: scheduledDate,
        partyAmount: amount,
        store: store_id,
        user: user_id
      });
      return res.status(200).json(visit);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },

  
  // Delete a visit
  async delete(req, res) {
    try {
      const { visitId } = req.params;
      if (visitId === 'undefined' || !visitId)
        return res.json({ message: 'Please select a visit to cancel.'});


      const visit = await Visit.findById(visitId);
      // If visit is reserved, make sure to decrement reserved partyAmount
      if ( visit.reserved ) {
        await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'upcomingVisits': -1}});
      }
      if ( visit.late ) {
        await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'lateVisits': -1}});
      }
      // delete visit
      await Visit.findByIdAndDelete(visitId);
      // 204 code: server succesfully fulfilled the request Delete
      return res.sendStatus(204);
            
    } catch (error) {
      return res.status(500).json({ error: error.toString() }); 
    }
  },


  // Confirm a visit
  async confirmVisit(req, res) {
    try {
      const { visit_id } = req.params;
      if (visit_id === 'undefined' || !visit_id)
        return res.json({ message: 'Please select a visit to confirm.'});

      const visit = await Visit.findById(visit_id);
      const store = await Store.findById(visit.store);
      // Ensure store occupancy does not overflow
      if (visit.partyAmount + store.currentCount > store.maxOccupants) {
        return res.json({message: 'Store will overflow.'});
      }

      // If visit is reserved, make sure to decrement reserved partyAmount
      if (visit.reserved ) {
        // if visit is late, decrement late visits
        if ( visit.late ) {
          await Store.findOneAndUpdate({_id: visit.store}, {$inc: {'lateVisits': -1}});
          // decrement upcoming visits by 1
          await Store.findByIdAndUpdate(visit.store, {$inc: {'upcomingVisits': -1}});
        }
      }

      // increment store occupancy
      await Store.findByIdAndUpdate(visit.store, {$inc: {'currentCount': visit.partyAmount}});
      // delete visit 
      await Visit.findByIdAndDelete(visit_id);
      return res.sendStatus(204);
      
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get a visit by ID!
  async getVisitById(req, res) {
    // Get visit ID from URL /visit/<visitid>
    const { visitId } = req.params;
    
    try {
      const visit = await Visit.findById(visitId);
      return res.status(200).json(visit);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all visits specific to only the user
  async getUserVisits(req, res) {
    // get user_id
    const { user_id } = req.params;

    try {
      // Return all visits tied to user at that store
      const visits = await Visit.find({'user': user_id});
      return res.status(200).json(visits);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all visits specific to only the user and a store
  async getUserStoreVisits(req, res) {
    // get user_id
    console.log(req.params);
    const { store_id, user_id } = req.params;

    try {
      // Return all visits tied to user at that store
      const visits = await Visit.find({'user': user_id, 'store': store_id});
      return res.status(200).json(visits);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all visits specific to only a store
  async getStoreVisits(req, res) {
    // get user_id
    const { store_id } = req.params;
  
    try {
      // Return all visits tied to that store
      const visits = await Visit.find({ 'store': store_id });
      return res.status(200).json(visits);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },


  // Get all visits
  async getAllVisits(req, res) {
    // get user_id  
    try {
      // Return all visits tied to user at that store
      const visits = await Visit.find({});
      return res.status(200).json(visits);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  }
};