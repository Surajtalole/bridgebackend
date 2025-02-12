const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');

const {createChallenge,getSubmittedChallengesCount , checkAlreadySuccess,getChallenges,togglePublish,deleteChallenge,updateChallenge,uploadChallengeVideo,checkAlreadySubmitted,getSubmittedChallenges,approveRequest,getPublishedChallenges, rejectRequest } = require('../controllers/challengeController');

// Set up Multer storage configuration for video files

// Set up Multer storage configuration
const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  // Allow image files (e.g., jpg, jpeg, png, gif)
  const imageTypes = /jpeg|jpg|png|gif/;
  // Allow video files (e.g., mp4, avi, mov, mkv)
  const videoTypes = /mp4|avi|mov|mkv/;

  const mimeType = imageTypes.test(file.mimetype) || videoTypes.test(file.mimetype);
  const extname = imageTypes.test(path.extname(file.originalname).toLowerCase()) || videoTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extname) {
    return cb(null, true); // Allow the file
  }

  // Reject file if it's neither an image nor a video
  cb(new Error('Invalid file type. Only image or video files are allowed.'));
};

// Define multer middleware with the updated file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // Max size 100MB
});


router.post('/postChallenges',upload.single('image'), createChallenge);

router.get('/getChallenges', getChallenges);
router.get('/published-challenges/:id', getPublishedChallenges);

router.patch('/toggle-publish/:challengeId', togglePublish);
router.delete('/deleteChallenge/:id', deleteChallenge);
router.put('/updatechallenge/:id', updateChallenge);

router.post('/uploadchallengevideo',authMiddleware, upload.single('video'), uploadChallengeVideo);
router.post('/checkalreadysubmitted', checkAlreadySubmitted);
router.post('/checkalreadysuccess', checkAlreadySuccess);


router.get('/getsubmittedchallenges/:id', getSubmittedChallenges);
router.put('/approverequest', approveRequest);
router.put('/rejectrequest', rejectRequest);
router.get('/submitted-challenges-count',authMiddleware, getSubmittedChallengesCount);













module.exports = router;
