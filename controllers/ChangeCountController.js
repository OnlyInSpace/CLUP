const Store = require('../models/Store');

module.exports = {
  async changeCount(req, res) {
    try {
      const { store_id, occupancyChangeValue, storeData } = req.body;

      if (occupancyChangeValue === 0) 
        return res.json({ message: 'Please enter a valid amount.' });
      
      // Ensure occupancy does not overflow
      if (occupancyChangeValue > 0) {
        if ((storeData.currentCount + occupancyChangeValue) > storeData.maxOccupants)
          return res.json({ message: 'Occupancy would overflow, please have the customer join queue.'});
      }
  
      // Ensure occupancy does not go negative
      if (occupancyChangeValue < 0) {
        if (storeData.currentCount + occupancyChangeValue < 0) 
          return res.json({ message: 'Current occupancy cannot be less than zero. Please enter a different amount' });
      }
      
      // Increment or decrement count based on value passed
      const store = await Store.findOneAndUpdate({_id: store_id}, {$inc: {'currentCount': occupancyChangeValue}}, {new: true});
      return res.status(200).json(store);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },
};