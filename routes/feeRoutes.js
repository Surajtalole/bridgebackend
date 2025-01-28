const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware")
const { addFees, getFees } = require("../controllers/feeController");

const router = express.Router();

// Routes
router.post("/fees", addFees); 
router.get("/fees",authMiddleware, getFees); 

module.exports = router;
