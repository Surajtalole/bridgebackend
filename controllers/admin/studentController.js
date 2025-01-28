const Student = require("../../model/Student");
const Coach = require("../../model/Coach");
const Academy = require("../../model/Academies");
const uploadProfileImageToFTP = require("../ftpController/profileFtpController");
const path = require("path");
const bcrypt = require("bcrypt");
const Batch = require("../../model/Batch");

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('academyId'); // Populate academyId with its associated data
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error });
  }
};


exports.verifyStudent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const student = await Student.findByIdAndUpdate(
      id,
      { verify: true },
      { new: true }
    );
    if (!student) {
      return res.status(402).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student veriied successfully", student });
  } catch (error) {
    res.status(500).json({ message: "Error Verifying student", error });
  }
};
exports.editStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      academyName,
      parentsContactNumber,
      gender,
      dob,
    } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.profile) {
      student.profile = {};
    }

    student.profile.name = name;
    student.email = email;
    student.profile.phone = phone;
    student.profile.dob = dob;
    student.academyName = academyName;
    student.role = role;
    student.profile.parentsContactNumber = parentsContactNumber;
    student.profile.gender = gender;

    await student.save();
    console.log('student',student)
    res.json({ message: "Student updated successfully", student });
  } catch (error) {
    console.error("Error updating student:", error);
    res
      .status(500)
      .json({ message: "Error updating student", error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await Student.findByIdAndDelete(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.addStudent = async (req, res) => {
  try {
    const {
      studentName,
      studentacademyid,
      gender,
      dob,
      batch, // Batch ID
      contactNumber,
      parentsContactNumber,
      address,
    } = req.body;
    const academyCoach = req.user._id;

    console.log("Received data:", {
      studentName,
      studentacademyid,
      gender,
      dob,
      batch,
      contactNumber,
      parentsContactNumber,
      address,
    });
    

    const coach = await Coach.findById(academyCoach).populate("academyId", "name");
    if (!coach || !coach.academyId) {
      console.log("No associated academy found for coach:", academyCoach);
      return res.status(400).json({ message: "Coach does not have an associated academy" });
    }
    console.log("Found coach's academy:", coach.academyId.name);

    const batchh = await Batch.findById(batch)
    console.log("Batche",batchh);


    const finalDob = dob || null;

    // Check if `studentacademyid` is unique
    const existingStudent = await Student.findOne({
      "batchDetails.studentacademyid": studentacademyid,
    });

    if (existingStudent) {
      console.log("Duplicate studentacademyid found:", studentacademyid);
      return res.status(400).json({
        status: false,
        message: `StudentAcademyID ${studentacademyid} already exists.`,
      });
    }

    if (req.file) {
      console.log("File received for profile image");

      const fileName = Date.now() + path.extname(req.file.originalname);
        const image = await uploadProfileImageToFTP(req.file.buffer, fileName);

      
      const newStudent = new Student({
        academyId: [coach.academyId],
        academyName: [coach.academyId.name],
        profile: {
          name: studentName,
          phone: contactNumber,
          gender,
          batch,
          parentsContactNumber,
          address,
          dob: finalDob,
          image
        },
        batchDetails: {
          studentacademyid,
          coachacademyid:batchh.batchcoach,
          batchid: batch,
          batchId:batchh.batchId,
          admissionDate: new Date(),
          isActive: true,
        },
      });

      try {
        const savedStudent = await newStudent.save();
        console.log("New student saved:", savedStudent);

        const batchData = await Batch.findById(batch);
        if (!batchData) {
          console.log("Batch not found:", batch);
          throw new Error("Batch not found");
        }

        batchData.enrolledStudents.push({
          studentId: savedStudent._id,
          studentacademyid,
        });

        await batchData.save();
        console.log("Student and batch association saved successfully");

        return res.status(200).json({
          status: true,
          message: "Student added successfully",
          student: savedStudent,
        });
      } catch (error) {
        console.log("Error while saving student and batch:");

        console.error("Error while saving student and batch:", error);
        return res.status(500).json({ status: false, message: "Server error" });
      }
    } else {
      console.log("Profile image is missing");
      return res.status(400).json({ status: false, error: "Profile image is required" });
    }
  } catch (err) {
    console.log("Error hereee")
    console.error("Error adding student:", err);
    res.status(500).json({ status: false, message: "Server error" });
  }
};





exports.getStudentsByAcademy = async (req, res) => {
  try {
    const academyId = req.params.id;
    const coach = await Coach.findById(academyId);
    const academyid = coach.academyId;
    const students = await Student.find({ academyId: academyid });
    console.log("students", students);

    if (!students.length) {
      return res
        .status(404)
        .json({ message: "No students found for this academy" });
    }

    res.status(200).json({ students });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.addStudentFromAdminPannel = async (req, res) => {
  try {
    const {
      name,
      batchId,
      studentacademyId,
      phone,
      role,
      academyName,
      parentsContactNumber,
      gender,
      dob,
    } = req.body;

    // Step 1: Find the student by studentacademyId in the batchDetails
    const existingStudent = await Student.findOne({
      "batchDetails.studentacademyid": studentacademyId,
    });

    if (existingStudent) {
      return res.status(400).json({
        message: "This student is already registered in the batch.",
      });
    }

    // Step 2: Find the academyId from the academy name
    const academy = await Academy.findOne({ name: academyName });
    if (!academy) {
      return res.status(400).json({ message: "Academy not found" });
    }

    const batch = await Batch.findById(batchId)


    // Step 3: Create a new student record
    const newStudent = new Student({
      academyName: [academyName],
      academyId: [academy._id],
      role,
      profile: {
        name,
        phone,
        parentsContactNumber,
        gender,
        dob, // Include dob here
      },
      batchDetails: [
        {
          studentacademyid: studentacademyId,
          coachacademyid: batch.batchcoach, // Assuming this is fetched from the academy
          batchid: batchId,
          batchId: batch.batchId, // The batch ID
          admissionDate: new Date(), // Set the current date as admission date
          isActive: true,
        },
      ],
    });

    // Save the new student to the database
    await newStudent.save();

    batch.enrolledStudents.push({
      studentId: newStudent._id,
      studentacademyid:studentacademyId
    });

    await batch.save(); 
    return res.status(201).json({
      message: "Student added successfully",
      student: newStudent,
    });
  } catch (err) {
    console.error("Error adding student:", err);
    res.status(500).json({ message: "Server error" });
  }
};

