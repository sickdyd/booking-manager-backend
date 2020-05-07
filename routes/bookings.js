"use strict";
const router = require("express").Router();
const moment = require("moment");
const authorize = require("../middleware/authorize");
const points = require("../utilities/points");
const dailyLimit = require("../middleware/dailyLimit");
const { Booking, validateBooking } = require("../models/booking");
const admin = require("../middleware/admin");
const validate = require("../middleware/validate");
const errorHandler = require("../errors/errorHandler");

router.post("/", [authorize, dailyLimit, validate(validateBooking)], async (req, res) => {

  let booking = await Booking.exists({ unix: req.body.unix });
  if (booking) return errorHandler(res, "BOOKING_UNAVAILABLE");

  req.body.bookedAt = moment().unix();

  await points(req, res, -1);

  booking = new Booking(req.body);
  await booking.save();

  res.status(200).send(booking);
});

router.post("/batch", [authorize], async (req, res) => {

  if (typeof req.body.bookings === Array) {

    Booking.find({ unix: { $in: req.body.map(booking => booking.unix) } });
    if (booking.length > 0) return errorHandler(res, "BOOKING_UNAVAILABLE");

    const bookedAt = moment().unix();

    const bookings = await Booking.insertMany(req.body.bookings.map(booking => ({
        unix: booking.unix,
        user: req.body.user,
        bookedAt
      })));

    return res.status(200).send(bookings);

  }

  return errorHandler(res, "INVALID_REQUEST");

});

router.post("/close", [authorize, admin], async (req, res) => {

  let booking = await Booking.exists({ unix: req.body.unix });
  if (booking) return errorHandler(res, "BOOKING_UNAVAILABLE");

  req.body.bookedAt = moment().unix();
  req.body.closed = true;
  req.body.user = null;

  booking = new Booking(req.body);
  await booking.save();

  res.status(200).send(booking);
});

router.delete("/:unix", [authorize], async (req, res) => {

  const booking = await Booking.findOne({ unix: req.params.unix });
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

  await points(req, res, 1);

  await Booking.deleteOne({ unix: req.params.unix });
  res.status(200).send(booking);
});

module.exports = router;