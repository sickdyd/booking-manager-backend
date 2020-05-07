"use strict";
const errorHandler = require("../errors/errorHandler");

/**
 * Receives a validator (for mongoose schemas) and returns the error or proceeds in the pipeline
 */

module.exports = (validator) => {
  return (req, res, next) => {

    const { error } = validator(req.body);
    if (error) return errorHandler(res, "VALIDATION_FAIL", error.details[0])
    next();
  }
}