const express = require("express");
const {
  addVideo,
  updateVideo,
  getAllVideos,
  deleteVideo
} = require("../../controllers/admin/LearningVedioController");

const router = express.Router();

router.post("/uploadVedio", addVideo);

router.put("/updateVedio/:videoId", updateVideo);

router.get('/getVideos',getAllVideos);
router.delete("/videos/:id", deleteVideo);

module.exports = router;
