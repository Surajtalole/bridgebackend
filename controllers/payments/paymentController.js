const Razorpay = require("razorpay");
const Payment = require("../../model/Payments");
const Student = require("../../model/Student");
const Batch =require("../../model/Batch")
const Invoice = require("../../model/Invoice")
const mongoose = require("mongoose");
const uploadInvoice = require('../ftpController/invoiceToFtp')

const PDFDocument = require("pdfkit");
const fs = require("fs");


require("dotenv").config();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  const { amount } = req.body;
  console.log("amount",amount);
  try {

    const options = {
      amount: amount*100,
      currency: "INR",
      receipt: `order_rcptid_${new Date().getTime()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    console.log("order",order);
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
  const { paymentId, orderId, signature, amount } = req.body;
  console.log('Received data:', { paymentId, orderId, signature, amount });

  const body = orderId + "|" + paymentId;
  console.log('Body for HMAC calculation:', body);

  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  
  console.log('Expected Signature:', expectedSignature);
  console.log('Provided Signature:', signature);

  if (expectedSignature === signature) {
    console.log("Signatures match. Payment verified.");
    if (!amount) {
      console.log('Error: Amount is missing');
      return res
        .status(400)
        .json({ success: false, message: "Amount is required" });
    }

    const amountInNumber =
      typeof amount === "string"
        ? parseFloat(amount.replace(/[₹,]/g, "")) 
        : amount;

    console.log('Processed amount:', amountInNumber);

    try {
      // Create a new payment document
      const paymentDetails = new Payment({
        paymentId,
        orderId,
        status: "success",
        amount: amountInNumber,
        userId: req.user._id,
      });
      console.log('Saving payment details:', paymentDetails);
      await paymentDetails.save();

      // Find the student and add the paymentId to their payment history
      const student = await Student.findById(req.user._id);
      console.log('Student found:', student);

      if (!student) {
        console.log('Error: Student not found');
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      // Add paymentId to the student's paymenthistory array
      student.paymenthistory.push(paymentDetails._id);

      // Save the updated student document
      console.log('Saving updated student:', student);
      await student.save();

      res.status(200).json({
        success: true,
        message: "Payment verified, and profile updated",
      });
    } catch (err) {
      console.error("Error handling payment:", err);
      res.status(500).json({
        success: false,
        message: "Failed to save payment details or update profile",
      });
    }
  } else {
    console.log('Payment verification failed');
    res
      .status(400)
      .json({ success: false, message: "Payment verification failed" });
  }
};




exports.enrollInBatch = async (req, res) => {
  const { amount, userId, batchId, studentbatchid } = req.body;

  try {
    // Fetch batch details
    const batch = await Batch.findById(batchId).populate("academyId", "name address locationPin");

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // Ensure the student is not already enrolled in the batch
    if (batch.enrolledStudents.some(student => student.studentbatchid === studentbatchid)) {
      return res.status(400).json({ message: "Student is already enrolled in this batch" });
    }

    // Add the student to the batch's enrolledStudents array
    batch.enrolledStudents.push({
      studentId: userId,
      studentbatchid: studentbatchid,
    });
    await batch.save();

    // Fetch student details
    const student = await Student.findById(userId).select("profile.name email profile.phone profile.address batchDetails referredBy referralCoinsAwarded");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Ensure the student's batchDetails array exists
    if (!student.batchDetails) {
      student.batchDetails = [];
    }

    // Add the new batch details to the student's batchDetails array
    student.batchDetails.push({
      studentbatchid: studentbatchid,
      batchId: batch._id,
      admissionDate: new Date(),
      startDate: new Date(batch.startDate),
      endDate: new Date(batch.endDate),
      isActive: true,
    });

    // Reset coins for the student upon enrollment
    student.profile.coins = 0;
    await student.save();

    // Credit coins to the referrer only if referral coins haven't been awarded yet
    if (student.referredBy && !student.referralCoinsAwarded) {
      const referrer = await Student.findOne({ referralCode: student.referredBy });

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
    doc
      .fontSize(20)
      .text("Invoice", { align: "center" })
      .moveDown(2);

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
    doc
      .moveTo(doc.x, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(1);

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
    doc
      .fontSize(12)
      .text("Order Details", { underline: true })
      .moveDown(0.5);

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
    doc
      .moveTo(doc.x, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(1);

    doc
      .fontSize(10)
      .text("Thank you for your payment!", { align: "center" })
      .text("For any queries, please contact support@academy.com", { align: "center" });

    doc.end();
  });
}

exports.updateCoinandTrial = async (req, res) => {
  const { amount } = req.body;

  const student = await Student.findById(req.user._id);
  console.log('student', student);

  if (!student) {
    return res
      .status(404)
      .json({ success: false, message: "Student not found" });
  }

  // Update the total payments to the received amount
  const updatedTotalPayments =student.profile.totalPayments+ amount; // Replace the totalPayments with the new amount
  
  // Always update coins with the same amount as the payment (e.g., 500 rupees = 500 coins)
  let updatedCoins = student.profile.coins + amount; // Add the amount as coins

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

  res.status(200).json({ success: true, message: "Payment and profile updated successfully" });
};


