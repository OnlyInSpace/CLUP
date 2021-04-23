const User = require('../models/User');
const Store = require('../models/Store');

module.exports = {

  async appendUser(req, res) {
    try {
      const { customer, store_id } = req.body;
      console.log('customer:', customer);


      const store = await Store.findById(store_id);


      const queue = store.queue;

      let cont = true;
      let item;

      for ( var i=0; i < queue.length; i++) {
        item = queue[i];
        if (customer.phoneNumber === item.phoneNumber) {
            cont = false;
            break;
        }
      }

      if (!cont) return res.json({message: 'User exists in queue.'});

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
      let { store_id } = req.body;

      Store.findByIdAndUpdate(store_id, { $pop : {'queue': -1 } },
        function(err, result) {
          if (err) {
            res.send(err);
          } else {
            res.send(result);
          }
        }
      );

    } catch (error) {
      return res.status(400).json({message: 'Error popping user to queue'});
    }
  },
  
};