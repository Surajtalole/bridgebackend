const User = require("../model/Coach");
const Academy = require("../model/Academies");
const Student = require("../model/Student");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const generateReferralCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase(); // Example: "abc123"
};

const generateUniqueCoachAcademyId = async () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";

  // Fetch existing IDs once to avoid repetitive database queries
  const existingIds = new Set(
    (await User.find({}, { coachacademyid: 1 })).map(
      (user) => user.coachacademyid
    )
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
    const letters = Array.from(
      { length: 3 },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");

    // Generate 3 random numbers
    const digits = Array.from(
      { length: 3 },
      () => numbers[Math.floor(Math.random() * numbers.length)]
    ).join("");

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
  console.log("Request body:", req.body);

  console.log("Received signup request with data:", {
    email,
    finalRole,
    hasAcademy,
    referralCode,
    academyid,
  });

  if (!email || !password) {
    console.log("Validation failed: Email and password are required.");
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Password hashed successfully.");

  try {
    let userRole = finalRole || "admin";
    console.log(`User role determined as: ${userRole}`);

    if (userRole === "student") {
      console.log("Processing student signup...");
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        console.log("Email already registered as a student:", email);
        return res.status(400).json({ message: "Email already registered as a student" });
      }

      const newReferralCode = generateReferralCode();
      console.log("Generated new referral code:", newReferralCode);
      let referrer = null;

      if (referralCode) {
        console.log("Referral code provided:", referralCode);
        referrer = await Student.findOne({ referralCode });
        if (!referrer) {
          console.log("Invalid referral code:", referralCode);
          return res.status(400).json({ message: "Invalid referral code" });
        }

        if (!referrer.profile) {
          console.log("Referrer profile not found, initializing profile.");
          referrer.profile = { coins: 0 };
        }

        // Award coins only if they haven't been awarded before
        if (!referrer.referralCoinsAwarded) {
          const updatedCoins = (referrer.profile.coins || 0) + 100;
          console.log("Awarding referral coins to referrer:", referrer._id);

          await Student.updateOne(
            { _id: referrer._id },
            {
              $set: {
                "profile.coins": updatedCoins,
                referralCoinsAwarded: true,
              },
            }
          );
        }
      }

      if (academyid) {
        console.log("Updating student with academyid:", academyid);
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
          console.log("Student updated successfully:", updatedStudent._id);
          return res.status(200).json({
            message: "Student updated successfully",
            student: updatedStudent,
            referralCode: newReferralCode,
          });
        }
      }

      // Create a new student if no `studentacademyid` matches
      console.log("Creating a new student...");
      const newStudent = await Student.create({
        email,
        password: hashedPassword,
        referralCode: newReferralCode,
        referredBy: referrer ? referrer.referralCode : null,
      });

      console.log("New student created successfully:", newStudent._id);
      return res.status(201).json({
        message: "New student created successfully",
        student: newStudent,
        referralCode: newReferralCode,
      });
    } else if (userRole === "coach") {
      console.log("Processing coach signup...");
      const existingCoach = await User.findOne({ email });
      if (existingCoach) {
        console.log("Email already registered as a coach:", email);
        return res.status(400).json({ message: "Email already registered as a coach" });
      }

      if (academyid) {
        console.log("Updating coach with academyid:", academyid);
        const updatedCoach = await User.findOneAndUpdate(
          { coachacademyid: academyid },
          {
            $set: {
              email: email,
              password: hashedPassword,
            },
          },
          { new: true }
        );

        if (updatedCoach) {
          console.log("Coach updated successfully:", updatedCoach._id);
          return res.status(200).json({
            message: "Coach updated successfully",
            coach: updatedCoach,
          });
        }
      }

      console.log("Creating a new coach...");
      const newCoach = new User({
        email,
        password: hashedPassword,
        role: userRole,
        hasAcademy,
      });

      await newCoach.save();
      console.log("New coach saved successfully:", newCoach._id);

      if (!newCoach._id) {
        console.log("Failed to save coach, no _id found.");
        return res.status(400).json({ message: "Failed to save coach, no _id found." });
      }

      if (hasAcademy) {
        console.log("Creating academy for coach...");
        const uniqueAcademyId = await generateUniqueAcademyId();
        console.log("Generated unique academy ID:", uniqueAcademyId);

        const newAcademy = new Academy({
          owner: newCoach._id,
          academyid: uniqueAcademyId,
        });

        await newAcademy.save();
        console.log("New academy saved successfully:", newAcademy._id);

        newCoach.academyId = newAcademy._id;
        await newCoach.save();
        console.log("Coach updated with academy ID:", newCoach._id);

        return res.status(201).json({
          message: "Coach and academy registered successfully",
          coach: newCoach,
          academy: newAcademy,
        });
      }

      console.log("Coach registered successfully:", newCoach._id);
      return res.status(201).json({ message: "Coach registered successfully", coach: newCoach });
    } else if (userRole === "admin") {
      console.log("Processing admin signup...");
      const existingAdmin = await User.findOne({ email });
      if (existingAdmin) {
        console.log("Email already registered as an admin:", email);
        return res.status(400).json({ message: "Email already registered as an admin" });
      }

      const newCoach = new User({
        email,
        password: hashedPassword,
        role: userRole,
      });

      await newCoach.save();
      console.log("Admin registered successfully:", newCoach._id);
      return res.status(201).json({ message: "Admin registered successfully", newCoach });
    }

    console.log("Invalid role provided:", userRole);
    return res.status(400).json({ message: "Invalid role" });
  } catch (err) {
    console.error("Signup Error:", err.message);
    console.error("Error stack trace:", err.stack);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Email, password, and role are required" });
  }

  try {
    let user;

    if (role === "student") {
      user = await Student.findOne({ email }).lean(); // Use .lean() for faster response
      if (!user) return res.status(401).json({ message: "Student not found" });
    } else if (["coach", "academy", "admin"].includes(role)) {
      user = await User.findOne({ email }).lean();
      if (!user)
        return res.status(401).json({ message: "Invalid credentials" });
    } else {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // Check profile completion (for all roles)
    const profileFields = Object.values(user.profile || {}).filter(Boolean);
    const isProfileComplete = profileFields.length >= 4;

    // Check bank details completion (for coaches and academies)
    const bankDetailsFields = Object.values(user.bankDetails || {}).filter(
      Boolean
    );
    const isBankDetailsComplete = bankDetailsFields.length >= 3;

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
      isProfileComplete,
      isBankDetailsComplete,
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
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
      user = await User.findById(userId);
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
    Coach.hasAcademy = true;

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
    console.log("console", userId, studentId);

    // Find the student using studentacademyid inside batchDetails
    const student = await Student.findOne({
      "batchDetails.studentacademyid": studentId,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Find the correct batchDetails entry
    const batchDetail = student.batchDetails.find(
      (batch) => batch.studentacademyid === studentId
    );

    if (!batchDetail) {
      return res
        .status(404)
        .json({ message: "Batch details not found for this student" });
    }

    // Check if the user is already verified for this batch
    const alreadyVerified = batchDetail.requests.some(
      (request) =>
        request.requestedUser.toString() === userId && request.verify === true
    );

    if (alreadyVerified) {
      return res.status(400).json({
        success: false,
        message: "You are already verified for this batch.",
      });
    }

    // Add new request if not already verified
    batchDetail.requests.push({
      requestedUser: userId,
      verify: false,
    });

    // Save updated student document
    await student.save();

    res
      .status(200)
      .json({ success: true, message: "Request added successfully" });
  } catch (err) {
    console.error("Error processing request:", err.message);
    res
      .status(500)
      .json({ success: true, message: "Server error", error: err.message });
  }
};
