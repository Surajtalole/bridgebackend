// routes/academyRoutes.js
const express = require('express');
const router = express.Router();
const { getCoachDetails,verifyCoach,addCoach, updateCoach,getAllCoachesDetails,getSportCoaches} = require('../../controllers/admin/coachController');
const authMiddleware = require('../../middlewares/authMiddleware');


// Route to get academy data based on role
router.get('/coach', authMiddleware, getCoachDetails);
router.get('/allcoach', authMiddleware, getAllCoachesDetails);

router.patch('/verify-coach/:coachId', verifyCoach);
router.post('/addcoachfromadmin', addCoach);
router.put('/editcoachfromadmin', updateCoach);
router.get('/fetchsportcoaches/:sport', authMiddleware, getSportCoaches);









module.exports = router;
