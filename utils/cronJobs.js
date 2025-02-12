const cron = require("node-cron");
const Payment = require("../model/Payments");  // Adjust the path to the Payment model as needed
const processPayout = require("../utils/processPayout");  // Import the processPayout function if it's in a separate file
const Student = require("../model/Student"); // Import Student model


const scheduleDailyPayoutCheck = () => {
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily payout check...");
  const paymentsDue = await Payment.find({
    status: "success",
    scheduledTransferDate: { $lte: new Date() },
  });

  for (const payment of paymentsDue) {
    await processPayout(payment);  // Replace with actual function for payout processing
  }
});


// Schedule the job to run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Checking for overdue payments...");

  const today = moment().format("YYYY-MM-DD");

  await Student.updateMany(
    { 
      "batchDetails.fees.dueDate": { $lt: today }, 
      "batchDetails.fees.paymentStatus": { $ne: "paid" } 
    },
    { 
      $set: { "batchDetails.$[].fees.paymentStatus": "due" } } // Update all batchDetails
  );

  console.log("Updated overdue payments to 'due'.");
});
}
module.exports = scheduleDailyPayoutCheck