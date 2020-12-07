const Store = require('../models/Store');

module.exports = {
    async increaseCount(req, res) {
        try {
            // Get store id from URL and amount from api call
            const { storeId, amount } = req.body;
            if (amount <= 0) {
                return res.status(200).json({
                    message: 'Required information is missing.'
                });
            }
            console.log("Increase amount = ", amount);
            // Get our store's current customer count
            const customerCount = await Store.findOneAndUpdate({_id: storeId}, {$inc: {"customerCount.currentCount": amount}});
            return res.json(customerCount);
        } catch (error) {
            return res.status(400).json({message: 'Store not found.'})
        }
    },
    
    async decreaseCount(req, res) {
        try {
            // Get store id from URL and amount from api call
            const { storeId, amount } = req.body;
            if (amount <= 0) {
                return res.status(200).json({
                    message: 'Required information is missing.'
                });
            }
            // amount = 0 - amount;
            console.log("Decrease amount = ", amount);
            // Get our store's current customer count
            const customerCount = await Store.findOneAndUpdate({_id: storeId}, {$inc: {"customerCount.currentCount": -amount}});
            return res.json(customerCount);
        } catch (error) {
            return res.status(400).json({message: 'Store not found.'})
        }
    }
}