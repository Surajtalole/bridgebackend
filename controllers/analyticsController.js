const Student = require("../model/Student");

// Add or update analytics data
const addAnalytics = async (req, res) => {
  const { studentId } = req.params;
  const { testName, testResult, feedback } = req.body;

  try {
    // Find the student and update analytics data
    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          "analytics.testname": testName,
          "analytics.testResult": testResult,
          "analytics.feedback": feedback,
        },
      },
      { new: true } // Return the updated document
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Analytics updated successfully", student });
  } catch (error) {
    console.error("Error updating analytics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const getAnalytics = async (req, res) => {
  const  studentId  = req.user._id;
console.log("studentId",studentId)
  try {
    const student = await Student.findById(studentId, "analytics");
    // console.log("student",student)
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ analytics: student.analytics });
  } catch (error) {
    console.error("Error retrieving analytics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = {
  addAnalytics,
  getAnalytics,
};
