const User = require('../../model/Coach');
const Academy = require('../../model/Academies');
const mongoose = require('mongoose');

exports.getAcademyProfiles = async (req, res) => {
  try {
    const academies = await Academy.find()
      .populate('owner', 'email'); 

    if (!academies || academies.length === 0) {
      return res.status(404).json({ message: 'No academies found' });
    }
    

    return res.status(200).json(academies);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyAcademy = async (req, res) => {
  try {
    const academyId = req.params.academyId;

    if (!mongoose.Types.ObjectId.isValid(academyId)) {
      return res.status(400).json({ message: "Invalid Academy ID" });
    }

    const academy = await Academy.findById(academyId);

    if (!academy) {
      return res.status(404).json({ message: "Academy not found" });
    }

    academy.verify = true;
    await academy.save();

    res.status(200).json({ message: "Academy verified successfully" });
  } catch (error) {
    console.error("Error verifying academy:", error);
    res.status(500).json({ message: "Server error while verifying academy" });
  }
};

exports.deleteAcademy = async (req, res) => {
  try {
    const { id: academyId } = req.params; // Extract the id from req.params
    console.log("Received academyId:", academyId);

    // Validate the academyId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(academyId)) {
      return res.status(400).json({ message: "Invalid Academy ID" });
    }

    // Find and delete the academy by ID
    const deletedAcademy = await Academy.findByIdAndDelete(academyId);

    if (!deletedAcademy) {
      return res.status(404).json({ message: "Academy not found" });
    }

    res.status(200).json({ message: "Academy deleted successfully" });
  } catch (error) {
    console.error("Error deleting academy:", error);
    res.status(500).json({ message: "Server error while deleting academy" });
  }
};

exports.editAcademyFromAdmin = async (req, res) => {
  try {
    const { name, address, locationPin, timings, sports, availableDays, coach, pricing, id } = req.body;
    console.log("Req",name, address, locationPin, timings, sports, availableDays, coach, pricing, id)

    // Validate required fields
    // add coach here
    if (!name || !address || !locationPin || !timings || !sports || !availableDays  || !pricing || !id) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find academy by ID
    const academy = await Academy.findById(id); // Find the academy by ID
    const Coach = await User.findOne({ email: coach }); // Find one user by email

    if (!academy) {
      return res.status(404).json({ message: 'Academy not found' });
    }

    academy.name = name;
    academy.address = address;
    academy.locationPin = locationPin;
    academy.timings = timings;
    academy.sports = sports;
    academy.availableDays = availableDays;
    // academy.owner = Coach._id;
    academy.pricing = pricing;

    // Save the updated academy profile
    await academy.save();

    res.status(200).json({ message: 'Academy profile updated successfully', profile: academy });
  } catch (error) {
    console.error('Error updating academy profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



  

