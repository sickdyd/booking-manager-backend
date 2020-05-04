"use strict";
const mongoose = require("mongoose");
const errorHandler = require("../errors/errorHandler");

/**
 * Returns an error if the id is not a valid mongoose id
 * If valid, proceed in the pipeline
 */

module.exports = function (req, res, next) {
  const validId = mongoose.Types.ObjectId.isValid(req.params.id);
  if (!validId) return errorHandler(res, "INVALID_OBJECT_ID")
  next();
}