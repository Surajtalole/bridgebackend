const Coach = require('../model/Coach');
const Academy = require('../model/Academies')
const uploadGalleryImageToFTP = require('./ftpController/uploadGalleryImage');

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
    const { academyName, academyAddress, locationPin, timing, selectedSport, description } = req.body;

    console.log(academyName, academyAddress, locationPin, timing, selectedSport, description);
    console.log("User", req.user);

    if (!academyName || !academyAddress || !locationPin || !timing || !selectedSport || !description) {
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

    const sportsArray = Array.isArray(selectedSport) ? selectedSport : selectedSport.split(',');

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





module.exports = { createOrUpdateAcademyProfile,editAcademyProfile,getCoaches };





