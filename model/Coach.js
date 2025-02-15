const mongoose = require("mongoose");
const academies = require("./Academies");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String,  unique: true, sparse: true },
    phone: { type: String },
    password: { type: String },
    role: { type: String, enum: ["academy", "coach", "admin"], required: true },
    profile: {
      name: { type: String },
      email: { type: String, unique: true },
      bio: { type: String },
      sport: { type: String },
      profilePicture: { type: String },
      certificates: {
        type: [String],
        required: false,
      },
      designation: { type: String },
      serviceDetails: { type: String },
      verify: { type: Boolean, default: false },
    },
    hasAcademy: { type: Boolean },
    otp: { type: String }, // For OTP
    otpExpiration: { type: Date }, // For OTP expiration

    //this academyId means which academy coach owns
    academyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "academies",
      default: null,
    },

    teachesAtAcademyId: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "academies",
    },
    coachacademyid:{type: String},
    contactId:{type:String},

    bankDetails: {
      bankName: { type: String },
      accountHolderName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      upiId: { type: String },
    },
    isActive: { type: Boolean, default: true },
    analysisparameter: {
      type: [String], // Array of strings
      default: [],    // Initialize as an empty array
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("coach", UserSchema);
