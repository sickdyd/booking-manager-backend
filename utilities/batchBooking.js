"use strict";
const moment = require("moment");

function batchBooking(req) {

  let {
    userId,
    day,
    slot,
    from,
    to
  } = req.body;

  // Convert unix epoch time to moment date
  const fromDate = moment.unix(from);
  const toDate = moment.unix(to);
  const slotDate = moment.unix(slot);

  // Despite being a full unix epoch time
  // the slot date is used only for storing hh and mm
  const hours = slotDate.hours();
  const minutes = slotDate.minutes();

  // Set the from date to the slot hh/mm
  fromDate.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

  // Find the next day where to create first booking
  while (fromDate.day() !== day) {
    fromDate.add(1, "day");
  }

  const bookings = [];

  // For each day create a booking
  // Repeat untill toDate is reached
  while (fromDate.isBefore(toDate)) {

    bookings.push({
      unix: fromDate.unix(),
      user: userId
    })

    // Go to the next weekday
    fromDate.add(7, "day");
  }

  return bookings;
  
}

module.exports = batchBooking;