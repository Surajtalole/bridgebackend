const mongoose = require("mongoose");
const Batch = require("../model/Batch");
const Student = require('../model/Student');
const Coach = require('../model/Coach')
const Academy = require('../model/Academies')

const createBatch = async (req, res) => {
  try {
    const { batchName, sport, batchId,coachId, batchcoach, startTime, endTime, startDate, endDate, planType, price } = req.body;
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
    if (!batchName || !batchId || !startTime || !endTime || !startDate || !endDate || !planType || !price || !coachId) {
      console.log("All fields are required.");
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate that academyId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(academyId)) {
      console.log("Invalid AcademyId.");
      return res.status(400).json({ message: "Invalid AcademyId." });
    }
    const existingBatch = await Batch.findOne({ batchId });
    if (existingBatch) {
      return res.status(400).json({
        message: "This batchId already exists. Please provide a unique batchId.",
      });
    }

    // Create a new batch
    const newBatch = new Batch({
      batchName,
      sport,
      batchcoach,
      coachId,
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

const editBatch = async (req, res) => {
  try {
    const { batchName, batchId,startTime, endTime, startDate, endDate,batchPrice,sport,coachId } = req.body;
    console.log("req.body", req.body);

    // Find the batch by its ID (assuming batchId is unique)
    const batch = await Batch.findOne({ batchId });
    console.log("Batch found:", batch);

    if (!batch) {
      return res.status(404).json({ message: "Batch not found." });
    }

    // Update only the allowed fields
    if (batchName) batch.batchName = batchName;
    if (startTime) batch.startTime = new Date(startTime);
    if (endTime) batch.endTime = new Date(endTime);
    if (startDate) batch.startDate = new Date(startDate);
    if (endDate) batch.endDate = new Date(endDate);
    if (batchPrice) batch.price = batchPrice;

    

    // Save the updated batch
    await batch.save();
    console.log("Batch updated successfully:", batch);

    res.status(200).json({ message: "Batch updated successfully", batch });
  } catch (error) {
    console.error("Error updating batch:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    console.log("batchId",batchId)


    // Find and delete the batch by ID
    const deletedBatch = await Batch.findByIdAndDelete(batchId);

    if (!deletedBatch) {
      return res.status(404).json({ message: "Batch not found." });
    }
    console.log("deletedBatch",deletedBatch)

    res.status(200).json({ message: "Batch deleted successfully", deletedBatch });
  } catch (error) {
    console.error("Error deleting batch:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



const getStudentofBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    // Fetch the batch and populate full student details
    const batchStudents = await Batch.findById(batchId)
      .populate({
        path: "enrolledStudents.studentId",
        model: "Student", // Ensure it refers to the correct model
        select: "-password -__v", // Exclude sensitive fields
        populate: {
          path: "profile",
          select: "-_id name photo dob gender address phoneNumber",
        },
      })
      .populate({
        path: "academyId",
        select: "academyName", // Fetch academy name
      });

    if (!batchStudents) {
      return res.status(404).json({ message: "Batch not found" });
    }

    console.log("Enrolled Students Data:", batchStudents.enrolledStudents[0].studentId);


    res.status(200).json({ message: "Batch Students", batchStudents });
  } catch (error) {
    console.error("Error getting batch students:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getBatchesofStudent = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all students who have a batch where the logged-in user has a verified request
    const students = await Student.find({
      "batchDetails.requests.requestedUser": userId,
      "batchDetails.requests.verify": true,
    }).populate({
      path: "batchDetails.batchid",
      select: "batchName coachId startTime endTime academyId", // Selecting required fields
      populate: [
        {
          path: "academyId",
          model: "academies",
          select: "name gallery", // Get academy name
        },
        {
          path: "coachId",
          model: "coach",
          select: "name", // Get coach name
        },
      ],
    });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No batches found for other students." });
    }

    // Process the batches of other students
    const allBatches = students.map((student) => {
      return student.batchDetails
        .filter((batchDetail) =>
          batchDetail.requests.some(
            (request) =>
              request.requestedUser.toString() === userId && request.verify === true
          )
        )
        .map((batchDetail) => ({
          studentId: student._id, // Include studentId for future reference
          studentName: student.profile.name, // Add student name if needed
          batchName: batchDetail.batchid.batchName,
          batchId: batchDetail.batchId,
          coachName: batchDetail.batchid.coachId?.name || "Unknown Coach",
          academyName: batchDetail.batchid.academyId?.name || "Unknown Academy",
          academyGalleryImage: batchDetail.batchid.academyId?.gallery?.[0] || null, //
          startTime: batchDetail.batchid.startTime,
          endTime: batchDetail.batchid.endTime,
        }));
    }).flat();

    console.log("All batches",allBatches)

    // Return the batches
    res.status(200).json({ message: "Batches found", batches: allBatches });
  } catch (error) {
    console.error("Error getting other students' batches:", error);
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
    })
    .populate({
      path: 'coachId', // The field in Batch schema referencing the Academy model
      select: 'name',    // Select only the 'name' field from the Academy model
    });
  

    res.status(200).json(batches);
  } catch (error) {
    console.log("Hello")
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getBatchUser = async (req, res) => {
  try {
    const { userId, hasAcademy } = req.query;

    console.log("Incoming Request:");
    console.log("User ID:", userId);
    console.log("Has Academy:", hasAcademy);

    if (!userId) {
      console.log("Validation Error: User ID is missing");
      return res.status(400).json({ message: "User ID is required" });
    }

    let batches;

    if (hasAcademy === "true") { // Ensure correct string comparison
      console.log("Fetching coach details for user ID:", userId);

      const coach = await Coach.findById(userId);
      
      if (!coach) {
        console.log("Coach not found with ID:", userId);
        return res.status(404).json({ message: "Coach not found" });
      }

      console.log("Coach found:", coach);
      console.log("Fetching batches for academy ID:", coach.academyId);

      batches = await Batch.find({ academyId: coach.academyId })
        .populate({
          path: "academyId",
          select: "gallery",
        })
        .populate({
          path: "coachId",
          select: "name",
        });

    } else {
      console.log("Fetching batches for coach ID:", userId);

      batches = await Batch.find({ coachId: userId })
        .populate({
          path: "academyId",
          select: "gallery",
        })
        .populate({
          path: "coachId",
          select: "name",
        });
    }

    // Format the response to include academy gallery[0] and coach name
    const formattedBatches = batches.map(batch => ({
      ...batch.toObject(),
      academyImage: batch.academyId?.gallery?.[0] || null, // Get first image from gallery
      coachName: batch.coachId?.name || "Unknown Coach",
    }));

    console.log("Formatted Batches:", formattedBatches);

    res.status(200).json(formattedBatches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ message: "Server error" });
  }
};




const getBatchesByAcademy = async (req, res) => {

  try {
    const { academyId } = req.params;
    const batches = await Batch.find({ academyId })
      .populate({
        path: 'coachId', // Populate the batchcoach field
        select: 'name',     // Select the 'name' field of the coach
      });    
    res.status(200).json(batches);
  } catch (error) {
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
module.exports = { createBatch,editBatch,deleteBatch, getBatches,getAllBatches,enrollInTrial,getBatchesByAcademy,getBatchesForAdmin,getBatchesForCoachAdd,getStudentofBatch,getBatchesofStudent,getBatchUser };
