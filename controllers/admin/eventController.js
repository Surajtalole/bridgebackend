const Event = require('../../model/admin/eventModel');
const Coach = require('../../model/Coach')

exports.createEvent = async (req, res) => {
  try {

    const {
      eventName,
      aboutEvent,
      activities,
      ticketPrice,
      maxSeats,
      date,
      timeFrom,
      timeTo,
      location,
      registration = false,
      status = false,
    } = req.body;

    const userId = req.user._id; // Assuming user is populated via auth middleware

    // Validate required fields
    if (!eventName || !aboutEvent || !activities || !ticketPrice || !maxSeats || !date || !timeFrom || !timeTo || !location) {
      return res.status(400).json({ message: 'All fields are required!' });
    }

    // // Ensure activities is an array
    // if (!Array.isArray(activities) || activities.length === 0) {
    //   console.log("❌ Validation Failed: Activities must be a non-empty array!");
    //   return res.status(400).json({ message: 'Activities must be a non-empty array.' });
    // }

    // Function to format time as "H.MMAM/PM"
    const formatTime = (time) => {
      let dateObj = new Date(time);

      // Check if the input is a valid Date object
      if (isNaN(dateObj.getTime())) {
        return time; // If it's already a valid string, return it as is
      }

      let hours = dateObj.getHours();
      let minutes = dateObj.getMinutes();
      let period = hours >= 12 ? "PM" : "AM";

      hours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
      let formattedTime = `${hours}.${minutes < 10 ? "0" : ""}${minutes}${period}`;

      return formattedTime;
    };

    // Convert timeFrom and timeTo
    const formattedTimeFrom = formatTime(timeFrom);
    const formattedTimeTo = formatTime(timeTo);


    // Check if the user exists in the database
    const userExists = await Coach.findById(userId);
    if (!userExists) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Create new event
    const newEvent = new Event({
      eventName,
      aboutEvent,
      activities,
      ticketPrice,
      maxSeats,
      date,
      timeFrom: formattedTimeFrom,
      timeTo: formattedTimeTo,
      location,
      registration,
      status,
      userId,
    });


    await newEvent.save();

    res.status(201).json({ message: 'Event created successfully!', event: newEvent });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};





exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find(); 
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, unable to fetch events' });
  }
};

exports.toggleStatus = async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' }); // Check if eventId is provided
  }

  try {
    const event = await Event.findById(eventId);

    // If event not found, return a 404 error
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Toggle the status
    event.status = !event.status;

    // Save the updated event status
    await event.save();

    // Return the updated event 
    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, unable to update registration status' });
  }
};


exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete event" });
  }
};


exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  try {
    const updatedEvent = await Event.findByIdAndUpdate(eventId, req.body, { new: true });
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: "Failed to update event", error: err });
  }
};
exports.bookTicket = async (req, res) => {
  const { eventId, userId, paymentId, tickets, ticketDetails } = req.body;
  console.log("Booking request body:", req.body); // Add logging for request body

  try {
    const event = await Event.findById(eventId);
    console.log("Event found:", event); // Log the event details

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.maxSeats < tickets) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    // Deduct seats and add booking
    event.maxSeats -= tickets;
    
    // Ensure ticketDetails are stored properly
    event.bookedTickets.push({ userId, paymentId, tickets, eventId, ticketDetails });

    await event.save();

    console.log("Updated event:", event); // Log the updated event
    res.status(200).json({ message: 'Tickets booked successfully', event });
  } catch (error) {
    console.error("Error booking tickets:", error); // Log the error
    res.status(500).json({ message: 'Error booking tickets', error: error.message });
  }
};




// exports.getEvent = async (req, res) => {
//   try {
//     const event = await Event.findById(req.params.id).populate('bookedTickets.userId', 'name email');

//     if (!event) return res.status(404).json({ message: 'Event not found' });

//     res.status(200).json(event);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching event', error });
//   }
// };



