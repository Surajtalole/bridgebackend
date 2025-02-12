const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a TrialRequest Schema
const trialRequestSchema = new Schema(
  {
    // References to other models (using ObjectId)
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student', // Assuming 'Student' is the name of the student model
      required: true
    },
    academyId: {
      type: Schema.Types.ObjectId,
      ref: 'academies', // Assuming 'Academy' is the name of the academy model
      required: true
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch', // Assuming 'Batch' is the name of the batch model
      required: true
    },

    // Trial session details
    // trialDate: {
    //   type: Date,
    //   required: true,
    // },
    trialTime: {
      type: String, // or you can use Date depending on your use case
      required: true,
    },
    
    // Status of the trial session
    status: {
      type: String,
      enum: ['requested', 'scheduled', 'expired', 'done', 'rescheduled'],
      default: 'requested',
      required: true,
    },

    // Timestamps
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    scheduledAt: {
      type: Date,
      default: null, // Default to null
    },
    expiredAt: {
      type: Date,
      default: null, // Default to null
    },
    rescheduledAt: {
      type: Date,
      default: null, // Default to null
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create and export the model
const TrialRequest = mongoose.model('TrialRequest', trialRequestSchema);

module.exports = TrialRequest;
``