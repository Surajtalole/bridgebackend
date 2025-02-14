const express = require("express");
const { createBatch, getBatches,getAllBatches,enrollInTrial,getBatchesByAcademy,getBatchesForAdmin,getBatchesForCoachAdd,editBatch,deleteBatch,getStudentofBatch,getBatchesofStudent,getBatchUser } = require("../controllers/batchController");
const authMiddleware = require("../middlewares/authMiddleware")

const router = express.Router();

router.post("/createBatch",authMiddleware, createBatch);

router.put("/editBatch",authMiddleware, editBatch);
router.delete("/deleteBatch/:batchId",authMiddleware, deleteBatch);
router.get("/getBatchStudents/:userId", getBatchesofStudent);
router.get("/getBatchStudent/:batchId",authMiddleware, getStudentofBatch);
router.get("/user-batches", getBatchUser);






router.get("/getBatch/:userId",authMiddleware, getBatches);
router.get("/getBatchForAdmin/:academyId",authMiddleware, getBatchesForAdmin);
router.get("/getBatchForCoachAdd/:academyId/:sport",authMiddleware, getBatchesForCoachAdd);


router.get("/getBatch/:userId",authMiddleware, getBatches);
router.get("//getstudentbatch//:userId",authMiddleware, getBatches);





router.get("/getBatchbyacademy/:academyId",authMiddleware, getBatchesByAcademy);


router.get("/allBatch", getAllBatches);
router.post('/enroll-trial', enrollInTrial);


module.exports = router;
