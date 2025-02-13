const Student = require("../model/Student");
const Coach = require("../model/Coach"); // Assuming you have a Coach model
const Batch = require("../model/Batch")
const mongoose = require('mongoose');


const addAnalytics = async (req, res) => {
  const { studentId } = req.params;
  const { academyId, analyticsData } = req.body;


  if (!analyticsData || Object.keys(analyticsData).length === 0) {
    return res.status(400).json({ message: "Analytics data is required" });
  }

  try {
    // Find the batch
    const batch = await Batch.findOne({
      academyId: academyId,
      enrolledStudents: { $elemMatch: { studentId: studentId } },
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found for the given academy and student." });
    }

    // Generate month key
    const currentMonth = new Date().toLocaleString("default", { month: "long" });
    const currentYear = new Date().getFullYear();
    const monthKey = `${currentMonth} ${currentYear}`;

    // Find the student
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.analytics) {
      student.analytics = [];
    }

    // Check if analytics data already exists for the same batch in the same month
    const existingEntry = student.analytics.find(
      (entry) => entry.batchId === batch.batchId && entry.month === monthKey
    );

    if (existingEntry) {
      return res.status(400).json({
        message: "Analytics data for this batch and month already exists.",
      });
    }

    // Add a new entry for the batch
    student.analytics.push({
      month: monthKey,
      batchId: batch.batchId,
      data: analyticsData.results,
      feedback: analyticsData.feedback,
      marks: analyticsData.marks,


      submittedAt: new Date(),
    });

    // Save the student document
    await student.save();

    console.log(student);

    res.status(200).json({ message: "Analytics updated successfully", student });
  } catch (error) {
    console.error("Error updating analytics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addAnalyticsByCoach = async (req, res) => {
  const coachId = req.user._id;
  const { studentId } = req.params;
  const { analyticsData } = req.body;


  if (!analyticsData || Object.keys(analyticsData).length === 0) {
    return res.status(400).json({ message: "Analytics data is required" });
  }

  const coach = await Coach.findById(coachId);

  try {
    // Find the batch
    const batch = await Batch.findOne({
      batchcoach:coach.coachacademyid,
      enrolledStudents: { $elemMatch: { studentId: studentId } },
    });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found for the given academy and student." });
    }

    // Generate month key
    const currentMonth = new Date().toLocaleString("default", { month: "long" });
    const currentYear = new Date().getFullYear();
    const monthKey = `${currentMonth} ${currentYear}`;

    // Find the student
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.analytics) {
      student.analytics = [];
    }

    // Check if analytics data already exists for the same batch in the same month
    const existingEntry = student.analytics.find(
      (entry) => entry.batchId === batch.batchId && entry.month === monthKey
    );

    if (existingEntry) {
      return res.status(400).json({
        message: "Analytics data for this batch and month already exists.",
      });
    }

    // Add a new entry for the batch
    student.analytics.push({
      month: monthKey,
      batchId: batch.batchId,
      data: analyticsData.results,
      submittedAt: new Date(),
    });

    // Save the student document
    await student.save();

    console.log(student);

    res.status(200).json({ message: "Analytics updated successfully", student });
  } catch (error) {
    console.error("Error updating analytics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};





const getAnalytics = async (req, res) => {
  const { studentId, batchId } = req.params;  // Get studentId and batchId from params

  try {
    // Find the student by studentId
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Filter the batchDetails to find the batch with the given batchId
    const batchDetail = student.batchDetails.find(batch => batch.batchId === batchId || batch.batchid.toString() === batchId);

    if (!batchDetail) {
      return res.status(404).json({ message: "Batch not found for this student" });
    }

    // Get the fee details of the batch
    const feeDetails = batchDetail.fees;

    console.log("Fee Details:", feeDetails);

    // Filter the analytics data based on batchId
    const analyticsData = student.analytics.filter(item => item.batchId === batchId);
    
    console.log('Analytics Data:', analyticsData);


    console.log(analyticsData.length)


    // Return the filtered analytics and fee details
    res.status(200).json({ analytics: analyticsData, fees: feeDetails });
  } catch (error) {
    console.error("Error retrieving analytics and fee details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Route to fetch coach parameters
const getParameters = async (req, res) => {
  const coachId = req.user._id;


  try {
    const { userId, academyId } = req.params;
    console.log("Parameters received:", { userId, academyId });

    // Find the batch by either academyId or enrolled student ID
    const batch = await Batch.findOne({
      academyId: academyId,
      enrolledStudents: { $elemMatch: { studentId: userId } },
    });

    console.log(batch)
    

    // Validate batch existence
    if (!batch) {
      return res.status(404).json({ message: "No batch found for the given criteria" });
    }
    console.log("Batch found:", batch);

    // Validate batchcoach existence
    if (!batch.batchcoach) {
      return res.status(404).json({ message: "Batch coach is not defined" });
    }

    // Fetch the coach associated with the batch
    const coach = await Coach.findOne({ coachacademyid: batch.batchcoach });

    // Validate coach existence
    if (!coach) {
      return res.status(404).json({ message: "Coach not found for the batch" });
    }
    console.log("Coach found:", coach);

    // Respond with the coach's analysis parameter
    res.status(200).json({ analysisparameter: coach.analysisparameter || [] });
  } catch (error) {
    console.error("Error fetching coach parameters:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getParameter = async (req, res) => {
  const coachId = req.user._id;

  try {
    const { userId } = req.params;
    const coach = await Coach.findById(coachId);
    console.log("scoach",coach)

    res.status(200).json({ analysisparameter: coach.analysisparameter || [] });
  } catch (error) {
    console.error("Error fetching coach parameters:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};








module.exports = {
  addAnalytics,
  getAnalytics,
  getParameters,
  getParameter,
  addAnalyticsByCoach
};
