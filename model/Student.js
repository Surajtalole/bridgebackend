const mongoose = require("mongoose");
const Coach = require("./Coach");

const profileSchema = new mongoose.Schema(
  {
    name: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    phone: { type: String, unique: true },
    dob: { type: Date, default: null },
    parentsContactNumber: { type: String },
    address: { type: String },
    image: { type: String },
    totalPayments: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    trialsLeft: { type: Number, default: 0, required: true },
  },
  { timestamps: true }
);

const studentSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    password: { type: String },
    role: { type: String, default: "student" },
    referralCode: { type: String, unique: true },
    referredBy: { type: String },
    academyName: { type: String },
    academyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "academies",
    },
    verify: { type: Boolean, default: false },
    profile: { type: profileSchema },
    paymenthistory: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Payment",
    },
    batchDetails: [
      {
       
        studentbatchid: {
          type: String,
          // required: true,
          unique: true, // Ensures this field is unique
        },        
        batchId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Batch",
        },
        admissionDate: { type: Date },
        // startDate: { type: Date },
        // endDate: { type: Date },
        isActive: { type: Boolean },
      }
    ],
    otp: { type: String },
    otpExpiration: { type: Date },

    academyCoach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coach",
    },
    fees:{
      basePriceOfbatch:{type:Number, default:0},
      advance:{type:Number, default:0},
      paymentMode:{type:String},
      extras:[
        {
          name:{type:String},
          price:{type:Number}
        },
      ],
      remaining: { type: Number, default: 0 },
      dueDate:{type:String}
    },
    analytics:{
      testname:{type:String},
      testResult:{type:Number},
      feedback:{type:String},
    },
    accountStatus: { type: String },
    referralCoinsAwarded:{type:Boolean}

  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
