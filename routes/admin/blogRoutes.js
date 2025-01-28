const express = require('express');
const { addBlog,getBlogs,togglePublish,deleteBlog,updateBlog } = require('../../controllers/admin/blogController');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../../middlewares/authMiddleware');



// Multer configuration for file uploads
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

router.post('/addblogs', upload.single('image'), addBlog);


router.get('/getblogs',authMiddleware, getBlogs);
router.patch('/:id/toggle', togglePublish);
router.delete('/:id/deleteBlog', deleteBlog);
router.put('/blogs/:id',upload.single('image'), updateBlog);

module.exports = router;
