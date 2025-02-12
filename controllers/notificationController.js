const axios = require('axios');

const ONE_SIGNAL_APP_ID = '5fad1ed7-e2cb-4ee1-beef-c42cc7e020c9';
const ONE_SIGNAL_API_KEY = 'os_v2_app_l6wr5v7cznhodpxpyqwmpybazgafrtcrnx5ehuntan6vq5i6r5n6x3pkf22eqlu32nbzc2u43u6n5r6pz5am3qlji53kvacmioultqy';

// Send notification to all users
const sendNotificationToAll = async (req, res) => {
  const { title, message } = req.body;

  console.log('Request to send notification to all:', { title, message });

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONE_SIGNAL_APP_ID,
        included_segments: ['All'],
        headings: { en: title },
        contents: { en: message },
      },
      {
        headers: {
          Authorization: `Basic ${ONE_SIGNAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response from OneSignal (send to all):', response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error sending notification to all:', {
      message: error.message,
      data: error.response?.data,
      status: error.response?.status,
    });
    res.status(500).json({ error: error.message, details: error.response?.data });
  }
};

// Send notification to a specific user
const sendNotificationToUser = async (req, res) => {
    const { title, message, externalUserId } = req.body;
  
    console.log('Request to send notification to user:', { title, message, externalUserId });
  
    if (!externalUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    try {
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        {
          app_id: ONE_SIGNAL_APP_ID,
          include_external_user_ids: [externalUserId],
          headings: { en: title },
          contents: { en: message },
        },
        {
          headers: {
            Authorization: `Basic ${ONE_SIGNAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      console.log('Response from OneSignal (send to user):', response.data);
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error sending notification to user:', {
        message: error.message,
        data: error.response?.data,
        status: error.response?.status,
      });
      res.status(500).json({ error: error.message, details: error.response?.data });
    }
  };

  

module.exports = { sendNotificationToAll, sendNotificationToUser };
