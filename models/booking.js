"use strict";

const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
Joi.objectId = require("joi-objectid")(Joi);

const bookingSchema = mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  bookedAt: {
    type: Number,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  closed: {
    type: Boolean,
    default: false
  }
});

const Booking = mongoose.model("Booking", bookingSchema);

function validateBooking(booking) {
  const schema = Joi.object({
    id: Joi.number().required(),
    user: Joi.objectId().required()
  });
  return schema.validate(booking)
}

module.exports.Booking = Booking;
module.exports.validateBooking = validateBooking;