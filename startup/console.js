"use strict";
const morgan = require("morgan");
const config = require("config");

module.exports = app => {
  if (config.get("env") === "development") app.use(morgan("tiny"));
}