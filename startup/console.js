"use strict";
const morgan = require("morgan");

module.exports = app => {
  if (app.get("env") === "development") app.use(morgan("tiny"));
}