const express = require("express");
const { addAnalytics, getAnalytics,getParameters,getParameter,addAnalyticsByCoach } = require("../controllers/analyticsController");
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.put("/addAnalytics/:studentId", addAnalytics);
router.put("/addAnalyticsByCoach/:studentId",authMiddleware, addAnalyticsByCoach);



router.get("/getanalytic/:studentId/:batchId",authMiddleware, getAnalytics);
router.get("/:userId/:academyId/parameters",authMiddleware, getParameters);
router.get("/:userId/parameters",authMiddleware, getParameter);



module.exports = router;




