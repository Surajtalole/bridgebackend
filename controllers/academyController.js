const Academy = require('../model/Academies');

//tjhis academy will be visible to student to endroll
exports.getAcademyData = async (req, res) => {
  try {
    const { role } = req.query;

    // Ensure that we only filter for academies

    // let filter = { role: 'academy', academyProfile: { $ne: null } };

    // Fetch only academies with a non-null academyProfile
    const academies = await Academy.find({ verify: true });    console.log("academies", academies);

    if (!academies.length) {
      return res.status(404).json({ message: 'No academies found' });
    }

    res.status(200).json({ success: true, data: academies });
  } catch (error) {
    console.error('Error fetching academies:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

//when coach add student then there the all academies of that coach is to be display then the strudent will be added one of them
exports.getAcademyByCoach = async (req, res) => {
  try {
    const coach = req.user
    const academies = await Academy.find({owner:coach._id})

    if (!academies || academies.length === 0) {
      return res.status(404).json({ message: 'No academies found' });
    }

    return res.status(200).json(academies);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

