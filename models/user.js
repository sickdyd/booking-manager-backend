"use strict";
/**
 * Admin users can create non admin users and handle every users' bookings.
 * Standard users can only manage their bookings (with possible restrictions).
 */

const mongoose = require("mongoose");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const config = require("config");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    maxlength: 255,
    minlength: 1,
    required: true
  },
  surname: {
    type: String,
    maxlength: 255,
    minlength: 1,
    required: true
  },
  email: {
    type: String,
    maxlength: 254,
    minlength: 3,
    required: true
  },
  password: {
    type: String,
    maxlength: 1024,
    minlength: 8,
    required: true
  },
  admin: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false
  },
  points: {
    type: Number,
    default: 0
  }
});

userSchema.virtual("fullName").get(function () {
  return this.name + ' ' + this.surname;
});

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id, admin: this.admin, name: this.get("fullName") }, config.get("jwtPrivateKey"));
  return token;
}

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    surname: Joi.string().min(1).max(255).required(),
    email: Joi.string().min(3).max(254).email().required(),
    password: Joi.string().min(8).max(128).required(),
    admin: Joi.boolean(),
    disabled: Joi.boolean(),
    points: Joi.number(),
  });
  return schema.validate(user)
}

module.exports.User = User;
module.exports.validateUser = validateUser;