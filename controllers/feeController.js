const Student = require("../model/Student");
const mongoose = require("mongoose");
const Coach = require("../model/Coach")
const Batch = require("../model/Batch")



const addFees = async (req, res) => {
  try {
    const { studentId, fees, batchId } = req.body;
    
    console.log("Request Data:", studentId, fees, batchId);
    
    // Find the student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    console.log("Student Data:", student);

    // Convert the batchId to ObjectId
    const batchObjectId = new mongoose.Types.ObjectId(batchId);
    console.log("Converted Batch ObjectId:", batchObjectId);

    // Find the batchDetails entry matching the batchId
    const batchDetail = student.batchDetails.find(
      (batch) => batch.batchid.toString() === batchObjectId.toString() // comparing as strings
    );

    if (!batchDetail) {
      console.log("No matching batch found");
      return res.status(404).json({ message: "Batch not found for student" });
    }
    
    console.log("Found Batch Detail:", batchDetail);

    // Update the fees for the found batch entry
    batchDetail.fees = fees;

    // Save the updated student record
    await student.save();

    // Send only the updated fee data in the response
    res.status(200).json({ message: "Fees added successfully", fees: batchDetail.fees });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
};




  const getFees = async (req, res) => {
    try {
      const  studentId  = req.user._id;
  
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      res.status(200).json(student.fees);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const getFeesStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Received request for fees status with userId:", userId);

        // Find the coach details
        const coach = await Coach.findById(userId);
        if (!coach) {
            console.log("Coach not found for userId:", userId);
            return res.status(404).json({ message: "Coach not found" });
        }

        console.log("Coach found:", coach);

        let studentIds = [];

        if (coach.hasAcademy) {
            console.log("Coach has an academy, fetching batches...");

            // Get all batches under this academy
            const batches = await Batch.find({ academyId: coach.academyId });
            console.log("Batches found:", batches.length);

            // Get all students in these batches
            studentIds = batches.flatMap(batch => batch.enrolledStudents.map(s => s.studentId));
        } else {
            console.log("Coach does not own an academy, fetching assigned batches...");

            // Find students in batches they teach
            const batches = await Batch.find({ coachId: coach._id });
            console.log("Batches found:", batches.length);

            studentIds = batches.flatMap(batch => batch.enrolledStudents.map(s => s.studentId));
        }

        console.log("Student IDs found:", studentIds.length);

        // Fetch student fee details
        const students = await Student.find({ _id: { $in: studentIds } })
            .select("batchDetails.fees");

        let paidCount = 0;
        let dueCount = 0;

        students.forEach(student => {
            student.batchDetails.forEach(batch => {
                if (batch.fees?.paymentStatus === "paid") {
                    paidCount++;
                } else if (batch.fees?.paymentStatus === "due") {
                    dueCount++;
                }
            });
        });

        console.log(`Paid students: ${paidCount}, Due students: ${dueCount}`);

        return res.json({ paidCount, dueCount });

    } catch (error) {
        console.error("Error fetching fee details:", error);
        res.status(500).json({ message: "Server Error" });
    }
};




  
  
  module.exports = { addFees, getFees,getFeesStatus};