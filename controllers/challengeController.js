// controllers/challengeController.js
const Challenge = require("../model/Challenge");
const uploadToFTP = require("./ftpController/ftpUploader");


const path = require('path');
const SubmittedChallenge = require("../model/SubmittedChallenges")
const uploadVideoToFTP = require('../controllers/ftpController/videoToFtp')

const Student = require('../model/Student');

exports.createChallenge = async (req, res) => {
  try {
    const { name, sport, category, coins,level } = req.body;
    console.log(name, sport, category, coins,level)

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Generate a unique filename for the FTP server
    const remoteFileName = Date.now() + path.extname(req.file.originalname); // Unique filename
    const imageUrl = await uploadToFTP(req.file.buffer, remoteFileName); 

    const newChallenge = new Challenge({
      name,
      sport,
      category,
      coins,
      level,
      imageUrl
    });
    

    await newChallenge.save();
    res
      .status(201)
      .json({
        message: "Challenge created successfully!",
        challenge: newChallenge,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating challenge", error: error.message });
  }
};

exports.getChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find();
    res.status(200).json(challenges);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching challenges", error: error.message });
  }
};

exports.getPublishedChallenges = async (req, res) => {
  try {
    const userId = req.params.id; // Access the userId from the URL parameter

    // Fetch the student and populate the batchId field with Batch details
    const user = await Student.findById(userId).populate('batchDetails.batchid').exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User data:", user);

    // Filter out the batchDetails where batchId is null
    const sports = user.batchDetails
      .filter(batchDetail => batchDetail.batchid) // Ensure batchId is not null
      .map(batchDetail => batchDetail.batchid.sport); // Extract the sport field

    if (sports.length === 0) {
      return res.status(404).json({ message: "No sports found for the user." });
    }

    console.log("Sports associated with the user:", sports);

    // Fetch challenges where the sport matches one of the student's batch sports
    const challenges = await Challenge.find({
      isPublish: true,
      sport: { $in: sports }  // Filtering challenges where the sport is in the student's batch sports
    });

    if (challenges.length === 0) {
      return res.status(200).json({ message: "No challenges found for the selected sports." });
    }

    // Always return an array of challenges
    res.status(200).json({ challenges }); // Return the challenges as an object with a 'challenges' key

  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ message: "Error fetching challenges", error: error.message });
  }
};




exports.togglePublish = async (req, res) => {
  const { challengeId } = req.params;

  try {
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    challenge.isPublish = !challenge.isPublish; // Toggle the isPublic value
    await challenge.save();

    res
      .status(200)
      .json({ message: "Challenge publish status updated", challenge });
  } catch (error) {
    res.status(500).json({ message: "Error updating publish status" });
  }
};

exports.deleteChallenge = async (req, res) => {
  const { id } = req.params; 
  try {
    console.log(`Incoming DELETE request for challenge with ID: ${id}`);
    console.log(`Authenticated user ID: ${req.user?.id || 'No user ID provided'}`);

    if (!id) {
      console.error('No ID provided in request parameters.');
      return res.status(400).json({ message: 'Challenge ID is required' });
    }

    const deletedChallenge = await Challenge.findByIdAndDelete(id);

    if (!deletedChallenge) {
      console.error(`No challenge found with ID: ${id}`);
      return res.status(404).json({ message: 'Challenge not found' });
    }

    console.log(`Challenge with ID: ${id} deleted successfully.`);
    res.status(200).json({ message: 'Challenge deleted successfully' });
  } catch (err) {
    console.error(`Error occurred while deleting challenge with ID: ${id}`, err);
    res.status(500).json({ message: 'Error deleting challenge', error: err.message });
  }
};

exports.updateChallenge = async (req, res) => {
  const { id } = req.params;
  const challengeData = req.body;

  try {
    if (!id) {
      console.error('No ID provided in request parameters.');
      return res.status(400).json({ message: 'Challenge ID is required' });
    }

    const updatedChallenge = await Challenge.findByIdAndUpdate(id, challengeData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validation rules are applied
    });

    if (!updatedChallenge) {
      console.error(`No challenge found with ID: ${id}`);
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.status(200).json({ message: 'Challenge updated successfully', updatedChallenge });
  } catch (err) {
    res.status(500).json({ message: 'Error updating challenge', error: err.message });
  }
};

exports.uploadChallengeVideo = async (req, res) => {
  const { challengeId, studentId } = req.body;
  console.log('Challenge ID:', challengeId, 'Student ID:', studentId);

  try {
    if (!challengeId || !studentId) {
      console.error('Challenge ID and Student ID are required.');
      return res.status(400).json({ message: 'Challenge ID and Student ID are required' });
    }

    const challenge = await Challenge.findById(challengeId);
    const student = await Student.findById(studentId);

    if (!challenge || !student) {
      return res.status(404).json({ message: 'Challenge or Student not found' });
    }

    if (!req.file) {
      console.error('No video file uploaded.');
      return res.status(400).json({ message: 'Video file is required' });
    }

    const videoBuffer = req.file.buffer;
    const videoName = `${studentId}_challenge_${challengeId}_video_${Date.now()}${path.extname(req.file.originalname)}`;

    console.log('Uploading video to FTP server...');
    const videoUrl = await uploadVideoToFTP(videoBuffer, videoName);
    console.log('Video URL returned from FTP:', videoUrl);

    const submittedChallenge = new SubmittedChallenge({
      student: studentId,
      challenge: challengeId,
      videoLink: videoUrl,
      status: 'under review',
      level:challenge.level
    });

    await submittedChallenge.save();
    console.log('Submitted challenge saved successfully.');

    res.status(200).json({
      success: true,  // Added success flag
      message: 'Challenge video uploaded successfully and saved',
      submittedChallenge,
    });
    

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error uploading challenge video',
      error: err.message,
    });
    
  }
};

exports.checkAlreadySubmitted = async (req, res) => {
  const { challengeId, studentId } = req.body;

  try {
    const existingSubmission = await SubmittedChallenge.findOne({
      challenge: challengeId,
      student: studentId,
    });



    if (existingSubmission) {
      res.status(200).json({
        alreadySubmitted: true,
        existingSubmission
      });
    } else {
      res.status(200).json({
        alreadySubmitted: false,
      });
    }
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({
      message: 'Failed to check submission status',
    });
  }
};

exports.checkAlreadySuccess = async (req, res) => {
  const { studentId } = req.body;

  try {

    const existingSuccess = await SubmittedChallenge.find({
      student: studentId,
      status:"success"
    });

    console.log("existingSuccess",existingSuccess)

    if (existingSuccess) {
      res.status(200).json({
        existingSuccess
      });
    } else {
      res.status(200).json({
        alreadySubmitted: false,
      });
    }
  } catch (error) {
    console.error('Error checking submission status:', error);
    res.status(500).json({
      message: 'Failed to check submission status',
    });
  }
};

exports.getSubmittedChallenges = async (req, res) => {
  const { id: challengeId } = req.params;
  console.log("challengeId:", challengeId);

  try {
    // Fetch the challenges and populate the student and challenge fields
    const challenges = await SubmittedChallenge.find({ challenge: challengeId })
      .populate({
        path: 'student', // Populate the student field (the ObjectId reference)
        select: 'profile.name profile.email profile.phone' // Select specific fields from the profile subdocument
      })
      .populate({
        path: 'challenge', // Populate the challenge field
        select: 'name category level' // Select the 'name', 'category', and 'level' fields of the challenge
      });

    console.log("challenges:", challenges);
    res.status(200).json(challenges);  // Return the fetched challenges with populated data
  } catch (error) {
    res.status(500).json({
      message: "Error fetching challenges",
      error: error.message
    });
  }
};

exports.approveRequest = async (req, res) => {
  const { studentId, challengeId } = req.body;  // Extract studentId and challengeId from the request body
  try {
    // Find the challenge and update its status to 'success'
    const challenge = await SubmittedChallenge.findOneAndUpdate(
      { challenge: challengeId, student: studentId },
      { status: 'success' },  // Update the status to 'success'
      { new: true }  // Return the updated challenge
    );
    const challengeDetails = await Challenge.findById(challengeId);
    if (!challengeDetails) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.profile.coins += challengeDetails.coins;
    await student.save();


    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found or invalid student/challenge ID' });
    }

    res.status(200).json({ message: 'Challenge approved successfully', data: challenge });
  } catch (err) {
    console.error('Error approving challenge:', err);
    res.status(500).json({ message: 'Error approving challenge' });
  }
};

exports.rejectRequest = async (req, res) => {
  const { studentId, challengeId } = req.body;  // Extract studentId and challengeId from the request body
  try {
    // Find the challenge and update its status to 'success'
    const challengeDetails = await Challenge.findById(challengeId);
    if (!challengeDetails) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const challenge = await SubmittedChallenge.findOneAndUpdate(
      { challenge: challengeId, student: studentId },
      { status: 'rejected' },  // Update the status to 'success'
      { new: true }  // Return the updated challenge
    );

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found or invalid student/challenge ID' });
    }

    res.status(200).json({ message: 'Challenge Rejected successfully', data: challenge });
  } catch (err) {
    console.error('Error approving challenge:', err);
    res.status(500).json({ message: 'Error approving challenge' });
  }
};

exports.getSubmittedChallengesCount = async (req, res) => {
  try {
    const studentId = req.user._id;
    console.log('Student ID:', studentId); // Log student ID
    if (!studentId) {
      return res.status(400).json({ message: 'Student not authenticated' });
    }
    const count = await SubmittedChallenge.countDocuments({ student: studentId, status: 'success',});
    console.log('Submitted Challenges Count:', count); // Log submitted challenges count
    res.json({ count });
  } catch (err) {
    console.error('Error fetching submitted challenges count:', err); // Log the error
    res.status(500).json({ message: 'Server error' });
  }
};


















