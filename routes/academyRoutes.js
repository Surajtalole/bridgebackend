const express = require('express');
const { createOrUpdateAcademyProfile,editAcademyProfile,getCoaches } = require('../controllers/academyProfileController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const { getAcademyData,getAcademyByCoach } = require('../controllers/academyController');

const router = express.Router();

// File Upload Configuration
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
// });
// const upload = multer({ storage });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
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

// Routes
router.put(
  '/coaches/academy-profile',
  authMiddleware,
  upload.array('academyImage',10),
  createOrUpdateAcademyProfile
);
router.put(
  '/coaches/edit-academy-profile',
  authMiddleware,
  upload.fields([
    // { name: 'academyImage', maxCount: 1 },  // Handle single academy image
    { name: 'gallery', maxCount: 10 },      // Handle up to 10 gallery images
  ]),
  editAcademyProfile
);

router.get('/getAcademies', getAcademyData);
router.get('/getAcademiesByCoach',authMiddleware, getAcademyByCoach);
router.get('/getCoach/:userId', getCoaches);








module.exports = router;
