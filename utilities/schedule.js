"use strict";
const moment = require("moment");
require("moment/locale/ja");
const { Booking } = require("../models/booking");
const Settings = require("../classes/settings");

const generateDaySlots = async() => {

  const settings = new Settings();
  await settings.init();

  const {
    slotDuration,
    interval,
    week
  } = settings;

  let start = moment("2020-05-02 00:00").startOf("day");

  const weekSlots = [];

  for (let day = 0; day < 7; day++) {

    const {
      startHours,
      startMinutes,
      slotNumber,
    } = week[day];
  
    start.set({ hours: startHours, minutes: startMinutes, millisecond: 0 });

    const slots = [];
  
    for (let i = 1; i <= slotNumber; i++) {
  
      const unix = start.unix();
      slots.push({ unix, value: start.format("HH:mm") });
      start.add(slotDuration + interval, "minutes");
    }
    
    weekSlots.push(slots);

    start.add(1, "days");

  }

  return weekSlots;

}

generateDaySlots();

const generateSchedule = async (userId, admin) => {

  const settings = new Settings();
  await settings.init();

  const {
    lastBookableDay,
    slotDuration,
    interval,
    expireOffset,
    cancelationNotice,
    week
  } = settings;

  const fields = admin ? "name surname email _id" : "_id"
  const bookings = await Booking.find().select("unix user bookedAt -_id").populate("user", fields).lean();

  const isAfter = (start, offset) => {
    let expiration = moment();
    expiration = expiration.add(offset, "minutes");
    return !start.isBefore(expiration);
  }

  const userSlot = (unix, userId) => {

    const slot = bookings.find(slot => slot.unix === unix);

    if (slot) {
      if (slot.user === null) {
        return { ...slot, start: start.format("HH:mm"), status: "closed" };
      } else {
        if (userId == slot.user._id) {
          if (isAfter(start, (cancelationNotice * 60))) {
            return { ...slot, start: start.format("HH:mm"), status: "booked" };
          } else {
            return { ...slot, start: start.format("HH:mm"), status: "bookedUncancellable" };
          }
        } else {
          return { unix, start: start.format("HH:mm"), status: "unavailable", user: null };    
        }
      }
    } else {
      if (isAfter(start, expireOffset)) {
        if (isAfter(start, (cancelationNotice * 60))) {
          return { unix, start: start.format("HH:mm"), status: "available", user: null };
        } else {
          return { unix, start: start.format("HH:mm"), status: "availableUncancellable", user: null };
        }
      } else {
        return { unix, start: start.format("HH:mm"), status: "unavailable", user: null };
      }
    }

  }

  const adminSlot = (unix) => {

    const slot = bookings.find(slot => slot.unix === unix);

    if (slot) {
      if (slot.user === null) {
        return { ...slot, start: start.format("HH:mm"), status: "closed" };
      } else {
        if (isAfter(start, cancelationNotice)) {
          return { ...slot, start: start.format("HH:mm"), status: "booked" };
        } else {
          return { ...slot, start: start.format("HH:mm"), status: "bookedUncancellable" };
        }
      }
    } else {
      return { unix, start: start.format("HH:mm"), status: "available", user: null };
    }

  }

  const generateSlots = async (startingTime, userId) => {

    const slots = [];
    let start = startingTime;

    const {
      startHours,
      startMinutes,
      slotNumber,
    } = week[start.weekday()];
  
    start.set({ hours: startHours, minutes: startMinutes, millisecond: 0 });
  
    for (let i = 1; i <= slotNumber; i++) {

      const unix = start.unix();

      if (admin) {
        slots.push(adminSlot(unix))
      } else {
        slots.push(userSlot(unix, userId))
      }

      start.add(slotDuration + interval, "minutes");
    }
    return slots;
  }
    
  const schedule = [];

  let start = moment().startOf("day");
  const end = moment.unix(lastBookableDay);
  const dur = moment.duration({ from: start, to: end });
  const days = Math.ceil(dur.asDays());

  for (let i = 0; i <= days; i++) {

    const slots = await generateSlots(start, userId);

    start.set({ hours: 0, minutes: 0, millisecond: 0 });

    const { off } = week[start.weekday()]; 

    schedule.push({
      unix: start.unix(),
      date: start.format("LL"),
      slots: off ? [] : slots,
    })

    start = start.add(1, "days"); 
  }
  return schedule;
}

module.exports.generateSchedule = generateSchedule;
module.exports.generateDaySlots = generateDaySlots;