const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cronJobs = require("./utils/cronJobs");

const authRoutes = require("./routes/authRouthes");
const profileRoutes = require("./routes/profileRoutes");
const academyRoutes = require("./routes/academyRoutes");
const academyBankRoutes = require("./routes/academyBankRoutes");
const studentRoutes = require("./routes/admin/studentRoutes");
const acadmyRoutes = require("./routes/admin/academyRoutes");
const coachRoutes = require("./routes/admin/coachRoutes");
const bannerRoutes = require("./routes/admin/bannerRoutes");
const productRoutes = require("./routes/admin/productsRoutes");
const eventRoutes = require("./routes/admin/eventRoutes");
const bankRoutes = require("./routes/bankRoutes");
const blogRoutes = require("./routes/admin/blogRoutes");
const batchRoutes = require("./routes/batchRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");
const trialRoutes = require("./routes/trialRoutes");
const challengeRoutes = require("./routes/challengeRoutes");
const storeRoutes = require("./routes/storeRoutes");
const orderRoutes = require("./routes/admin/orderRoutes");
const feeRoutes = require("./routes/feeRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const learningVedioRoutes = require("./routes/admin/learningVedioRoutes");
const invoiceRoute = require("./routes/invoiceRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());
app.use(
  cors({
    origin: "*", // Allows all domains
    methods: "GET, POST, PUT, DELETE, PATCH",
    allowedHeaders: "Content-Type, Authorization",
  })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static('public'));


app.use("/api/auth", authRoutes);
app.use("/api/coaches", profileRoutes);
app.use("/api", academyRoutes);
app.use("/api", academyBankRoutes);
app.use("/api", studentRoutes);
app.use("/api", acadmyRoutes);
app.use("/api", coachRoutes);
app.use("/api", bannerRoutes);
app.use("/api/", productRoutes);
app.use("/api", eventRoutes);
app.use("/api/coaches", bankRoutes);
app.use("/api", blogRoutes);
app.use("/api", batchRoutes);
app.use("/api", paymentRoutes);
app.use("/api", userRoutes);
app.use("/api", trialRoutes);
app.use("/api", challengeRoutes);
app.use("/api", storeRoutes);
app.use("/api", orderRoutes);
app.use("/api", learningVedioRoutes);
app.use("/api", feeRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", invoiceRoute);
app.use("/api", notificationRoutes);

const PORT = process.env.PORT || 5000;
cronJobs();
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Backend is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

startServer();
