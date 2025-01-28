const express = require('express');
const { updateBankDetails } = require('../controllers/academyBankController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.put('/coaches/bank-details', authMiddleware, updateBankDetails);

module.exports = router;
