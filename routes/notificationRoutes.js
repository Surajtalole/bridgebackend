const express = require('express');
const { sendNotificationToAll, sendNotificationToUser } = require('../controllers/notificationController');

const router = express.Router();

// Route to send notification to all users
router.post('/send-notification/all', sendNotificationToAll);

// Route to send notification to a specific user
router.post('/send-notification/user', sendNotificationToUser);

module.exports = router;
