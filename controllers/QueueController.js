const Store = require('../models/Store');

module.exports = {

  async appendUser(req, res) {
    try {
      const { customer, store_id, storeData } = req.body;

      // Validation checks of party size
      const isInt = /^\d+$/.test(customer.partyAmount);
      
      if (!isInt || customer.partyAmount <= 0) {
        return res.json({ message: 'Please enter a valid number for your party.' });
      } else if (customer.partyAmount > storeData.maxPartyAllowed) {
        return res.json({ message: 'Max party allowed is ' + storeData.maxPartyAllowed });
      }

      const store = await Store.findById(store_id);
      const queue = store.queue;

      let cont = true;
      let item;
      // Iterate through store's queue and ensure we are not appending an existing user
      for ( var i=0; i < queue.length; i++) {
        item = queue[i];
        if (customer.email === item.email) {
          cont = false;
          break;
        }
      }
      // Alert frontend that user is already in queue
      if (!cont) return res.json({message: 'You are already in the queue. Look out for an email from us once it\'s your turn. \nYour email: ' + customer.email});
      // If not in queue yet, go ahead and append user 
      Store.findByIdAndUpdate(store_id, { $push : {'queue': [customer] }}, {new: true},
        function(err, result) {
          if (err) {
            return res.status(500).json({ error: err.toString() });
          } else {
            return res.status(200).json(result);
          }
        }
      );

    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },
  

  async popUser(req, res) {
    try {
      const { store_id } = req.body;

      const store = await Store.findById(store_id);
      if (store.queue.length === 0)
        return res.json({ message: 'There is no queue.'});

      const head = store.queue[0];
      // Ensuring store does not overflow when trying to move queue forward
      if (store.currentCount + parseInt(head.partyAmount) > store.maxOccupants) {
        return res.json({message: 'Occupancy would overflow, please wait for more customers to leave.'});
      }

      await Store.findByIdAndUpdate(store_id, { $inc: {'currentCount': head.partyAmount}} );
      // Pop the first element of a store's queue
      Store.findByIdAndUpdate(store_id, { $pop : {'queue': -1 } }, { new: true },
        function(err, result) {
          if (err) {
            res.status(500).json({ error: err.toString() });
          } else {
            res.status(200).json(result);
          }
        }
      );

    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },

  async skipUser(req, res) {
    try {
      const { store_id } = req.body;
      const store = await Store.findById(store_id);

      if (store.queue.length === 0)
        return res.json({ message: 'There is no queue.'});

      Store.findByIdAndUpdate(store_id, { $pop : {'queue': -1 } }, { new: true },
        function(err, result) {
          if (err) {
            res.status(500).json({ error: err.toString() });
          } else {
            res.status(200).json(result);
          }
        }
      );

    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  }
};