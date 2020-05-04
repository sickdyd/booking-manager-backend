"use strict";
const logger = require("../startup/logging");
const errorHandler = require("../errors/errorHandler");

module.exports = function (err, req, res, next) {
  logger.error(err.message, err);
  errorHandler(res);
}