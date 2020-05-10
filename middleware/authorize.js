"use strict";
const jwt = require("jsonwebtoken");
const moment = require("moment");
const config = require("config");
const errorHandler = require("../errors/errorHandler")

/**
 * Returns an error if no token or invalid token
 * Proceeds in the pipeline if token is valid
 */

function authorize(req, res, next) {

  const token = req.header("x-auth-token");
  if (!token) return errorHandler(res, "NO_TOKEN");
  
  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

    console.log(decoded);

    if (decoded.exp > moment.unix()) {
      return errorHandler(res, "INVALID_TOKEN");
    }

    req.user = decoded;

    next();
  }
  catch(ex) {
    errorHandler(res, "INVALID_TOKEN");
  }
}

module.exports = authorize;