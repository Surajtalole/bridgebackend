const Banner = require("../../model/admin/Banner");
const path = require("path");
const fs = require("fs");
const uploadToFTP = require("../ftpController/ftpUploader");

exports.uploadBanner = async (req, res) => {
  try {
    const { bannerType } = req.body;

    if (!req.file || !bannerType) {
      return res
        .status(400)
        .json({ message: "Banner type and image are required." });
    }
   
    const remoteFileName = Date.now() + path.extname(req.file.originalname);
    const imageUrl = await uploadToFTP(req.file.buffer, remoteFileName); 


    const newBanner = new Banner({
      bannerType,
      imageUrl, 
      published: false,
    });

    await newBanner.save();
    res
      .status(201)
      .json({ message: "Banner added successfully", banner: newBanner });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json({ success: true, banners });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching banners", error });
  }
};

exports.getBannersRoleWise = async (req, res) => {
  const { role } = req.params;
  console.log("roleeee",role)
  try {
    const banners = await Banner.find(
      { publishOption: { $in: [role, "both"] }, requestStatus: true }
    ).select("imageUrl bannerLink"); // Select only imageUrl

    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching banners", error });
  }
};



exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting banner", error });
  }
};

exports.togglePublished = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.requestStatus = !banner.requestStatus;
    await banner.save();

    res.status(200).json({ message: "Banner updated successfully", banner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateBanner = async (req, res) => {
  const { bannerType } = req.body;
  const { bannerId } = req.params;

  try {
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (req.file) {
      const remoteFileName = Date.now() + path.extname(req.file.originalname);
      
      const imageUrl = await uploadToFTP(req.file.buffer, remoteFileName);
      
      banner.imageUrl = imageUrl;
    }

    if (bannerType) {
      banner.bannerType = bannerType;
    }

    await banner.save();

    res.status(200).json({ message: "Banner updated successfully", banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ message: "Error updating banner", error });
  }
};


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
    const remoteFileName = Date.now() + path.extname(req.file.originalname);
    const imageUrl = await uploadToFTP(req.file.buffer, remoteFileName); 

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




