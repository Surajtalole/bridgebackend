// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { createEvent,getAllEvents,toggleStatus,deleteEvent,updateEvent,bookTicket } = require('../../controllers/admin/eventController');
const authMiddleware = require('../../middlewares/authMiddleware');


router.get('/getAllEvents',authMiddleware, getAllEvents);
router.get('/events', getAllEvents);
router.put('/toggleRegistrationStatus',toggleStatus)
router.post('/createevent',authMiddleware, createEvent);
router.delete('/eventDelete/:eventId', deleteEvent);
router.put('/updateEvent/:eventId', updateEvent);

router.post('/book', bookTicket);

// Get event details route
// router.get('/:id', getEvent);



module.exports = router;
