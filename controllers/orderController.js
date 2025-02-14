const Order = require('../model/Order');
const Student = require('../model/Student'); // Import the Student model
const { v4: uuidv4 } = require('uuid');

exports.createOrder = async (req, res) => {
  const { productName, coin, customerAddress, customerMobileNo, customerName } = req.body;
  const customerId = req.user?._id; 
  console.log("customerId", customerId);

  if (!productName || !coin || !customerAddress || !customerMobileNo) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const student = await Student.findById(customerId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (student.profile.coins < coin) {
      return res.status(400).json({ message: 'Insufficient coins to place the order.' });
    }

    student.profile.coins -= coin;

    await student.save();

    const newOrder = new Order({
      orderId: uuidv4(),
      productName,
      coin,
      customerId,
      customerName,
      customerAddress,
      customerMobileNo,
    });

    await newOrder.save();

    res.status(201).json({
      message: 'Order placed successfully!',
      order: newOrder,
      remainingCoins: student.profile.coins, 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

exports.getOrderCount = async (req, res) => {
  try {
    const customerId = req.user._id; // Assuming the user ID is stored in req.user._id after authentication
    console.log('Customer ID:', customerId); // Log the customer ID for debugging

    if (!customerId) {
      return res.status(400).json({ message: 'Customer not authenticated' });
    }

    // Count the number of orders placed by the current user
    const count = await Order.countDocuments({ customerId });

    console.log('Orders Count:', count); // Log the number of orders
    res.json({ count }); // Return the count in the response
  } catch (err) {
    console.error('Error fetching orders count:', err); // Log any error
    res.status(500).json({ message: 'Server error' });
  }
};