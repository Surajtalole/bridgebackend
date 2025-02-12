const User = require("../model/Coach");
const Academy = require("../model/Academies");
const Student = require("../model/Student");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const generateReferralCode = () => {
  return crypto.randomBytes(3).toString("hex"); // Example: "abc123"
};

const generateUniqueCoachAcademyId = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";

  // Fetch existing IDs once to avoid repetitive database queries
  const existingIds = new Set(
    (await User.find({}, { coachacademyid: 1 })).map((user) => user.coachacademyid)
  );

  let coachacademyid;

  do {
    // Generate random ID
    const randomChars = Array.from({ length: 3 }, () =>
      characters.charAt(Math.floor(Math.random() * characters.length))
    ).join("");

    const randomDigits = Array.from({ length: 3 }, () =>
      digits.charAt(Math.floor(Math.random() * digits.length))
    ).join("");

    coachacademyid = `${randomChars}${randomDigits}`;
  } while (existingIds.has(coachacademyid)); // Check against the in-memory set

  return coachacademyid;
};

const generateUniqueAcademyId = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let academyId;
  let exists = true;

  while (exists) {
    // Generate 3 random uppercase letters
    const letters = Array.from({ length: 3 }, () => characters[Math.floor(Math.random() * characters.length)]).join("");

    // Generate 3 random numbers
    const digits = Array.from({ length: 3 }, () => numbers[Math.floor(Math.random() * numbers.length)]).join("");

    academyId = `${letters}${digits}`;

    // Check if academyId already exists
    const existingAcademy = await Academy.findOne({ academyId });
    if (!existingAcademy) {
      exists = false; // Unique ID found, exit loop
    }
  }

  return academyId;
};


exports.signup = async (req, res) => {
  const { email, password, finalRole, hasAcademy, referralCode, academyid } = req.body;

  console.log('email', password, finalRole, hasAcademy, referralCode, academyid)

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    let userRole = finalRole || "admin";

    if (userRole === "student") {
      // Check if the student already exists
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        return res.status(400).json({ message: "Email already registered as a student" });
      }
      console.log('existingStudent',existingStudent)

      const newReferralCode = generateReferralCode();
      let referrer = null;

      if (referralCode) {
        referrer = await Student.findOne({ referralCode });
        if (!referrer) {
          return res.status(400).json({ message: "Invalid referral code" });
        }

        if (!referrer.profile) {
          referrer.profile = { coins: 0 };
        }

        // Award coins only if they haven't been awarded before
        if (!referrer.referralCoinsAwarded) {
          const updatedCoins = (referrer.profile.coins || 0) + 100;

          await Student.updateOne(
            { _id: referrer._id },
            { $set: { "profile.coins": updatedCoins, referralCoinsAwarded: true } }
          );

          console.log("Coins awarded to referrer.");
        } else {
          console.log("Referrer has already been awarded referral coins.");
        }
      }

      if (academyid) {
        // Update existing student based on `studentacademyid`
        const updatedStudent = await Student.findOneAndUpdate(
          { "batchDetails.studentacademyid": academyid },
          {
            $set: {
              "batchDetails.$.isActive": true,
              email: email,
              password: hashedPassword,
              referralCode: newReferralCode,
              referredBy: referrer ? referrer.referralCode : null,
            },
          },
          { new: true }
        );

        if (updatedStudent) {
          return res.status(200).json({
            message: "Student updated successfully",
            student: updatedStudent,
            referralCode: newReferralCode,
          });
        }
      }

      // Create a new student if no `studentacademyid` matches
      const newStudent = await Student.create({
        email,
        password: hashedPassword,
        referralCode: newReferralCode,
        referredBy: referrer ? referrer.referralCode : null,
 
      });

      return res.status(201).json({
        message: "New student created successfully",
        student: newStudent,
        referralCode: newReferralCode,
      });
    }
     else if (userRole === "coach") {
      const existingCoach = await User.findOne({ email });
      if (existingCoach) {
        return res
          .status(400)
          .json({ message: "Email already registered as a coach" });
      }


      if (academyid) {
        console.log('academyid',academyid)
        // Update existing student based on `studentacademyid`
        const updatedCoach = await User.findOneAndUpdate(
          { "coachacademyid": academyid },
          {
            $set: {
              email: email,
              password: hashedPassword,
              // referralCode: newReferralCode,
              // referredBy: referrer ? referrer.referralCode : null,
            },
          },
          { new: true }
        );

        if (updatedCoach) {
          return res.status(200).json({
            message: "Coach updated successfully",
            coach: updatedCoach,
            // referralCode: newReferralCode,
          });
        }
      }

      // const coachacademyid = await generateUniqueCoachAcademyId();
      const newCoach = new User({
        email,
        password: hashedPassword,
        role: userRole,
        hasAcademy,
        // academyid, // Assign the generated ID
      });

      await newCoach.save();
      console.log(newCoach);

      if (!newCoach._id) {
        return res
          .status(400)
          .json({ message: "Failed to save coach, no _id found." });
      }

      if (hasAcademy) {
        // Create and save the Academy with the coach's _id as the owner
        const uniqueAcademyId = await generateUniqueAcademyId();

        // Create and save the Academy with the generated academyId
        const newAcademy = new Academy({
          owner: newCoach._id,
          academyid: uniqueAcademyId, // Assign unique ID
        });

        await newAcademy.save();

        // Update the coach profile with the academy ID
        newCoach.academyId = newAcademy._id;
        await newCoach.save(); // Save the updated coach profile

        return res.status(201).json({
          message: "Coach and academy registered successfully",
          coach: newCoach,
          academy: newAcademy,
        });
      }

      return res
        .status(201)
        .json({ message: "Coach registered successfully", coach: newCoach });
    } else if (userRole === "admin") {
      const existingAdmin = await User.findOne({ email });
      if (existingAdmin) {
        return res
          .status(400)
          .json({ message: "Email already registered as an admin" });
      }

      const newCoach = new User({
        email,
        password: hashedPassword,
        role: userRole,
      });

      await newCoach.save();
      return res
        .status(201)
        .json({ message: "admin registered successfully", newCoach });
    }

    return res.status(400).json({ message: "Invalid role" });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const Student = require("./models/Student");
// const User = require("./models/User");

exports.login = async (req, res) => {
  const { email, password, role, academyId } = req.body;
  console.log(email, password, role);
  
  // Check if email, password, and role are provided
  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role are required" });
  }

  try {
    let user;

    // Student login logic
    if (role === "student") {
      // Find the student by email
      user = await Student.findOne({ email });
    
      if (user) {
        let batch = null;
    
        // If academyId is provided, check the batchDetails array for the corresponding entry
        if (academyId) {
          batch = user.batchDetails.find(batch => batch.studentacademyid === academyId);
          console.log("batchaaa", batch);
    
          if (!batch) {
            return res.status(401).json({ message: "Academy ID not found for this student." });
          }
        }
    
        // Verify the password
        const isMatch = await bcrypt.compare(password, user.password);
    
        if (isMatch) {
          // Successful login for student
          const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }          
          );
    
          // Convert Mongoose document to plain object to avoid internal fields
      const profileData = user.profile ? user.profile.toObject() : {}; 
      const profileFields = Object.keys(profileData).filter(
        key => profileData[key] !== null && profileData[key] !== undefined && profileData[key] !== ""
      );

      console.log("Populated Profile Fields:", profileFields);
      console.log("Number of profile fields populated:", profileFields.length);

      const isProfileComplete = profileFields.length >= 4;
      console.log("isProfileComplete:", isProfileComplete);
          

          // // Check if bank details fields have more than 3 fields populated
          // const bankDetailsFields = Object.values(user.bankDetails || {});
          // console.log("Number of bank details fields populated:", bankDetailsFields.filter((field) => field).length);
          // const isBankDetailsComplete = bankDetailsFields.filter((field) => field).length > 3;
    
          return res.status(200).json({
            message: "Login successful",
            token,
            batch, // If academyId is not provided, batch will be null
            user,
            isProfileComplete,
          });
        } else {
          return res.status(401).json({ message: "Invalid password" });
        }
      } else {
        return res.status(401).json({ message: "Student not found" });
      }
    }
    
    // Coach or Academy login logic
    else if (role === "coach" || role === "academy") {
      user = await User.findOne({ email });
    } 
    // Admin login logic
    else if (role === "admin") {
      user = await User.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password for non-student users
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "31d" }
    );

    const profileFields = Object.values(user.profile || {});
    console.log("Number of profile fields populated:", profileFields.filter((field) => field).length);
    const isProfileComplete = profileFields.filter((field) => field).length >= 3;

    // Check if bank details fields have more than 3 fields populated
    const bankDetailsFields = Object.values(user.bankDetails || {});
    console.log("Number of bank details fields populated:", bankDetailsFields.filter((field) => field).length);
    
    const isBankDetailsComplete =
      bankDetailsFields.filter((field) => field).length >= 3;

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
      isProfileComplete,
      isBankDetailsComplete,
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "bridgeapp.solutions@gmail.com", // Your email address
    pass: "pdnc qhdp xkrf gsgw", // Your email password (or app-specific password)
  },
});

exports.forgetpassword = async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: "Email and role are required" });
  }

  try {
    let user;

    // Find user based on role
    if (role === "student") {
      user = await Student.findOne({ email }); // Query Student schema
    } else if (role === "academy" || role === "coach") {
      user = await User.findOne({ email }); // Query User (Academy) schema
    }

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP and its expiration time in the database
    user.otp = otp;
    user.otpExpiration = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
    await user.save();

    console.log(user);

    // Send OTP to the user's email
    const mailOptions = {
      from: "bridgeapp.solutions@gmail.com",
      to: email, // Send email to the provided user's email
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is ${otp}. It will expire in 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err.message);
        return res.status(500).json({
          status: "error",
          message: "Failed to send OTP email",
          error: err.message,
        });
      }

      console.log("Email sent successfully:", info.response);
      return res.status(200).json({
        status: "success",
        message: "OTP sent successfully. Please check your email.",
      });
    });
  } catch (err) {
    console.error("Error in forgetpassword:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp, role } = req.body;
  console.log(email, otp);

  if (!email || !otp || !role) {
    return res
      .status(400)
      .json({ message: "Email, OTP, and role are required" });
  }

  try {
    let user;

    // Find user based on role
    if (role === "student") {
      user = await Student.findOne({ email }); // Query Student schema
    } else if (role === "academy" || role === "coach") {
      user = await User.findOne({ email }); // Query User schema
    }

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.otpExpiration) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    return res
      .status(200)
      .json({ status: "success", message: "OTP verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.setNewPass = async (req, res) => {
  const { email, newPassword, role } = req.body;

  if (!email || !newPassword || !role) {
    return res
      .status(400)
      .json({ message: "Email, newPassword, and role are required" });
  }

  try {
    let user;

    // Find user based on role
    if (role === "student") {
      user = await Student.findOne({ email }); // Query Student schema
    } else if (role === "academy" || role === "coach") {
      user = await User.findOne({ email }); // Query User schema
    }

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and reset OTP fields
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiration = null;
    user.otp = null;
    user.otpExpiration = null;
    await user.save();

    res
      .status(200)
      .json({ status: "success", message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteAccount = async (req, res) => {
  const userId = req.user._id;

  try {
    let user;

    user = await Student.findByIdAndUpdate(
      userId,
      {
        $unset: { email: "", password: "" }, 
        $set: { isActive: false }, 
      },
      { new: true } 
    );

    if (!user) {
      user = await User.findByIdAndUpdate(
        userId,
        {
          $unset: { email: "", password: "" }, 
          $set: { isActive: false }, 
        },
        { new: true } 
      );
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Account updated successfully", user });
  } catch (error) {
    console.error("Error updating account:", error);
    res
      .status(500)
      .json({ message: "Error updating account", error: error.message });
  }
};


exports.currentUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    let user;
    if (role === "student") {
      user = await Student.findById(userId);
    } else if (role === "academy" || role === "coach") {
      user = await User.findById(userId)
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userData } = user.toObject();
    res
      .status(200)
      .json({ message: "User retrieved successfully", user: userData });
  } catch (err) {
    console.error("Error retrieving user:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.addAcademyFromAdmin = async (req, res) => {
  const {
    name,
    address,
    locationPin,
    timings,
    sports,
    availableDays,
    coach,
    pricing,
  } = req.body;
  console.log(req.body);

  if (
    !name ||
    !address ||
    !locationPin ||
    !timings ||
    !sports ||
    !availableDays
  ) {
    return res
      .status(400)
      .json({ message: "All required fields must be filled" });
  }

  const academy = await Academy.findOne({ name: name });

  if (academy) {
    return res
      .status(400)
      .json({ message: "Already same named academy exists" });
  }
  try {
    const Coach = await User.findOne({ email: coach });

    const newAcademy = new Academy({
      name,
      address,
      locationPin,
      timings,
      sports,
      availableDays,
      owner: Coach._id,
      pricing,
    });

    await newAcademy.save();

    Coach.academyId = newAcademy._id;
    Coach.hasAcademy = true

    await Coach.save();

    return res
      .status(201)
      .json({ message: "Academy registered successfully", newAcademy });
  } catch (err) {
    console.error("Signup Error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



exports.verifyRequest = async (req, res) => {
  try {
    const { userId, studentId } = req.body;
    console.log('console', userId, studentId);

    // Find the student using studentacademyid inside batchDetails
    const student = await Student.findOne({ "batchDetails.studentacademyid": studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the correct batchDetails entry
    const batchDetail = student.batchDetails.find((batch) => batch.studentacademyid === studentId);

    if (!batchDetail) {
      return res.status(404).json({ message: "Batch details not found for this student" });
    }

    // Check if the user is already verified for this batch
    const alreadyVerified = batchDetail.requests.some((request) =>
      request.requestedUser.toString() === userId && request.verify === true
    );

    if (alreadyVerified) {
      return res.status(400).json({success:false, message: "You are already verified for this batch." });
    }

    // Add new request if not already verified
    batchDetail.requests.push({
      requestedUser: userId,
      verify: false,
    });

    // Save updated student document
    await student.save();

    res.status(200).json({success:true, message: "Request added successfully" });

  } catch (err) {
    console.error("Error processing request:", err.message);
    res.status(500).json({success:true, message: "Server error", error: err.message });
  }
};



