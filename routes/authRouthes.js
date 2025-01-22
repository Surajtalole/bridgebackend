const express = require('express');
const { signup,login,forgetpassword,verifyOTP,setNewPass,deleteAccount,currentUser,addAcademyFromAdmin } = require('../controllers/authControllers');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/addacademyfromadmin', addAcademyFromAdmin);
router.post('/login', login);
router.post('/forgetpassword', forgetpassword)
router.post('/verifyotp', verifyOTP)
router.post('/newpassword', setNewPass)
router.post('/deleteaccount',authMiddleware,deleteAccount)
router.get('/currentuser',authMiddleware,currentUser)





 module.exports = router;
