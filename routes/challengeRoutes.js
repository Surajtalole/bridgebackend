const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');

const {createChallenge,getChallenges,togglePublish,deleteChallenge,updateChallenge,uploadChallengeVideo,checkAlreadySubmitted,getSubmittedChallenges,approveRequest,getPublishedChallenges } = require('../controllers/challengeController');

// Set up Multer storage configuration for video files
const storage = multer.memoryStorage(); 

const fileFilter = (req, file, cb) => {
  // Allow only video files (e.g., mp4, avi, mov)
  const videoTypes = /mp4|avi|mov|mkv/;

  const mimeType = videoTypes.test(file.mimetype);
  const extname = videoTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extname) {
    return cb(null, true); // Allow video file
  }
  cb(new Error('Invalid file type. Only video files are allowed.'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // Max size 100MB
});

router.post('/postChallenges', createChallenge);

router.get('/getChallenges', getChallenges);
router.get('/published-challenges/:id', getPublishedChallenges);

router.patch('/toggle-publish/:challengeId', togglePublish);
router.delete('/deleteChallenge/:id', deleteChallenge);
router.put('/updatechallenge/:id', updateChallenge);

router.post('/uploadchallengevideo',authMiddleware, upload.single('video'), uploadChallengeVideo);
router.post('/checkalreadysubmitted', checkAlreadySubmitted);
router.get('/getsubmittedchallenges/:id', getSubmittedChallenges);
router.put('/approverequest', approveRequest);












module.exports = router;
