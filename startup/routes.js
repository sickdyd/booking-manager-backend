"use strict";
const express = require("express");
const error = require("../middleware/error");
const users = require("../routes/users");
const authenticate = require("../routes/authenticate");
const schedule = require("../routes/schedule");
const bookings = require("../routes/bookings");
const settings = require("../routes/settings");

module.exports = function(app) {
  app.use(express.json());
  app.use("/api/users", users);
  app.use("/api/authenticate", authenticate);
  app.use("/api/schedule", schedule);
  app.use("/api/bookings", bookings);
  app.use("/api/settings", settings);
  app.use(error);
}