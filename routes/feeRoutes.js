const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware")
const { addFees, getFees,getFeesStatus } = require("../controllers/feeController");

const router = express.Router();

// Routes
router.post("/fees", addFees); 
router.get("/fees",authMiddleware, getFees); 
router.get("/fees/:userId", getFeesStatus); 



module.exports = router;
