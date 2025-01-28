const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    bannerLink: { type: String }, 
    fromDate: { type: Date }, 
    toDate: { type: Date}, 
    bannerType: { type: String},
    // published: { type: Boolean, default: false },
    requestStatus:{type:Boolean, default: false},
    publishOption:{ type: String}
  },
  { timestamps: true }
);

// Create the Banner model using the schema
const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
