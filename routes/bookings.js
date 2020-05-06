"use strict";
const router = require("express").Router();
const moment = require("moment");
const authorize = require("../middleware/authorize");
const { Booking, validateBooking } = require("../models/booking");
const admin = require("../middleware/admin");
const validate = require("../middleware/validate");
const errorHandler = require("../errors/errorHandler");

router.get("/:id", [authorize, validateObjectId], async (req, res) => {

  if (!req.user.admin && (req.user._id !== req.params.id)) {
    return errorHandler(res, "UNAUTHORIZED");
  }

  let bookings = await Booking.find({ user: req.params.id });
  if (!bookings) return res.status(204).send([]);

  res.status(200).send(bookings);
});

router.post("/", [authorize, validate(validateBooking)], async (req, res) => {

  let booking = await Booking.exists({ id: req.body.id });
  if (booking) return errorHandler(res, "BOOKING_UNAVAILABLE");

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