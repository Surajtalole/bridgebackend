const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  orderId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the User model
  venderId: { type: mongoose.Schema.Types.ObjectId, ref: 'coach' }, // Reference to the User model
  status: { type: String, required: true },

  //total fee 
  totalamount:{type: Number},

  //redeemed coins/rupee
  redeemedamount:{type: Number },

  //amount which student paid after redeem
  amount: { type: Number, required: true },  
  scheduledTransferDate: {type:Date},
  vendorPaymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  paymentFor:{ type: String},
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);

