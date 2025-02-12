const Coach =  require('../model/Coach');

exports.bankDetails = async (req, res) => {
  try {
    const { bankName, accountHolderName, accountNumber, ifscCode, upiId } = req.body;

    if (!bankName || !accountHolderName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: 'All fields except UPI ID are required' });
    }

    const coach = await Coach.findById(req.user._id);

    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    coach.bankDetails = {
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      upiId: upiId || null,
    };

    await coach.save();
    res.status(200).json({ message: 'Bank details updated successfully', bankDetails: coach.bankDetails });
  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
