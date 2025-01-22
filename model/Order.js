const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  coin: { type: Number, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerAddress: { type: String, required: true },
  customerMobileNo: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Orders', orderSchema);