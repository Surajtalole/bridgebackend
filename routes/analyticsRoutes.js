const express = require("express");
const { addAnalytics, getAnalytics,getParameters } = require("../controllers/analyticsController");
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.put("/addAnalytics/:studentId", addAnalytics);

router.get("/getanalytic/:studentId/:batchId",authMiddleware, getAnalytics);
router.get("/:userId/:academyId/parameters",authMiddleware, getParameters);


module.exports = router;




