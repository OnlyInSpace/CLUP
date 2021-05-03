const Store = require('../models/Store');

module.exports = {
  async changeCount(req, res) {
    try {
      // Get store id from URL and amount from api call
      const { store_id, amount } = req.body;
      
      // Get our store's current customer count
      const store = await Store.findOneAndUpdate({_id: store_id}, {$inc: {'currentCount': amount}});
      return res.json(store);
    } catch (error) {
      return res.status(400).json({message: 'Store not found.'});
    }
  },
};