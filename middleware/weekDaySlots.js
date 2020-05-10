"use strict";

// Checks if the slotNumber set for a specific weekday is valid
// The slots available for a specific day are limited depending
// on the starting time, the slot duration and interval

const moment = require("moment");
const errorHandler = require("../errors/errorHandler");

module.exports = (req, res, next) => {

  const { slotDuration, interval, week } = req.body;

  for (let i = 0; i <= 6; i++) {

    const { startHours, startMinutes, slotNumber } = week[i];

    const startTime = moment().set({ hours: startHours, minutes: startMinutes, seconds: 0, milliseconds: 0 });
    const endTime = startTime.clone().set({ hours: 23, minutes: 55, seconds: 0, milliseconds: 0 });
  
    const diff = endTime.diff(startTime, "minutes");
  
    const maxSlotsAvailable = Math.floor(diff / (slotDuration + interval));
  
    if (slotNumber > maxSlotsAvailable) {
      return errorHandler(res, "TOO_MANY_SLOTS", {
        path: "",
        type: "TOO_MANY_SLOTS",
        message: "You set too many slots for " + moment().day(i).format("dddd") + "." });
    }
  }

  next();
}