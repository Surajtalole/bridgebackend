const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getTrials,assignSlot } = require('../controllers/getTrial');

const router = express.Router();


router.get('/gettrials/:academyId',authMiddleware, getTrials);
router.post('/trials/assign-slot',authMiddleware, assignSlot);





module.exports = router;
