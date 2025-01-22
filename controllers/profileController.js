const User = require('../model/Coach');

// Profile submission logic
const submitProfile = async (req, res) => {
  try {
    const { name, designation, serviceDetails, bio, sport } = req.body; // Ensure all fields are extracted

    // Validate required fields
    if (!name || !bio || !sport || !serviceDetails || !designation) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ email: req.user.email }); // Assuming user email is available via token

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profile
    user.profile = {
      name,
      designation,
      serviceDetails,
      bio,
      sport,
    };

    await user.save();

    res.status(201).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error submitting profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = {
  submitProfile,
};
