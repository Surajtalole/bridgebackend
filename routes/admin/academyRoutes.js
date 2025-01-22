const express = require('express');
const router = express.Router();
const { getAcademyProfiles,verifyAcademy,deleteAcademy,editAcademyFromAdmin  } = require('../../controllers/admin/academyController');
const authMiddleware = require('../../middlewares/authMiddleware');


router.get('/academy',authMiddleware, getAcademyProfiles);
router.put('/academy/verify/:academyId', verifyAcademy);
router.delete('/academy/:id', deleteAcademy);
router.put('/editAcademyFromAdmin', editAcademyFromAdmin);




module.exports = router;
