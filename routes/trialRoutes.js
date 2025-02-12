const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { getTrials,assignSlot,getStudentsTrials,rescheduleSlot,trialDone,getTrialData } = require('../controllers/getTrial');

const router = express.Router();


router.get('/gettrials/:academyId',authMiddleware, getTrials);
router.get('/gettrials/:studentId/:batchId',authMiddleware, getTrialData);

router.post('/trials/assign-slot',authMiddleware, assignSlot);
router.put('/trials/reschedule-slot',authMiddleware, rescheduleSlot);
router.put('/trials/done',authMiddleware, trialDone);




router.get('/studenttrials/:StudentId',authMiddleware, getStudentsTrials);








module.exports = router;
