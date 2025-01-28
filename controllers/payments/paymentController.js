const Razorpay = require("razorpay");
const Payment = require("../../model/Payments");
const Student = require("../../model/Student");
const Batch = require("../../model/Batch");
const Academy = require("../../model/Academies");
const Coach = require("../../model/Coach");
const Invoice = require("../../model/Invoice");
const mongoose = require("mongoose");
const uploadInvoice = require("../ftpController/invoiceToFtp");
const TrialRequest = require("../../model/TrialRequest");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const schedule = require("node-schedule");
const { addDays } = require("date-fns");
const {processPayout}= require("../../utils/processPayout");
require("dotenv").config();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  const { amount } = req.body;
  console.log("amount", amount);
  try {
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `order_rcptid_${new Date().getTime()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    console.log("order", order);
    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

exports.verifyPayment = async (req, res) => {
  const {
    paymentId,
    orderId,
    signature,
    amount,
    redeemedamount,
    totalamount,
    selectedBatch,
    paymentFor,
  } = req.body;

  console.log("req.body", req.body);

  try {
    const body = orderId + "|" + paymentId;
    console.log("Body for HMAC calculation:", body);

    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature === signature) {
      console.log("Signatures match. Payment verified.");
      if (!amount) {
        console.log("Error: Amount is missing");
        return res
          .status(400)
          .json({ success: false, message: "Amount is required" });
      }

      const amountInNumber =
        typeof amount === "string"
          ? parseFloat(amount.replace(/[₹,]/g, ""))
          : amount;

      console.log("Processed amount:", amountInNumber);

      let owner = null;
      let scheduledTransferDate = null;

      if (paymentFor === "Batch Enroll") {
        const academyId = selectedBatch?.academyId;
        console.log("academyId", academyId);

        const academy = await Academy.findById(academyId);
        console.log("academy", academy);

        if (academy) {
          owner = await Coach.findById(academy.owner);
          console.log("owner", owner);

          if (owner) {
            function addMinutes(date, minutes) {
              const result = new Date(date);
              result.setMinutes(result.getMinutes() + minutes);
              return result;
            }

            scheduledTransferDate = addMinutes(new Date(), 1);
            console.log("Scheduled Transfer Date:", scheduledTransferDate);

            // Schedule the payout
            schedule.scheduleJob(scheduledTransferDate, async () => {
              try {
                console.log("Executing scheduled job for:", paymentDetails);
                const response = await processPayout(paymentDetails);
                console.log("Payout successful:", response);
              } catch (error) {
                console.error("Scheduled payout failed:", error);
              }
            });
          }
        }
      }

      const paymentDetails = new Payment({
        paymentId,
        orderId,
        status: "success",
        redeemedamount,
        totalamount,
        amount: amountInNumber,
        userId: req.user._id,
        ...(owner && { venderId: owner._id }), // Conditionally include venderId if owner exists
        ...(scheduledTransferDate && { scheduledTransferDate }),
        paymentFor // Conditionally include scheduledTransferDate if it exists
      });

      console.log("Saving payment details:", paymentDetails);
      await paymentDetails.save();

      const student = await Student.findById(req.user._id);
      console.log("Student found:", student);

      if (!student) {
        console.log("Error: Student not found");
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      // Add paymentId to the student's paymenthistory array
      student.paymenthistory.push(paymentDetails._id);

      // Save the updated student document
      console.log("Saving updated student:", student);
      await student.save();

      res.status(200).json({
        success: true,
        message: "Payment verified, and profile updated",
      });
    } else {
      console.log("Payment verification failed");
      res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};  



exports.enrollInBatch = async (req, res) => {
  const { amount, userId, batchId, studentacademyid } = req.body;

  try {
    // Fetch batch details
    const batch = await Batch.findById(batchId).populate(
      "academyId",
      "name address locationPin"
    );

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Ensure the student is not already enrolled in the batch
    if (
      batch.enrolledStudents.some(
        (student) => student.studentacademyid === studentacademyid
      )
    ) {
      return res
        .status(400)
        .json({ message: "Student is already enrolled in this batch" });
    }

    // Add the student to the batch's enrolledStudents array
    batch.enrolledStudents.push({
      studentId: userId,
      studentacademyid: studentacademyid,
    });
    await batch.save();

    // Fetch student details
    const student = await Student.findById(userId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Ensure the student's batchDetails array exists
    if (!student.batchDetails) {
      student.batchDetails = [];
    }

    if (!student.profile) {
      student.profile = {};
    }

    // Add the new batch details to the student's batchDetails array

    student.batchDetails.push({
      studentacademyid: studentacademyid,
      coachacademyid: batch.batchcoach,
      batchid: batch._id,
      batchId: batch.batchId,
      admissionDate: new Date(),
      startDate: new Date(batch.startDate),
      endDate: new Date(batch.endDate),
      isActive: true,
    });
    console.log(student);

    if (!student.academyId) {
      console.log("New Array created");
      student.academyId = [];
    }

    // Check if the academyId already exists to avoid duplicates
    if (
      !student.academyId.some(
        (id) => id.toString() === batch.academyId._id.toString()
      )
    ) {
      student.academyId.push(batch.academyId._id);
    }
    // Reset coins for the student upon enrollment
    student.profile.coins = 0;
    await student.save();

    // Credit coins to the referrer only if referral coins haven't been awarded yet
    if (student.referredBy && !student.referralCoinsAwarded) {
      const referrer = await Student.findOne({
        referralCode: student.referredBy,
      });

      if (referrer) {
        referrer.profile.coins += 100;
        await referrer.save();

        // Mark that referral coins have been awarded to the student
        student.referralCoinsAwarded = true;
        await student.save();
      }
    }

    // Prepare invoice details
    const invoiceNumber = `INV-${Date.now()}`;
    const paymentDate = new Date();
    const enrollmentDate = new Date();

    const invoiceData = {
      userId,
      userName: student.profile.name,
      userEmail: student.profile.email,
      userPhone: student.profile.phone,
      userAddress: student.profile.address,
      batchId: batch._id,
      batchName: batch.batchName,
      batchStartDate: batch.startDate,
      batchEndDate: batch.endDate,
      batchPlanType: batch.planType,
      academyId: batch.academyId,
      academyName: batch.academyId.name,
      academyAddress: batch.academyId.address,
      academyLocationPin: batch.academyId.locationPin,
      amountPaid: amount,
      paymentDate,
      enrollmentDate,
      invoiceNumber,
    };

    const invoiceBuffer = await generateInvoice(invoiceData);

    const remoteFileName = `invoice_${invoiceNumber}.pdf`;
    const invoiceUrl = await uploadInvoice(invoiceBuffer, remoteFileName);

    const newInvoice = new Invoice({
      userId,
      batchId,
      academyId: batch.academyId,
      amountPaid: amount,
      paymentDate,
      enrollmentDate,
      invoiceNumber,
      invoiceUrl,
    });
    await newInvoice.save();

    res.status(200).json({
      status: true,
      message: "User enrolled successfully",
      batch,
      invoice: newInvoice,
    });
  } catch (error) {
    console.error("Error enrolling user in batch:", error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

async function generateInvoice(data) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title Section
    doc.fontSize(20).text("Invoice", { align: "center" }).moveDown(2);

    // User Details Section (Left)
    doc
      .fontSize(12)
      .text("User Details", { underline: true })
      .moveDown(0.5)
      .text(`Name: ${data.userName}`)
      .text(`Email: ${data.userEmail}`)
      .text(`Phone: ${data.userPhone}`)
      .text(`Address: ${data.userAddress}`)
      .moveDown(2);

    // Academy and Batch Details Section (Right)
    doc
      .fontSize(12)
      .text("Academy & Batch Details", { underline: true })
      .moveDown(0.5)
      .text(`Academy Name: ${data.academyName}`)
      .text(`Academy Address: ${data.academyAddress}`)
      .text(`Location PIN: ${data.academyLocationPin}`)
      .text(`Batch Name: ${data.batchName}`)
      .text(`Batch Start Date: ${data.batchStartDate}`)
      .text(`Batch End Date: ${data.batchEndDate}`)
      .text(`Plan Type: ${data.batchPlanType}`)
      .moveDown(2);

    // Divider Line
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

    // Invoice Summary Section
    doc
      .fontSize(12)
      .text("Invoice Summary", { underline: true })
      .moveDown(0.5)
      .text(`Invoice Number: ${data.invoiceNumber}`)
      .text(`Amount Paid: ₹${data.amountPaid}`)
      .text(`Payment Date: ${data.paymentDate}`)
      .text(`Enrollment Date: ${data.enrollmentDate}`)
      .moveDown(2);

    // Order Details Table
    doc.fontSize(12).text("Order Details", { underline: true }).moveDown(0.5);

    // Table Header
    doc
      .fontSize(10)
      .text("Description", 50, doc.y, { continued: true, width: 200 })
      .text("Details", 250, doc.y)
      .moveDown(0.5)
      .moveTo(doc.x, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);

    // Table Rows
    doc
      .text("Batch Name", 50, doc.y, { continued: true, width: 200 })
      .text(data.batchName, 250, doc.y)
      .moveDown(0.5);

    doc
      .text("Plan Type", 50, doc.y, { continued: true, width: 200 })
      .text(data.batchPlanType, 250, doc.y)
      .moveDown(0.5);

    doc
      .text("Amount Paid", 50, doc.y, { continued: true, width: 200 })
      .text(`₹${data.amountPaid}`, 250, doc.y)
      .moveDown(2);

    // Footer
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

    doc
      .fontSize(10)
      .text("Thank you for your payment!", { align: "center" })
      .text("For any queries, please contact support@academy.com", {
        align: "center",
      });

    doc.end();
  });
}

const generateInvoicePDF = async (data) => {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  return new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Title Section
    doc.fontSize(20).text("Invoice", { align: "center" }).moveDown(2);

    // User Details Section (Left)
    doc
      .fontSize(12)
      .text("User Details", { underline: true })
      .moveDown(0.5)
      .text(`Name: ${data.userName}`)
      .text(`Email: ${data.userEmail}`)
      .text(`Phone: ${data.userPhone}`)
      .text(`Address: ${data.userAddress}`)
      .moveDown(2);

    // Academy and Batch Details Section (Right)
    // doc
    //   .fontSize(12)
    //   .text("Academy & Batch Details", { underline: true })
    //   .moveDown(0.5)
    //   // .text(`Academy Name: ${data.academyName}`)
    //   // .text(`Academy Address: ${data.academyAddress}`)
    //   // .text(`Location PIN: ${data.academyLocationPin}`)
    //   // .text(`Batch Name: ${data.batchName}`)
    //   // .text(`Batch Start Date: ${data.batchStartDate}`)
    //   // .text(`Batch End Date: ${data.batchEndDate}`)
    //   // .text(`Plan Type: ${data.batchPlanType}`)
    //   .moveDown(2);

    // Divider Line
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

    // Invoice Summary Section
    doc
      .fontSize(12)
      .text("Invoice Summary", { underline: true })
      .moveDown(0.5)
      .text(`Invoice Number: ${data.invoiceNumber}`)
      .text(`Amount Paid: ₹${data.amountPaid}`)
      .text(`Payment Date: ${data.paymentDate}`)
      // .text(`Enrollment Date: ${data.enrollmentDate}`)
      .moveDown(2);

    // Order Details Table
    // doc
    //   .fontSize(12)
    //   .text("Order Details", { underline: true })
    //   .moveDown(0.5);

    // Table Header
    // doc
    //   .fontSize(10)
    //   .text("Description", 50, doc.y, { continued: true, width: 200 })
    //   .text("Details", 250, doc.y)
    //   .moveDown(0.5)
    //   .moveTo(doc.x, doc.y)
    //   .lineTo(550, doc.y)
    //   .stroke()
    //   .moveDown(0.5);

    // Table Rows
    // doc
    //   .text("Batch Name", 50, doc.y, { continued: true, width: 200 })
    //   .text(data.batchName, 250, doc.y)
    //   .moveDown(0.5);

    // doc
    //   .text("Plan Type", 50, doc.y, { continued: true, width: 200 })
    //   .text(data.batchPlanType, 250, doc.y)
    //   .moveDown(0.5);

    doc
      .text("Amount Paid", 50, doc.y, { continued: true, width: 200 })
      .text(`₹${data.amountPaid}`, 250, doc.y)
      .moveDown(2);

    // Footer
    doc.moveTo(doc.x, doc.y).lineTo(550, doc.y).stroke().moveDown(1);

    doc
      .fontSize(10)
      .text("Thank you for your payment!", { align: "center" })
      .text("For any queries, please contact support@academy.com", {
        align: "center",
      });

    doc.end();
  });
  // doc.pipe(fs.createWriteStream(pdfPath));
  // doc.fontSize(18).text("Invoice", { align: "center" });
  // doc.fontSize(14).text(`Invoice Number: ${invoice.invoiceNumber}`);
  // doc.text(`User Name: ${invoice.userName}`);
  // doc.text(`Amount Paid: ${invoice.amountPaid}`);
  // doc.text(`Payment Date: ${invoice.paymentDate}`);
  // doc.end();

  // return pdfPath; // Return path or upload it to get a URL
};

exports.updateCoinandTrial = async (req, res) => {
  const { amount } = req.body;

  const student = await Student.findById(req.user._id);
  console.log("student", student);

  // const batch = await Batch.findOne({ batchId });

  // console.log("batch",batch)
  if (!student) {
    return res
      .status(404)
      .json({ success: false, message: "Student not found" });
  }
  //   const academyId = batch.academyId;
  // console.log("academyId",academyId)

  if (!student.profile) {
    student.profile = {}; // Initialize the profile if it doesn't exist
  }

  // Initialize fields if they don't exist
  if (!student.profile.totalPayments) {
    student.profile.totalPayments = 0;
  }

  if (!student.profile.coins) {
    student.profile.coins = 0;
  }

  // Update fields
  const updatedTotalPayments = student.profile.totalPayments + amount;
  const updatedCoins = student.profile.coins + amount;

  student.profile.totalPayments = updatedTotalPayments;
  student.profile.coins = updatedCoins; // Add the amount as coins

  // Add 3 to existing trials (not reset)
  const updatedTrialsLeft = student.profile.trialsLeft + 3;

  await Student.updateOne(
    { _id: req.user._id },
    {
      $set: {
        "profile.totalPayments": updatedTotalPayments,
        "profile.coins": updatedCoins, // Update coins to the new amount
        "profile.trialsLeft": updatedTrialsLeft, // Add 3 trials to the existing number of trials
      },
    },
    { runValidators: false }
  );

  const invoiceData = {
    userId: student._id,
    userName: student.profile.name,
    userEmail: student.email,
    userPhone: student.profile.phone,
    amountPaid: amount,
    invoiceNumber: `TRIAL-${Date.now()}`,
    date: new Date(),
  };

  const invoiceBuffer = await generateInvoicePDF(invoiceData);

  const remoteFileName = `invoice_${invoiceData.invoiceNumber}.pdf`;
  const invoiceUrl = await uploadInvoice(invoiceBuffer, remoteFileName);

  // Save the invoice to the database
  const newInvoice = new Invoice({
    userName: student.profile.name, // Assuming 'name' exists in the Student model
    amountPaid: amount,
    paymentDate: new Date(),
    invoiceNumber: `TRIAL-${Date.now()}`,
    userId: student._id,
    invoiceUrl,
  });
  console.log(newInvoice);

  await newInvoice.save();

  res.status(200).json({
    success: true,
    message: "Payment and profile updated successfully",
  });
};
