const mongoose = require('mongoose');
const coach = require('../model/Coach')


const AcademyProfileSchema = new mongoose.Schema({
  owner: {type:mongoose.Schema.Types.ObjectId, ref: 'coach' },
  name: { type: String },
  address: { type: String,  },
  locationPin: { type: String, },
  timings: { type: String,  },
  availableDays: { type: [String],  },
  sports: { type: [String],  }, 
  description: { type: String,  },
  pricing: { type: String,  },
  gallery: { type: [String], default: [] }, 
  verify: { type: Boolean, default: false },
  
}, { _id: true  });

module.exports = mongoose.model('academies', AcademyProfileSchema);