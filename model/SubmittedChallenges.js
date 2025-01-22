const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submittedChallengeSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student', 
    required: true
  },
  challenge: {
    type: Schema.Types.ObjectId,
    ref: 'Challenge', 
    required: true
  },
  videoLink: {
    type: String, 
    required: true
  },
  status: {
    type: String, 
    default: 'under review'
  }
}, { timestamps: true }); 
module.exports = mongoose.model('SubmittedChallenge', submittedChallengeSchema);
