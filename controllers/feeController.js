const Student = require("../model/Student");

const addFees = async (req, res) => {
    try {
      const { studentId, fees } = req.body;
  
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      student.fees = fees;
      await student.save();
  
      res.status(200).json({ message: "Fees added successfully", student });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const getFees = async (req, res) => {
    try {
      const  studentId  = req.user._id;
  
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      res.status(200).json(student.fees);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  module.exports = { addFees, getFees };