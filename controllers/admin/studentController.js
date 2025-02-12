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

exports.verifyStudentRequest = async (req, res) => {
  const { stdid, reqid } = req.params;
  console.log(`Received request to verify student: stdid=${stdid}, reqid=${reqid}`);

  try {
    // Find the student and check if batchDetails & requests exist
    const student = await Student.findById(stdid);
    if (!student) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if batchDetails exist
    const batch = student.batchDetails.find(batch => 
      batch.requests.some(request => request._id.toString() === reqid)
    );

    if (!batch) {
      console.log("No matching request found in batchDetails");
      return res.status(404).json({ message: "Request not found in batchDetails" });
    }

    // Perform the update

    // Ensure batchDetails exists and has at least one batch with requests
    if (!student || !student.batchDetails || student.batchDetails.length === 0) {
      throw new Error("No batchDetails found for the student");
    }
    
    const batchIndex = student.batchDetails.findIndex(batch => 
      batch.requests.some(request => request._id.toString() === reqid)
    );
    
    if (batchIndex === -1) {
      throw new Error("No matching request found in batchDetails");
    }
    
    // Proceed with the update
    const result = await Student.updateOne(
      { _id: stdid, [`batchDetails.${batchIndex}.requests._id`]: reqid },
      { $set: { [`batchDetails.${batchIndex}.requests.$.verify`]: true } }
    );
    

    console.log("MongoDB update result:", result);

    if (result.modifiedCount > 0) {
      console.log("Student verification successful");
      res.json({ message: "Student verified" });
    } else {
      console.log("No matching student or request found for verification");
      res.status(404).json({ message: "No matching student or request found" });
    }
  } catch (error) {
    console.error("Error verifying student:", error);
    res.status(500).json({ message: "Error verifying student", error: error.message });
  }
};

exports.markAsPaid = async (req, res) => {
  const { studentId, batchId } = req.body;
  console.log(`Received request to mark payment as paid: studentId=${studentId}, batchId=${batchId}`);

  try {
    // Find the student
    const student = await Student.findById(studentId);
    if (!student) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the batch inside batchDetails
    const batchIndex = student.batchDetails.findIndex(batch => batch.batchid.toString() === batchId);
    if (batchIndex === -1) {
      console.log("Batch not found");
      return res.status(404).json({ message: "Batch not found for this student" });
    }

    // Update the payment status to "paid"
    student.batchDetails[batchIndex].fees.paymentStatus = "paid";

    // Save the updated student document
    await student.save();

    console.log(`Payment marked as paid for student ${studentId}, batch ${batchId}`);
    return res.json({ success: true, message: "Payment marked as paid" });

  } catch (error) {
    console.error("Error marking payment as paid:", error);
    return res.status(500).json({ message: "Error marking payment as paid", error: error.message });
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
      feesData

    } = req.body;

    console.log("req.body",req.body)

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
    student.profile.batchDetails

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

    // Check if fees object is provided and extract extras
    console.log("Received fees data:", req.body.fees);
    const parsedFees = JSON.parse(req.body.fees);  // This should now work if you pass the fees as JSON

    const academyCoach = req.user._id;

    console.log("Received data:", {
      studentName,
      studentacademyid,
      gender,
      dob,
      batch,
      contactNumber,
      parentsContactNumber,
      address
    });

    // Find the coach and academy associated with the current coach
    const coach = await Coach.findById(academyCoach).populate("academyId", "name");
    if (!coach || !coach.academyId) {
      console.log("No associated academy found for coach:", academyCoach);
      return res.status(400).json({ message: "Coach does not have an associated academy" });
    }
    console.log("Found coach's academy:", coach.academyId.name);

    // Find the batch associated with the given batch ID
    const batchh = await Batch.findById(batch);
    console.log("Batch found:", batchh);

    // Check if the student academy ID is unique
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

    const finalDob = dob || null;

    // Handle profile image if present
    if (req.file) {
      console.log("File received for profile image");

      const fileName = Date.now() + path.extname(req.file.originalname);
      const image = await uploadProfileImageToFTP(req.file.buffer, fileName);

      // Create a new student document
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
          coachacademyid: batchh.batchcoach,
          batchid: batch,
          batchId: batchh.batchId,
          admissionDate: new Date(),
          isActive: true,
          fees: parsedFees,  // Set the parsed fees object

        },

      });

      try {
        // Save the student data to the database
        const savedStudent = await newStudent.save();
        console.log("New student saved:", savedStudent.fees);

        // Find the batch and associate the student with it
        const batchData = await Batch.findById(batch);
        if (!batchData) {
          console.log("Batch not found:", batch);
          throw new Error("Batch not found");
        }

        // Add the student to the enrolled students of the batch
        batchData.enrolledStudents.push({
          studentId: savedStudent._id,
          studentacademyid,
        });

        // Save the batch data
        await batchData.save();
        console.log("Student and batch association saved successfully");

        // Respond with success
        return res.status(200).json({
          status: true,
          message: "Student and fees added successfully",
          student: savedStudent,
        });
      } catch (error) {
        console.log("Error while saving student and batch:", error);
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




exports.completeStudentProfile = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      gender,
      dob,
      batch, // Batch ID
      contactNumber,
      parentsContactNumber,
      address,
    } = req.body;

    console.log("Received data:", {
      studentId,
      studentName,
      gender,
      dob,
      batch, // Batch ID
      contactNumber,
      parentsContactNumber,
      address,
    });

    if (req.file) {
      console.log("File received for profile image");

      const fileName = Date.now() + path.extname(req.file.originalname);
        const image = await uploadProfileImageToFTP(req.file.buffer, fileName);

    // Find the student by ID
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ status: false, message: "Student not found" });
    }

    // If the student doesn't have a profile, create a new one
    if (!student.profile) {
      student.profile = {}; // Create a new profile object if it doesn't exist
    }

    // Update the student profile with the received data
    student.profile.name = studentName || student.profile.name;
    student.profile.gender = gender || student.profile.gender;
    student.profile.dob = dob || student.profile.dob;
    student.profile.phone = contactNumber || student.profile.phone;
    student.profile.parentsContactNumber = parentsContactNumber || student.profile.parentsContactNumber;
    student.profile.address = address || student.profile.address;

    // Save the updated student document
    await student.save();

    // Respond with the updated student data
    res.status(200).json({
      status: true,
      message: "Student profile updated successfully",
      data: student,
    });
  } else {
    console.log("Profile image is missing");
    return res.status(400).json({ status: false, error: "Profile image is required" });
  }
  } catch (err) {
    console.error("Error adding student profile:", err);
    res.status(500).json({ status: false, message: "Server error" });
  }
};

exports.getStudentsByAcademy = async (req, res) => {
  try {
    const academyId = req.params.id;
    const coach = await Coach.findById(academyId);

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    if (coach.hasAcademy) {
      // Fetch all students for the academy that the coach is associated with
      const students = await Student.find({ academyId: coach.academyId });
      if (!students.length) {
        return res.status(404).json({ message: "No students found for this academy" });
      }
      return res.status(200).json({ students });
    } else {
      // Fetch students whose batchDetails array contains the coach's academy ID
      const students = await Student.find({
        "batchDetails.coachacademyid": coach.coachacademyid
      });
      if (!students.length) {
        return res.status(404).json({ message: "No students found for this coach's academy" });
      }
      return res.status(200).json({ students });
    }
  } catch (err) {
    console.error("Error fetching students:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getStudentsFeeStatus = async (req, res) => {
  try {
    const academyId = req.params.id;
    const coach = await Coach.findById(academyId);

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    let students;
    if (coach.hasAcademy) {
      // Fetch all students associated with the coach's academy
      students = await Student.find({ academyId: coach.academyId });
    } else {
      // Fetch students whose batchDetails array contains the coach's academy ID
      students = await Student.find({
        "batchDetails.coachacademyid": coach.coachacademyid,
      });
    }

    if (!students.length) {
      return res.status(404).json({ message: "No students found" });
    }

    // Extract required fee details for each student
    const studentFeeDetails = students.map((student) => {
      return {
        studentId:student._id,
        name: student.profile?.name || "Unknown",
        fees: student.batchDetails.map((batch) => ({
          batchId: batch.batchid,
          total: batch.fees.total,
          dueDate: batch.fees.dueDate,
          paymentLink: batch.fees.paymentLink,
          paymentStatus: batch.fees.paymentStatus,
        })),
      };
    });

    return res.status(200).json({ students: studentFeeDetails });
  } catch (err) {
    console.error("Error fetching students:", err);
    return res.status(500).json({ message: "Server error" });
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
      feesData
    } = req.body;

    console.log("feesData",feesData)

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
          fees: {
            basePrice: feesData.basePrice || 0,
            advance: feesData.advance || 0,
            paymentMode: feesData.paymentMode || "cash", // Default payment mode
            extras: feesData.extras || [],
            total: feesData.total || 0,
            dueDate: feesData.dueDate || null,
            paymentLink: feesData.paymentLink || "",
            paymentStatus: feesData.paymentStatus || "unpaid",
          }        },
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


exports.getAllRequests = async (req, res) => {
  try {
    // Fetch students and populate requestedUser's profile.name and email
    const students = await Student.find({
      "batchDetails.requests": { $elemMatch: { requestedUser: { $exists: true } } }
    }).populate({
      path: "batchDetails.requests.requestedUser",
      select: "profile.name email" // Fetch profile.name and email
    });

    console.log("Students with Requests:", students);

    if (!students.length) {
      return res.status(404).json({ message: "No requests found" });
    }

    // Format response to include requested user details & sort requests by createdAt (newest first)
    const formattedStudents = students.map(student => ({
      _id: student._id,
      name: student.profile.name,
      email: student.email,
      batchDetails: student.batchDetails.map(batch => ({
        batchId: batch.batchId,
        requests: batch.requests
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // ✅ Sort requests by newest first
          .map(request => ({
            _id: request._id,
            requestedUser: request.requestedUser
              ? { name: request.requestedUser.profile.name, email: request.requestedUser.email }
              : null,
            verify: request.verify,
            createdAt: request.createdAt
          }))
      }))
    }));
    console.log("formattedStudents",formattedStudents)

    res.status(200).json({ students: formattedStudents });
  } catch (err) {
    console.error("Error fetching requests:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};





