"use strict";
const router = require("express").Router();
const moment = require("moment");
const authorize = require("../middleware/authorize");
const { Booking, validateBooking } = require("../models/booking");
const { User } = require("../models/user");
const admin = require("../middleware/admin");
const validate = require("../middleware/validate");
const errorHandler = require("../errors/errorHandler");
const Settings = require("../classes/settings");

router.post("/", [authorize, validate(validateBooking)], async (req, res) => {

  // id is the unix epoch time
  let booking = await Booking.exists({ id: req.body.id });
  if (booking) return errorHandler(res, "BOOKING_UNAVAILABLE");

  const startOfDay = moment.unix(req.body.id).startOf("day");
  const endOfDay = moment.unix(req.body.id).endOf("day");

  let sameDayBookings = await Booking
    .find({ user: req.user._id })
    .where("id").gt(startOfDay.unix()).lt(endOfDay.unix())

  const settings = new Settings();
  await settings.init();

  if ((sameDayBookings.length >= settings.dailyLimit) && settings.dailyLimit !== 0) {
    return errorHandler(res, "BOOKING_LIMIT"); 
  }

  req.body.bookedAt = moment().unix();

  booking = new Booking(req.body);
  await booking.save();

  res.status(200).send(booking);
});

router.post("/close", [authorize, admin], async (req, res) => {

  let booking = await Booking.exists({ id: req.body.id });
  if (booking) return errorHandler(res, "BOOKING_UNAVAILABLE");

  req.body.bookedAt = moment().unix();
  req.body.closed = true;
  req.body.user = null;

  booking = new Booking(req.body);
  await booking.save();

  res.status(200).send(booking);
});

router.delete("/:id", [authorize], async (req, res) => {

  const booking = await Booking.findOne({ id: req.params.id });
  if (!booking) return errorHandler(res, "BOOKING_INEXISTANT");

  let userId;

  if (!booking.user) {
    userId = "";
  } else {
    userId = booking.user.toString();
  }

  if ((req.user._id !== userId) && (!req.user.admin)) {
    return errorHandler(res, "UNAUTHORIZED");
  }

  await Booking.deleteOne({ id: req.params.id });

  res.status(200).send(booking);
});

module.exports = router;