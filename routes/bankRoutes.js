const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { bankDetails } = require('../controllers/bankDetails');


const router = express.Router();


router.post('/edit-bank-details',authMiddleware,bankDetails);



module.exports = router;
