const express = require("express");
const { createBatch, getBatches,getAllBatches,enrollInTrial,getBatchesByAcademy  } = require("../controllers/batchController");
const authMiddleware = require("../middlewares/authMiddleware")

const router = express.Router();

router.post("/createBatch",authMiddleware, createBatch);

router.get("/getBatch/:userId",authMiddleware, getBatches);
router.get("/getBatchbyacademy/:academyId",authMiddleware, getBatchesByAcademy);


router.get("/allBatch", getAllBatches);
router.post('/enroll-trial', enrollInTrial);


module.exports = router;
