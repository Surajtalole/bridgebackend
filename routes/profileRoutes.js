// Import necessary libraries
const express = require('express');
const multer = require('multer');
const path = require('path');
const Coach = require('../model/Coach'); // Import your Coach model
const router = express.Router(); // Corrected router initialization
const authMiddleware = require('../middlewares/authMiddleware'); // Import your authentication middleware
const uploadProfileImageToFTP = require('../controllers/ftpController/profileFtpController');
const uploadCertificate = require('../controllers/ftpController/certificateFtpController');


// Set up Multer storage configuration
const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  // Allow images and PDFs
  const imageTypes = /jpeg|jpg|png|gif|bmp|webp/;
  const pdfTypes = /pdf/;

  const mimeType = imageTypes.test(file.mimetype) || pdfTypes.test(file.mimetype);
  const extname = imageTypes.test(path.extname(file.originalname).toLowerCase()) || pdfTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extname) {
    return cb(null, true); 
  }
  cb(new Error('Invalid file type. Only image files and PDFs are allowed.'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});



router.put('/profile', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'certificate_1', maxCount: 1 },
  { name: 'certificate_2', maxCount: 1 },
  { name: 'certificate_3', maxCount: 1 }
]), async (req, res) => {
  try {
    const { 
      name, 
      coachacademyid, 
      phone, 
      bio, 
      sport, 
      parameters = [] // Default to empty array if parameters are not provided
    } = req.body;

    console.log(name, coachacademyid, phone, bio, sport, parameters);

    const coach = await Coach.findById(req.user._id);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Update all fields if they are provided
    if (name) coach.name = name;
    // if (coach.coachacademyid !== coachacademyid) {
    //   return res.status(400).json({ message: 'coachacademyid cannot be changed' });
    // }
    if (coachacademyid) coach.coachacademyid = coachacademyid;
    if (phone) coach.phone = phone;
    if (bio) coach.profile.bio = bio;
    if (sport) coach.profile.sport = sport;

    // Handle parameters array: If it doesn't exist, create it as an empty array
    if (!coach.analysisparameter) {
      coach.analysisparameter = [];
    }
    if (parameters.length > 0) {
      coach.analysisparameter = [...coach.analysisparameter, ...parameters];
    }

    // Handle the profile image if provided
    if (req.files && req.files.image) {
      const imageBuffer = req.files.image[0].buffer;
      const imageName = `profile_${coach._id}_${Date.now()}.jpg`;
      const imageUrl = await uploadProfileImageToFTP(imageBuffer, imageName);
      coach.profile.profilePicture = imageUrl;
    }

    // Handle certificates if provided
    let existingCertificates = coach.profile.certificates || [];
    const newCertificateUrls = [];

    for (let i = 1; i <= 3; i++) {
      if (req.files && req.files[`certificate_${i}`]) {
        const cert = req.files[`certificate_${i}`][0];
        const certificateBuffer = cert.buffer;
        const certificateName = `${coach._id}_certificate_${i}_${Date.now()}${path.extname(cert.originalname).toLowerCase()}`;
        const certificateUrl = await uploadCertificate(certificateBuffer, certificateName);
        console.log("Certificate uploaded:", certificateUrl);
        newCertificateUrls.push(certificateUrl);
      }
    }

    // Append the new certificates to the existing ones
    coach.profile.certificates = [...existingCertificates, ...newCertificateUrls];

    // Save the updated coach data
    await coach.save();

    res.status(200).json({ message: 'Profile updated successfully', data: coach });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});




router.post('/addcoachfromacacdemy', authMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'certificate_1', maxCount: 1 },
  { name: 'certificate_2', maxCount: 1 },
  { name: 'certificate_3', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, coachacademyid, phone, bio, sport, parameters = [] } = req.body; // Extract parameters
    console.log(name, coachacademyid, phone, bio, sport, parameters);

    const coach = await Coach.findById(req.user._id);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    if (coachacademyid) {
      const existingCoach = await Coach.findOne({ coachacademyid });
      if (existingCoach) {
        return res.status(400).json({ message: `Coach with Academy ID ${coachacademyid} already exists.` });
      }
    }
    // if (coachacademyid && coach.coachacademyid !== coachacademyid) {
    //   return res.status(400).json({ message: 'coachacademyid cannot be changed' });
    // }

    let imageUrl
    if (req.files && req.files.image) {
      const imageBuffer = req.files.image[0].buffer;
      const imageName = `profile_${coach._id}_${Date.now()}.jpg`;
      imageUrl = await uploadProfileImageToFTP(imageBuffer, imageName);
      // coach.profile.profilePicture = imageUrl;
    }

const certificateUrls  = [];
for (let i = 1; i <= 3; i++) {
  if (req.files && req.files[`certificate_${i}`]) {
    const cert = req.files[`certificate_${i}`][0];
    const certificateBuffer = cert.buffer;
    const certificateName = `${coach._id}_certificate_${i}_${Date.now()}${path.extname(cert.originalname).toLowerCase()}`;
    const certificateUrl = await uploadCertificate(certificateBuffer, certificateName);
    console.log("Certificate uploaded:", certificateUrl);
    certificateUrls.push(certificateUrl);
  }
}
const parsedParameters = Array.isArray(parameters)
        ? parameters.map((param) => param.trim()).filter(Boolean)
        : [];


    // Handle certificates
    // let existingCertificates = coach.profile.certificates || [];

    const newCoach = new Coach({
      name,
      coachacademyid,
      phone,
      profile: {
        sport: sport,
        profilePicture: imageUrl,
        bio,
        certificates: certificateUrls, // Attach certificates
      },
      analysisparameter: parsedParameters, // Attach analysis parameters
      teachesAtAcademyId: [coach.academyId],
      hasAcademy: false,
      role: 'coach',
    });
    

    // Save the coach to the database
    await newCoach.save();

    res.status(200).json({ message: 'Coach created successfully', data:coach});
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router; 