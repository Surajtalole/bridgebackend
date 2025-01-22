// user.controller.js
const Student = require('../model/Student');
const Batch = require('../model/Batch'); // Adjust the path to your Batch model

exports.getUserProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id); 
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.status(200).json({
      success: true,
      profile: student.profile,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



exports.updateTrials = async (req, res) => {
  const  {trialsLeft, batchId, userId}  = req.body;
  
  try {
    const student = await Student.findByIdAndUpdate(
      userId,
      {
        $set: {
          'profile.trialsLeft': trialsLeft,
        },
      },
      { new: true }  // Return the updated document
    );

    if (!student) {
      console.error('Student not found');
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Fetch the batch details and populate academyId
    const batch = await Batch.findById(batchId).populate('academyId', 'name');

    if (!batch) {
      console.error('Batch not found');
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    // Create invoice data
    const invoice = {
      userId: student._id,
      batchId: batch._id,
      academyName: batch.academyId.name,
      trialsLeft: student.profile.trialsLeft,
      date: new Date(),
    };

    // Log the invoice (you can save it to a database or use as needed)
    console.log('Invoice:', invoice);

    res.status(200).json({
      success: true,
      message: 'Trials updated successfully',
      profile: student.profile,
      invoice: invoice, // Return the invoice data
    });
  } catch (err) {
    console.error('Error updating trials:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update trials',
    });
  }
};



