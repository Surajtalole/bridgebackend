const Student = require("../model/Student");
const Coach = require("../model/Coach"); // Assuming you have a Coach model
const Trials = require("../model/TrialRequest");

const getTrials = async (req, res) => {
  const { academyId } = req.params; // Extracting academyId from request parameters

  try {
    // Fetch the coach details for the given academyId
    const coach = await Coach.findById(academyId); // Assuming academyId is a field in the Coach model
    console.log("Coach", coach);

    // Fetch the trials associated with the academyId
    console.log("academyId", coach.academyId);

    const trials = await Trials.find({ academyId: coach.academyId })
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
    console.log("trials", trials);

    // Respond with the fetched data
    res.status(200).json({
      success: true,
      data:trials,
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





module.exports = {
  getTrials,
  assignSlot
};
