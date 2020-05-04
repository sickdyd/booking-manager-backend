"use strict";
const errorHandler = require("../errors/errorHandler");
/**
 * Returns 401 if user is not admin or proceeds in the pipeline
 */

function admin(req, res, next) {
  if (!req.user.admin) return errorHandler(res, "UNAUTHORIZED");
  next();
}

module.exports = admin;