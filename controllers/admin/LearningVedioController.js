// controllers/videoController.js

const Video = require("../../model/admin/LearningVedio");

// Create a new video
const addVideo = async (req, res) => {
  try {
    const { videoTitle, videoCategory, videoLink } = req.body;

    const newVideo = new Video({
      videoTitle,
      videoCategory,
      videoLink,
    });

    await newVideo.save();
    res.status(201).json(newVideo);
  } catch (error) {
    console.error("Error adding video:", error);
    res.status(500).json({ message: "Error adding video" });
  }
};

// Update an existing video
const updateVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { videoTitle, videoCategory, videoLink } = req.body;

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { videoTitle, videoCategory, videoLink },
      { new: true }
    );

    if (!updatedVideo) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json(updatedVideo);
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ message: "Error updating video" });
  }
};

const getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching videos", error });
  }
};

const deleteVideo = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedVideo = await Video.findByIdAndDelete(id);
    if (!deletedVideo) {
      return res.status(404).json({ message: "Video deleted successfully." });
    }
    res.status(200).json({ message: "Video deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred while deleting the video.", error });
  }
};

module.exports = { addVideo, updateVideo, getAllVideos, deleteVideo };
