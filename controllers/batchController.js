const mongoose = require("mongoose");
const Batch = require("../model/Batch");
const Student = require('../model/Student');
const Coach = require('../model/Coach')
const Academy = require('../model/Academies')

const createBatch = async (req, res) => {
  try {
    const { batchName, sport, batchId, batchcoach, startTime, endTime, startDate, endDate, planType, price } = req.body;
    console.log("req.body",req.body)

    console.log("Received data of batch", req.body);
    console.log("Received data of user", req.user._id);
    
    // Find the coach using the user ID
    const coach = await Coach.findById(req.user._id);
    console.log("coach", coach);

    // Ensure coach exists and academyId is present
    if (!coach || !coach.academyId) {
      console.log("Coach or AcademyId not found.");
      return res.status(400).json({ message: "Coach or AcademyId not found." });
    }

    const academyId = coach.academyId;
    console.log("AcademyId", academyId);

    // Ensure all required fields are provided
    if (!batchName || !batchId || !startTime || !endTime || !startDate || !endDate || !planType || !price) {
      console.log("All fields are required.");
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate that academyId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(academyId)) {
      console.log("Invalid AcademyId.");
      return res.status(400).json({ message: "Invalid AcademyId." });
    }

    // Create a new batch
    const newBatch = new Batch({
      batchName,
      sport,
      batchcoach,
      batchId,
      startTime,
      endTime,
      startDate,
      endDate,
      planType,
      price,
      academyId,
    });

    // Save the batch
    console.log("newBatch",newBatch)

    const savedBatch = await newBatch.save();
    console.log("savedBatch",savedBatch)


    res.status(201).json({ message: "Batch created successfully", batch: savedBatch });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getBatchesForAdmin = async (req, res) => {
  try {
    const { academyId } = req.params;
    const academy = await Academy.findById(academyId);
    console.log("academy",academy)
    const batches = await Batch.find({ academyId: academy._id})
    .populate({
      path: 'academyId', // The field in Batch schema referencing the Academy model
      select: 'name',    // Select only the 'name' field from the Academy model
    });

    console.log("batches",batches)
  

    res.status(200).json(batches);
  } catch (error) {
    console.log("Hello")
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getBatchesForCoachAdd = async (req, res) => {
  try {
    const { academyId,sport } = req.params;
    const academy = await Academy.findById(academyId);
    const batches = await Batch.find({ 
      sport:sport,
      academyId: academy._id, 
      batchcoach: { $in: [null, undefined] } // This matches documents where batchcoach is null or undefined
    })
    .populate({
      path: 'academyId', // The field in Batch schema referencing the Academy model
      select: 'name',    // Select only the 'name' field from the Academy model
    });

    console.log("batches",batches)
  

    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Get all batches for a user
const getBatches = async (req, res) => {

  try {
    const { userId } = req.params;
    const coach = await Coach.findById(userId);
    console.log("coach",coach)
    const batches = await Batch.find({ academyId: coach.academyId })
    .populate({
      path: 'academyId', // The field in Batch schema referencing the Academy model
      select: 'name',    // Select only the 'name' field from the Academy model
    });
  

    res.status(200).json(batches);
  } catch (error) {
    console.log("Hello")
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getBatchesByAcademy = async (req, res) => {

  try {
    const { academyId } = req.params;
    const batches  = await Batch.find({academyId});

    console.log("batches",batches)

    res.status(200).json(batches);
  } catch (error) {
    console.log("Hello")
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find();
    if (!batches || batches.length === 0) {
      return res.status(404).json({ message: "No batches found." });
    }
    res.status(200).json(batches); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


const enrollInTrial = async (req, res) => {
  const { batchId } = req.body;
  const trialCost = 250;

  try {
    const student = await Student.findById(req.user._id); // Assuming user is authenticated
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check if the user has enough coins and trials left
    if (student.profile.coins < trialCost) {
      return res.status(400).json({ success: false, message: 'Insufficient coins for trial' });
    }

    if (student.profile.trialsLeft <= 0) {
      return res.status(400).json({ success: false, message: 'No trials left' });
    }

    // Deduct coins and trials
    student.profile.coins -= trialCost;
    student.profile.trialsLeft -= 1;

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in trial',
      profile: student.profile,
    });
  } catch (err) {
    console.error('Error enrolling in trial:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
module.exports = { createBatch, getBatches,getAllBatches,enrollInTrial,getBatchesByAcademy,getBatchesForAdmin,getBatchesForCoachAdd };
