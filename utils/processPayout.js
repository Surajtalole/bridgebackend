const Razorpay = require("razorpay");
const Coach = require("../model/Coach"); 
const Payment = require("../model/Payments"); 

require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
console.log("Razorpay instance:", process.env.RAZORPAY_KEY_ID);
console.log("Razorpay instance:", process.env.RAZORPAY_KEY_SECRET);

async function processPayout(paymentDetails) {
    try {
      const vendor = await Coach.findById(paymentDetails.venderId);
      if (!vendor || !vendor.bankDetails) {
        throw new Error("Vendor bank account details not found.");
      }
  
      const payoutOptions = {
        account_number: process.env.ADMIN_ACCOUNT_NUMBER, 
        amount: paymentDetails.totalamount * 100, 
        currency: "INR",
        mode: "UPI",
        purpose: "Vendor Payment",
        queue_if_low_balance: true,
        reference_id: `payout_${paymentDetails.paymentId}`,
        narration: `Payment to Vendor - ${vendor.name}`,
        notes: { orderId: paymentDetails.orderId },
        fund_account: {
          account_type: "bank_account",
          contact_id: vendor.contactId,
          bank_account: vendor.bankDetails,
        },
      };
  
      console.log("Payout options:", payoutOptions);
  
      const payout = await razorpay.request({
        method: "POST",
        url: "/payouts",
        data: payoutOptions,
      });
  
      console.log("Payout successful:", payout);
  
      paymentDetails.vendorPaymentStatus = "completed";
      await paymentDetails.save();
  
      return payout;
    } catch (error) {
      console.error("Payout processing failed:", error);
  
      paymentDetails.vendorPaymentStatus = "failed";
      await paymentDetails.save();
  
      throw error;
    }
  }
  
  

module.exports = { processPayout };
