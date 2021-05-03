const Store = require('../models/Store');

module.exports = {

  async appendUser(req, res) {
    try {
      const { customer, store_id } = req.body;
      const store = await Store.findById(store_id);
      const queue = store.queue;

      let cont = true;
      let item;
      // Iterate through store's queue and ensure we are not appending an existing user
      for ( var i=0; i < queue.length; i++) {
        item = queue[i];
        if (customer.phoneNumber === item.phoneNumber) {
          cont = false;
          break;
        }
      }
      // Alert frontend that user is already in queue
      if (!cont) return res.json({message: 'User exists in queue.'});
      // If not in queue yet, go ahead and append user 
      Store.findByIdAndUpdate(store_id, { $push : {'queue': [customer] } },
        function(err, result) {
          if (err) {
            res.send(err);
          } else {
            res.send(result);
          }
        }
      );

    } catch (error) {
      return res.status(400).json({message: 'Error pushing user to queue'});
    }
  },
  

  async popUser(req, res) {
    try {
      const { store_id } = req.body;

      const store = await Store.findById(store_id);
      const head = store.queue[0];
      console.log(head);
      // Ensuring store does not overflow when trying to move queue forward
      if (store.currentCount + parseInt(head.partyAmount) > store.maxOccupants) {
        return res.json({message: 'Store would overflow.'});
      }

      await Store.findByIdAndUpdate(store_id, { $inc: {'currentCount': head.partyAmount}} );

      // Pop the first element of a store's queue
      Store.findByIdAndUpdate(store_id, { $pop : {'queue': -1 } }, { new: true },
        function(err, result) {
          if (err) {
            res.send(err);
          } else {
            res.send(result);
          }
        }
      );

    } catch (error) {
      return res.status(400).json({message: 'Error popping user from queue'});
    }
  },

  async skipUser(req, res) {
    try {
      const { store_id } = req.body;

      Store.findByIdAndUpdate(store_id, { $pop : {'queue': -1 } }, { new: true },
        function(err, result) {
          if (err) {
            res.send(err);
          } else {
            res.send(result);
          }
        }
      );

    } catch (error) {
      return res.status(400).json({message: 'Error popping user from queue'});
    }
  }
  
};