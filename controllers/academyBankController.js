const Coach = require('../model/Coach');

const updateBankDetails = async (req, res) => {
  try {
    // console.log('Receied bank details:', req.body.bankDetails)
    const { bankDetails } = req.body;

    if (!bankDetails || !bankDetails.bankName || !bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.upiId) {
      return res.status(400).json({ message: 'All bank details are required' });
    }

    const coach = await Coach.findOne({ email: req.user.email });

    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    coach.bankDetails = bankDetails;

    await coach.save();
    res.status(200).json({ message: 'Bank details updated successfully', bankDetails: coach.bankDetails });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { updateBankDetails };
