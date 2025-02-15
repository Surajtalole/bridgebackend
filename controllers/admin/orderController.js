const Order = require('../../model/Order');

exports.getOrders = async (req, res) =>{
    try{
        const orders = await Order.find();
        res.json(orders);
    }catch(error){
        res.status(500).json({message: "Error fetching orders"})
    }
};