const cron = require("node-cron");
const Payment = require("../model/Payments");  // Adjust the path to the Payment model as needed
const processPayout = require("../utils/processPayout");  // Import the processPayout function if it's in a separate file

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
}
module.exports = scheduleDailyPayoutCheck