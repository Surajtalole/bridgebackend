const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true }, 
  aboutEvent: { type: String, required: true }, 
   activities: { type: [String], required: true },
  location: { type: String, required: true }, 
  ticketPrice: { type: Number, required: true }, 
  maxSeats: { type: Number, required: true }, 
  date: { type: Date, required: true }, 
  timeFrom: { type: String, required: true }, 
  timeTo: { type: String, required: true }, 
  registration: { type: Boolean, default: false }, 
  status: { type: Boolean, default: false },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'academy', 
    required: true 
  }, 
  bookedTickets: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
      paymentId: { type: String, required: true },
      tickets: { type: Number, required: true },
      ticketDetails: [
        {
          name: { type: String, required: true },
          phone: { type: String, required: true },
        },
      ],
    },
  ],
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
