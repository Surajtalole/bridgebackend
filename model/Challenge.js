const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, required: true },
  category: { type: String, required: true },
  coins: { type: Number, required: true },
  level: { type: String, required: true },

  isPublish: { type: Boolean, default: false },
}, { timestamps: true });

const Challenge = mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
