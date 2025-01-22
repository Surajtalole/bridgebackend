const Student = require("../../model/Student");
const Coach = require("../../model/Coach");
const Academy = require("../../model/Academies");
const uploadProfileImageToFTP = require("../ftpController/profileFtpController");
const path = require("path");
const bcrypt = require("bcrypt");
const Batch = require("../../model/Batch");

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
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
      studentbatchid,
      gender,
      dob,
      batch, // Batch ID
      contactNumber,
      parentsContactNumber,
      address,
    } = req.body;
    const academyCoach = req.user._id;


    // Log incoming request data
    console.log("Received data:", {
      studentName,
      studentbatchid,
      gender,
      dob,
      batch,
      contactNumber,
      parentsContactNumber,
      address,
    });

    // Fetch coach's academy
    const coach = await Coach.findById(academyCoach).populate("academyId", "name");
    if (!coach || !coach.academyId) {
      console.log("No associated academy found for coach:", academyCoach);
      return res.status(400).json({ message: "Coach does not have an associated academy" });
    }
    console.log("Found coach's academy:", coach.academyId.name);

    const finalDob = dob || null;

    if (req.file) {
      console.log("File received for profile image");

      const fileName = Date.now() + path.extname(req.file.originalname);
      const image = await uploadProfileImageToFTP(req.file.buffer, fileName);

      // Create a new student
      const newStudent = new Student({
        academyId: coach.academyId,
        academyName: coach.academyId.name,
        profile: {
          name: studentName,
          phone: contactNumber,
          gender,
          batch,
          parentsContactNumber,
          address,
          dob: finalDob,
          image,
        },
        batchDetails: {
          studentbatchid,
          batchId: batch,
          admissionDate: new Date(),
          isActive: true,
        },
      });

      try {
        // Save the student
        const savedStudent = await newStudent.save();
        console.log("New student saved:", savedStudent);

        // Fetch the batch and update enrolledStudents
        const batchData = await Batch.findById(batch);
        if (!batchData) {
          console.log("Batch not found:", batch);
          throw new Error("Batch not found");
        }

        // Add studentId and studentbatchid to the batch
        batchData.enrolledStudents.push({
          studentId: savedStudent._id,
          studentbatchid,
        });

        // Save the batch
        await batchData.save();
        console.log("Student and batch association saved successfully");

        return res.status(200).json({
          status: true,
          message: "Student added successfully",
          student: savedStudent,
        });
      } catch (error) {
        console.error("Error while saving student and batch:", error);
        return res.status(500).json({ status: false, message: "Server error" });
      }
    } else {
      console.log("Profile image is missing");
      return res.status(400).json({ status: false, error: "Profile image is required" });
    }
  } catch (err) {
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
      email,
      phone,
      role,
      password,
      academyName,
      parentsContactNumber,
      gender,
      dob,
    } = req.body;

    // Hash the password before saving
    const existingStudent = await Student.findOne({ email });
    const academyId = await Academy.findOne({ name: academyName });

    if (existingStudent) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = new Student({
      email,
      password: hashedPassword, // Save hashed password
      academyName,
      academyId:academyId._id,
      role,
      profile: {
        name,
        phone,
        parentsContactNumber,
        gender,
        dob, // Include dob here
      },
    });

    await newStudent.save();

    return res
      .status(201)
      .json({ message: "Student added successfully", student: newStudent });
  } catch (err) {
    console.error("Error adding student:", err);
    res.status(500).json({ message: "Server error" });
  }
};
