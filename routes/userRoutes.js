// routes/user.routes.js
const express = require('express');
const { getUserProfile, updateTrials } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profile',authMiddleware, getUserProfile);
router.post('/update-trials',authMiddleware, updateTrials);

module.exports = router;
