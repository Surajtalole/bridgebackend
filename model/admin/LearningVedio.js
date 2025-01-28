
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  videoTitle: { type: String, required: true },
  videoCategory: { type: String, required: true },
  videoLink: { type: String, required: true },
}, {
  timestamps: true,
});

const Video = mongoose.model('LearningVedio', videoSchema);

module.exports = Video;
