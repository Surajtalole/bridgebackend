const Student = require("../model/Student");
const Coach = require("../model/Coach"); // Assuming you have a Coach model
const Trials = require("../model/TrialRequest");
const Batch = require("../model/Batch");


const getTrials = async (req, res) => {
  const { academyId } = req.params; // Extracting academyId from request parameters

  try {
    // Fetch the coach details for the given academyId
    const coach = await Coach.findById(academyId); // Assuming academyId is a field in the Coach model
    console.log("Coach:", coach);

    let trials = []; // Declare trials outside the conditional block

    if (coach.hasAcademy) {
      console.log("Academy ID:", coach.academyId);

      // Fetch trials related to the coach's academy
      trials = await Trials.find({ academyId: coach.academyId })
        .populate({
          path: "studentId",
          select: "profile.name", // Populate only the 'name' field from Student
        })
        .populate({
          path: "batchId",
          select: "batchName", // Populate only the 'batchName' field from Batch
        })
        .populate({
          path: "academyId",
          select: "name", // Populate only the 'name' field from Academy
        });

    } else {
      // Fetch all batches related to the coach's academy
      const batches = await Batch.find({ batchcoach: coach.coachacademyid });


      if (batches && batches.length > 0) {
        // Get all batch IDs
        const batchIds = batches.map(batch => batch._id);

        // Fetch trials that belong to any of the batchIds
        trials = await Trials.find({ batchId: { $in: batchIds } })
          .populate({
            path: "studentId",
            select: "profile.name", // Populate only the 'name' field from Student
          })
          .populate({
            path: "batchId",
            select: "batchName", // Populate only the 'batchName' field from Batch
          })
          .populate({
            path: "academyId",
            select: "name", // Populate only the 'name' field from Academy
          });
      }
    }

    console.log("Trials:", trials);

    // Respond with the fetched data
    res.status(200).json({
      success: true,
      data: trials,
      message: "Trials and coach details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching trials and coach details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trials and coach details",
      error: error.message,
    });
  }
};
const getTrialData = async (req, res) => {

  try {
    const { studentId, batchId } = req.params;

    // Find the trial request by studentId and batchId
    const trialRequest = await Trials.findOne({
      studentId: studentId,
      batchId: batchId,
    })

    if (!trialRequest) {
      return res.status(404).json({ message: "No trial request found." });
    }

    // Return the trial request data
    console.log("trialRequest",trialRequest)
    res.status(200).json(trialRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};




const assignSlot = async (req, res) => {
  const { trialId, batchId, expiryDate, studentId, trialDate, trialTime } = req.body;

  console.log("Received data - batchId:", batchId, "expiryDate:", expiryDate, "studentId:", studentId, "trialDate:", trialDate, "trialTime:", trialTime);

  try {
    // Find the trial by ID
    const trial = await Trials.findById(trialId);

    // Check if the trial exists
    if (!trial) {
      return res.status(404).json({
        success: false,
        message: "Trial not found",
      });
    }

    // Update the trial details
    trial.scheduledAt = trialDate; // Update the trialDate
    trial.trialTime = trialTime; // Update the trialTime
    trial.expiredAt = expiryDate; // Update the expiryDate
    trial.status = 'scheduled'; // Set the status to 'scheduled'

    // Save the updated trial
    await trial.save();

    // Respond with the updated trial data
    res.status(200).json({
      success: true,
      data: trial,
      message: "Trial slot successfully assigned and updated",
    });
  } catch (error) {
    console.error("Error assigning trial slot:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign trial slot",
      error: error.message,
    });
  }
};
const rescheduleSlot = async (req, res) => {
  const { trialId, batchId, expiryDate, studentId, trialDate, trialTime } = req.body;

  console.log("Received data - batchId:", batchId, "expiryDate:", expiryDate, "studentId:", studentId, "trialDate:", trialDate, "trialTime:", trialTime);

  try {
    // Find the trial by ID
    const trial = await Trials.findById(trialId);

    // Check if the trial exists
    if (!trial) {
      return res.status(404).json({
        success: false,
        message: "Trial not found",
      });
    }

    // Update the trial details for rescheduling
    trial.scheduledAt = trialDate; // Update the trialDate
    trial.trialTime = trialTime; // Update the trialTime
    trial.expiredAt = expiryDate; // Update the expiryDate
    trial.status = 'rescheduled'; // Update status to 'rescheduled' instead of 'scheduled'

    // Save the updated trial
    await trial.save();

    // Respond with the updated trial data
    res.status(200).json({
      success: true,
      data: trial,
      message: "Trial slot successfully rescheduled and updated",
    });
  } catch (error) {
    console.error("Error rescheduling trial slot:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reschedule trial slot",
      error: error.message,
    });
  }
};
const trialDone = async (req, res) => {
  const { trialId} = req.body;
  try {
    // Find the trial by ID
    const trial = await Trials.findById(trialId);

    // Check if the trial exists
    if (!trial) {
      return res.status(404).json({
        success: false,
        message: "Trial not found",
      });
    }
    trial.status = 'done'; // Update status to 'rescheduled' instead of 'scheduled'

    // Save the updated trial
    await trial.save();

    // Respond with the updated trial data
    res.status(200).json({
      success: true,
      data: trial,
      message: "Trial slot successfully rescheduled and updated",
    });
  } catch (error) {
    console.error("Error rescheduling trial slot:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reschedule trial slot",
      error: error.message,
    });
  }
};





const getStudentsTrials = async (req, res) => {
  const { StudentId } = req.params; // Extracting studentId from request parameters
  console.log("studentId:", StudentId);

  try {
    // Convert StudentId to a Mongoose ObjectId if necessary (if it's in string format)
    const mongoose = require("mongoose");
    const studentObjectId = new mongoose.Types.ObjectId(StudentId);

    // Use the correct model name ('TrialRequest' instead of 'Trials') and query with 'studentId'
    const trials = await Trials.find({ studentId: studentObjectId });

    console.log("Trials found:", trials);

    // Respond with the fetched data
    res.status(200).json({
      success: true,
      data: trials,
      message: "Trials and coach details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching trials and coach details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch trials and coach details",
      error: error.message,
    });
  }
};







module.exports = {
  getTrials,
  assignSlot,
  getStudentsTrials,
  rescheduleSlot,
  trialDone,
  getTrialData
};
