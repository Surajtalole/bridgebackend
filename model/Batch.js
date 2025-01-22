const mongoose = require("mongoose");
const academies = require("./Academies")

const batchSchema = new mongoose.Schema({
  batchName: { type: String, required: true },
  sport:{type: String},
  batchId: { type: String, required: true, unique: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  planType: { type: String, required: true },
  price: { type: Number, required: true },
  academyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'academies',  // Make sure this matches your model name
    required: true 
  },
  enrolledStudents: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
      studentbatchid: {
        type: String,
        unique:true,
        required: true,
      },
    },
  ],
  
  
});

module.exports = mongoose.model("Batch", batchSchema);
