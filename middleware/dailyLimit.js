"use strict";
const { Booking } = require("../models/booking");
const Settings = require("../classes/settings");
const errorHandler = require("../errors/errorHandler");
const moment = require("moment");

async function dailyLimit(req, res, next) {

  if (!req.user.admin) {

    const startOfDay = moment.unix(req.body.id).startOf("day");
    const endOfDay = moment.unix(req.body.id).endOf("day");

    let sameDayBookings = await Booking
      .find({ user: req.user._id })
      .where("id").gt(startOfDay.unix()).lt(endOfDay.unix())

    const settings = new Settings();
    await settings.init();

    if ((sameDayBookings.length >= settings.dailyLimit) &&
      settings.dailyLimit !== 0 && !req.body.admin) {
      return errorHandler(res, "BOOKING_LIMIT"); 
    }

  }

  next();

}

module.exports = dailyLimit;