const mongoose = require('mongoose');
const Coach = require('../../model/Coach');
const Academy = require('../../model/Academies')
const bcrypt = require('bcrypt')
const Batch = require('../../model/Batch')



exports.getCoachDetails = async (req, res) => {
  try {
    const coaches = await Coach.find({ role: 'coach',  academyId: null})
      .populate('academyId', 'name') 
      .populate('teachesAtAcademyId', 'name')  

    if (!coaches || coaches.length === 0) {
      return res.status(404).json({ message: 'No coaches found' });
    }

    return res.status(200).json({ coaches });
  } catch (error) {
    console.error("Error fetching coach data:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getSportCoaches = async (req, res) => {
  const {sport} = req.params

  try {
    const academycoach = await Coach.findById(req.user._id)
    const coaches = await Coach.find({"teachesAtAcademyId": academycoach.academyId, "profile.sport": sport});

    
    if (!coaches || coaches.length === 0) {
      return res.status(404).json({ success: false, message: "Academy coach not found" });
    }

    return res.status(200).json({ success: true, coaches });
  } catch (error) {
    console.error("Error fetching coach data:", error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



exports.getAllCoachesDetails = async (req, res) => {
  try {
    const coaches = await Coach.find({ role: 'coach'})
      .populate('academyId', 'name') 
      .populate('teachesAtAcademyId', 'name')  

    if (!coaches || coaches.length === 0) {
      return res.status(404).json({ message: 'No coaches found' });
    }

    return res.status(200).json({ coaches });
  } catch (error) {
    console.error("Error fetching coach data:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



exports.verifyCoach = async (req, res) => {
  try {
    const { coachId } = req.params;

    const coach = await Coach.findById(coachId);

    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Toggle the verify status
    coach.profile.verify = !coach.profile.verify;
    await coach.save();

    // Send response with the new verification status
    return res.status(200).json({
      message: `Coach ${coach.profile.verify ? 'verified' : 'unverified'} successfully`,
      verifyStatus: coach.profile.verify,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
  };

exports.addCoach = async (req, res) => {
    try {
      const { name, phone , sport, academy,batchId, coachAcademyId } = req.body;
      console.log(name, phone , sport, academy,batchId, coachAcademyId);
  
      if (!name || !phone || !sport || !academy || !batchId || !coachAcademyId) {
        return res.status(400).json({ message: 'All fields required' });
      }

      const foundAcademy = await Academy.findOne({ name: academy });
      if (!foundAcademy) {
        return res.status(404).json({ message: 'Academy not found' });
      }
  
      const newCoach = new Coach({
        name,
        phone,
        profile: {
          sport: sport
        },
        teachesAtAcademyId: [foundAcademy._id],
        coachacademyid: coachAcademyId,
        hasAcademy: false,
        role: "coach"
      });
      
  
      // Save the coach to the database
      await newCoach.save();

      const batch = await Batch.findById(batchId)
      if (!batch) {
        return res.status(404).json({ message: 'Batch not found' });
      }

      batch.batchcoach = coachAcademyId
      await batch.save()
  
      return res.status(200).json({ message: 'Coach added successfully', coach: newCoach });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };

  exports.updateCoach = async (req, res) => {
    try {
      const { id, name, phone, sport, academy } = req.body;
      console.log(id, name, phone, sport, academy)
  
      if (!id || !name || !phone || !sport || !academy) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Find the academy by name
      const foundAcademy = await Academy.findOne({ name: academy });
      if (!foundAcademy) {
        return res.status(404).json({ message: 'Academy not found' });
      }
  
      // Find the coach by ID
      const coach = await Coach.findById(id);
      if (!coach) {
        return res.status(404).json({ message: 'Coach not found' });
      }
  
      // Update the coach details
      coach.name = name;
      coach.phone = phone;
      coach.profile.sport = sport;
      coach.teachesAtAcademyId = [foundAcademy._id];
  
      // Save the updated coach to the database
      await coach.save();
  
      return res.status(200).json({ message: 'Coach updated successfully', coach });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  };
  
  
  
