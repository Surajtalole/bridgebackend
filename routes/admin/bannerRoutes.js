const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadBanner, getBanners, deleteBanner, togglePublished, updateBanner,getBannersRoleWise } = require('../../controllers/admin/bannerController');
const {bannerPromotion} = require("../../controllers/bannerController")
const authMiddleware = require('../../middlewares/authMiddleware');

// const uploadDir = 'uploads';
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }


const storage = multer.memoryStorage(); // Store in memory (buffer)
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const mimeType = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
      return cb(null, true); // Accept the file
    }
    cb(new Error('Invalid file type. Only image files are allowed.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});


const router = express.Router();

// router.post('/add-banner', upload.single('image'), uploadBanner);
router.get('/banners/',authMiddleware, getBanners);
router.get('/banners/:role',authMiddleware, getBannersRoleWise);

getBannersRoleWise
router.delete('/banner/:id', deleteBanner);
router.put('/banner/:id/toggle', togglePublished);
router.put('/update-banner/:bannerId', upload.single('image'), updateBanner);
router.post('/bannerpromotion', upload.single('image'), bannerPromotion);

module.exports = router;
