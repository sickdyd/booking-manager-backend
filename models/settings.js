"use strict";
const mongoose = require("mongoose");
const moment = require("moment");
const Joi = require("@hapi/joi");

const daySchema = mongoose.Schema({
  startHours: {
    type: Number,
    min: 0,
    max: 24,
    required: true
  },
  startMinutes: {
    type: Number,
    min: 0,
    max: 59,
    required: true
  },
  slotNumber: {
    type: Number,
    min: 0,
    max: 288,
    required: true
  },
  off: {
    type: Boolean,
    required: true
  }
});

function validateDay(day) {
  const schema = Joi.object({
    startHours: Joi.number().integer().min(0).max(24).required(),
    startMinutes: Joi.number().integer().min(0).max(59).required(),
    slotNumber: Joi.number().integer().min(0).max(288).required(),
    off: Joi.boolean().required(),
  });
  return schema.validate(settings)
}

const settingsSchema = mongoose.Schema({
  lastBookableDay: {
    type: Number,
    required: true
  },
  slotDuration: {
    type: Number,
    min: 5,
    max: 240,
    required: true
  },
  interval: {
    type: Number,
    min: 0,
    max: 240,
    required: true
  },
  expireOffset: {
    type: Number,
    min: 0,
    max: 60 * 60 * 24,
    required: true
  },
  cancelationNotice: {
    type: Number,
    min: 0,
    required: true
  },
  dailyLimit: {
    type: Number,
    min: 0,
    default: 0
  },
  week: {
    type: [daySchema],
    validate: [arrayLimit, "The weekdays can only be 7."],
    required: true
  },
})

function arrayLimit(val) {
  return val.length <= 7;
}

const Settings = mongoose.model("Settings", settingsSchema);

function validateSettings(settings) {
  const schema = Joi.object({
    lastBookableDay: Joi.number().integer().required(),
    slotDuration: Joi.number().min(5).max(240).required(),
    interval: Joi.number().min(0).max(240).required(),
    expireOffset: Joi.number().min(0).max(60 * 60 * 24).required(),
    cancelationNotice: Joi.number().integer().min(0).required(),
    dailyLimit: Joi.number().min(0),
    week: Joi.required(),
  });
  return schema.validate(settings)
}

module.exports.Settings = Settings;
module.exports.validateSettings = validateSettings;
module.exports.validateDay = validateDay;