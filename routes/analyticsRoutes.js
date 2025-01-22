const express = require("express");
const { addAnalytics, getAnalytics } = require("../controllers/analyticsController");
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.put("/addAnalytics/:studentId", addAnalytics);

router.get("/getanalytic",authMiddleware, getAnalytics);

module.exports = router;
