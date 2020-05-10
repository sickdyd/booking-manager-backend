"use strict";
/**
 * This route is used to authenticate users, it returns a token if valid input is provided.
 */

const express = require("express");
const router = express.Router();
const {User} = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("@hapi/joi");
const errorHandler = require("../errors/errorHandler");
const validate = require("../middleware/validate");
// const ja = require('./locales/ja') // Use "Japanese" locale in my case.

router.post("/", validate(validateAuthentication), async (req, res) => {

  const user = await User.findOne({ email: req.body.email });
  if (!user) return errorHandler(res, "INVALID_CREDENTIALS");
  if (user.disabled) return errorHandler(res, "USER_DISABLED");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return errorHandler(res, "INVALID_CREDENTIALS");

  const token = user.generateAuthToken();

  res.status("200").send(token);
});

function validateAuthentication(req) {
  const schema = Joi.object({
    email: Joi.string().min(3).max(254).required().email(),
    password: Joi.string().min(8).max(128).required()
  })
  return schema.validate(req);
}

module.exports = router;