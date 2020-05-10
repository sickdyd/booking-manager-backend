"use strict";
/**
 * This route handles the users endpoint.
 */

const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const errorHandler = require("../errors/errorHandler");
const moment = require("moment");
const { User, validateUser } = require("../models/user");
const { Booking } = require("../models/booking");
const validate = require("../middleware/validate");
const validateObjectId = require("../middleware/validateObjectId");
const authorize = require("../middleware/authorize");
const admin = require("../middleware/admin");
const hasOnlyProperty = require("../utilities");

const userReturnedFields = ["_id", "name", "surname", "email", "disabled", "admin", "points"];
const userValidationFields = ["name", "surname", "email", "password", "disabled", "admin", "points"];

router.get("/", [authorize, admin], async (req, res) => {
  const users = await User.find().sort("surname");
  return res.status(200)
    .send(users.map(user =>
        _.pick(user, userReturnedFields))
    );
});

router.get("/:id", [authorize, admin, validateObjectId], async (req, res) => {

  const user = await User.findById(req.params.id);
  if (!user) return errorHandler(res, "USER_NOT_FOUND");

  return res.status(200).send(_.pick(user, userReturnedFields));
});

router.post("/", [authorize, admin, validate(validateUser)], async (req, res) => {

  let user = await User.exists({ email: req.body.email });
  if (user) return errorHandler(res, "EMAIL_IN_USE");

  user = new User(_.pick(req.body, userValidationFields));

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  return res.status(200).send(user);
});

router.put("/:id", [authorize, admin, validateObjectId, validate(validateUser)], async (req, res) => {

  const user = await User.findById(req.params.id);
  if (!user) return errorHandler(res, "USER_NOT_FOUND");

  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  user.update(req.body);
  await user.save();

  return res.status(200).send(_.pick(user, userReturnedFields));
});

router.patch("/:id", [authorize, validateObjectId], async (req, res) => {

  const user = await User.findById(req.params.id);
  if (!user) return errorHandler(res, "USER_NOT_FOUND");

  // The patch can be done for the password too, so ignore points if changing password
  if ((user.points !== req.body.verifyPoints) && (!hasOnlyProperty(req.body, "password"))) {
    return errorHandler(res, "USER_POINTS_CHANGED");
  }

  if ((!req.user.admin && !hasOnlyProperty(req.body, "password")) ||
      (!req.user.admin && (req.params.id !== req.user._id))) {
    return errorHandler(res, "UNAUTHORIZED");
  }

  const tempUser = _.pick(user, userValidationFields);

  // For each property sent in the request update the user property
  for (let key in req.body) tempUser[key] = req.body[key];

  const { error } = validateUser(_.pick(tempUser, userValidationFields));
  if (error) return errorHandler(res, "VALIDATION_FAIL", error.details[0]);
  
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    tempUser.password = await bcrypt.hash(tempUser.password, salt);
  }

  for (let key in tempUser) user[key] = tempUser[key];
  await user.save();

  return res.status(200).send(_.pick(user, userReturnedFields));
});

router.delete("/:id", [authorize, admin, validateObjectId], async (req, res) => {

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return errorHandler(res, "USER_NOT_FOUND");

  const bookings = await Booking.deleteMany({ user: req.params.id });

  return res.status(200).send(_.pick(user, userReturnedFields));
});

router.get("/:id/bookings", [authorize, validateObjectId], async (req, res) => {

  if (!req.user.admin && (req.user._id !== req.params.id)) {
    return errorHandler(res, "UNAUTHORIZED");
  }

  let bookings = await Booking.find({ user: req.params.id }).sort("unix");
  if (!bookings) return res.status(204).send([]);

  res.status(200).send(bookings);
});

router.get("/:id/points", [authorize, validateObjectId], async (req, res) => {

  if (!req.user.admin && (req.user._id !== req.params.id)) {
    return errorHandler(res, "UNAUTHORIZED");
  }

  let user = await User.findById(req.params.id);
  if (!user) return res.status(204).send({ points: 0 });

  res.status(200).send({ points: user.points });
});

module.exports = router;