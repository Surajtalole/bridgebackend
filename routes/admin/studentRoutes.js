const express = require('express');
const { getAllStudents ,verifyStudent,editStudent ,deleteStudent,addStudent,getStudentsByAcademy,addStudentFromAdminPannel} = require('../../controllers/admin/studentController');
const authMiddleware = require('../../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
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

router.get('/students',authMiddleware, getAllStudents);
router.get('/studentsbyacademy/:id', getStudentsByAcademy);



router.put('/students/:id/verify',authMiddleware, verifyStudent);
router.put('/edit/:id',authMiddleware, editStudent);
router.delete('/delete/:id', authMiddleware,deleteStudent);
router.delete('/delete/:id', authMiddleware,deleteStudent);
router.post('/addStudent',upload.single('profileImage'),authMiddleware, addStudent);
router.post('/addStudentFromAdmin', authMiddleware, addStudentFromAdminPannel);





module.exports = router;
