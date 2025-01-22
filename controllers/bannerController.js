const Banner = require("../model/admin/Banner");
const path = require("path");
const fs = require("fs");
const uploadToFTP = require("./ftpUploader");

exports.bannerPromotion = async (req, res) => {
    try {
      const { bannerLink, fromDate, toDate } = req.body;
      console.log(bannerLink, fromDate, toDate);
  
      if (!bannerLink || !fromDate || !toDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      if (!req.file) {
        return res.status(400).json({ error: "Image file is required" });
      }
  
      // Generate a unique filename for the FTP server
      const remoteFileName = Date.now() + path.extname(req.file.originalname); // Unique filename
      const imageUrl = await uploadToFTP(req.file.buffer, remoteFileName); // Upload to FTP and get the URL
  
      console.log('Received file:', req.file);
      console.log('Generated Image URL:', imageUrl);
      
      console.log("Received Data:", { bannerLink, fromDate, toDate,imageUrl });
  
      // Create new banner entry
      const newBanner = new Banner({
        imageUrl, // Use the FTP URL
        bannerLink,
        fromDate,
        toDate,
      });
  
      await newBanner.save();
      res.status(201).json({ message: "Banner submitted successfully" });
    } catch (error) {
      console.error("Error submitting banner:", error.message);
      res.status(500).json({ error: "Failed to submit banner" });
    }
  };