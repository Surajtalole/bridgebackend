const Coach = require('../model/Coach');
const Academy = require('../model/Academies')
const uploadGalleryImageToFTP = require('./ftpController/uploadGalleryImage');
const Academies = require('../model/Academies');
const Batch = require('../model/Batch');
const Student = require('../model/Student')


const createOrUpdateAcademyProfile = async (req, res) => {
  try {
    const {address, locationPin, timings, sports, description , pricing } = req.body;

    if ( !address || !locationPin || !timings || !sports || !description || !pricing) {
      return res.status(400).json({ message: 'All fields except gallery and availableDays are required' });
    }

    const coach = await Coach.findById(req.user._id);

    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    const academy = await Academy.findOne({ owner: coach._id });

    if (!academy) {
      return res.status(404).json({ message: 'Academy profile not found' });
    }

    const sportsArray = Array.isArray(sports) ? sports : sports.split(',');

    const galleryImages = req.files?.map((file) => file.path) || [];

    // Update the academy fields
    academy.address = address;
    academy.locationPin = locationPin;
    academy.timings = timings;
    academy.sports = sportsArray;
    academy.description = description;
    academy.pricing = pricing;
    academy.gallery = [...academy.gallery, ...galleryImages]; // Append new gallery images

    await academy.save();
    res.status(200).json({ message: 'Academy profile updated successfully', profile: academy });
  } catch (error) {
    console.error('Error creating/updating academy profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const editAcademyProfile = async (req, res) => {
  try {
    const { academyName, academyAddress, locationPin, timing, selectedSport,selectedDays, description } = req.body;

    console.log(academyName, academyAddress, locationPin, timing, selectedSport,selectedDays, description);
    console.log("User", req.user);

    // if (!academyName || !academyAddress || !locationPin  || !selectedSport || !description) {
    //   return res.status(400).json({ message: 'All fields except gallery and availableDays are required' });
    // }

    const coach = await Coach.findById(req.user._id);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    const academy = await Academy.findOne({ owner: coach._id });



    if (!academy) {
      return res.status(404).json({ message: 'Academy profile not found' });
    }

    const sportsArray = Array.isArray(selectedSport) ? selectedSport : selectedSport.split(',');
    const daysArray = Array.isArray(selectedDays) ? selectedDays : selectedDays.split(',');
    // const parsedAddress = JSON.parse(academyAddress); // Parse back to object


    const galleryImages = [];

    if (Academy.gallery) {
      galleryImages.push(...Academy.gallery); 
    }
    
    if (req.files && req.files.gallery) {
      for (let i = 0; i < req.files.gallery.length; i++) {
        const galleryImage = req.files.gallery[i];
        const imageBuffer = galleryImage.buffer;
        const imageName = `academy_${coach._id}_gallery_${Date.now()}_${i + 1}.jpg`;
        const imageUrl = await uploadGalleryImageToFTP(imageBuffer, imageName);
        galleryImages.push(imageUrl); 
      }
    }
    
   

 

    // academy.address = address;
    academy.name = academyName;
    academy.address = academyAddress;
    academy.locationPin = locationPin;
    academy.timings = timing;
    academy.sports = sportsArray;
    academy.sports = sportsArray;
    academy.availableDays=daysArray;
    academy.description = description;
    // academy.pricing = pricing;
    academy.gallery = [...academy.gallery, ...galleryImages]; 

    await academy.save();
    

    await coach.save();
    res.status(200).json({ message: 'Academy profile saved successfully', profile: coach.academyProfile });
  } catch (error) {
    console.error('Error creating/updating academy profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const getCoaches = async (req, res) => {
  try {
    const {userId} = req.params;

    const coach = await Coach.findById(userId)
    

    const coaches = await Coach.find({"teachesAtAcademyId":coach.academyId});
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    console.log("coaches",coaches)

    res.status(200).json({ message: 'Coaches found', coaches });
  } catch (error) {
    console.error('Error creating/updating academy profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSports = async (req, res) => {
  try {
    const {coachId} = req.params;

    const coach = await Coach.findById(coachId)
    
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    const academy = await Academies.findOne({"owner":coach._id});
    const sports = academy.sports

    res.status(200).json({ message: 'Sports found', sports });
  } catch (error) {
    console.error('Error creating/updating academy profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getstudentbatch = async (req, res) => {
  try {
    const { userId, academyId } = req.params;
    console.log("Fetching batch for EE Management:", { userId, academyId });

    // Find the batch by either academyId or enrolled student ID
    const batch = await Batch.findOne({
      academyId: academyId,
      enrolledStudents: { $elemMatch: { studentId: userId } },
    });

    console.log("Batch found:", batch);

    // Validate batch existence
    if (!batch) {
      return res.status(404).json({ message: "No batch found for the given criteria" });
    }

    res.status(200).json({ batch });
  } catch (error) {
    console.error("Error fetching batch for EE Management:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getstudentFeeandAnalytics = async (req, res) => {
  try {
    const { userId, academyId } = req.params;
    console.log("Fetching student fee and analytics:", { userId, academyId });

    // Find the coach and student
    const coach = await Coach.findById(academyId);
    const student = await Student.findById(userId);

    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let batches = [];

    if (coach.hasAcademy) {
      // ✅ Fetch all batches' fee and analytics for this academy
      batches = student.batchDetails.map(batch => ({
        batchId: batch.batchid,
        fees: batch.fees,
        analytics: student.analytics.filter(analytic => analytic.batchId === batch.batchId),
      }));
    } else {
      // ✅ Fetch only the batch where batchDetails.coachacademyid matches coach.coachacademyId
      batches = student.batchDetails
        .filter(batch => batch.coachacademyid === coach.coachacademyid)
        .map(batch => ({
          batchId: batch.batchid,
          fees: batch.fees,
          analytics: student.analytics.filter(analytic => analytic.batchId === batch.batchId),
        }));
    }

    console.log(batches)

    res.status(200).json({ batches });
  } catch (error) {
    console.error("Error fetching student fee and analytics:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};









module.exports = { createOrUpdateAcademyProfile,editAcademyProfile,getCoaches,getSports,getstudentbatch,getstudentFeeandAnalytics };





