"use strict";
const { User } = require("../models/user");

async function points (req, res, points) {

  if (!req.user.admin) {

    const user = await User.findById(req.user._id).select("points");
    const total = user.points + points;

    if (total >= 0) {
      user.changePoints(points);
      await user.save();
      return true;
    } else {
      return false;
    }

  }

  return true;
}

module.exports = points;