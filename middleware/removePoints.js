"use strict";
const { User } = require("../models/user");
const errorHandler = require("../errors/errorHandler");

async function removePoints(req, res, next) {

  if (!req.user.admin) {

    const user = await User.findById(req.user._id).select("points");

    if (user.points > 1) {
      user.changePoints(-1, req.user._id);
      await user.save();
    } else {
      return errorHandler(res, "NO_POINTS"); 
    }

    console.log(user.points);

  }

  next();

}

module.exports = removePoints;