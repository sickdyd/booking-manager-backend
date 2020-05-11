"use strict";
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const moment = require("moment");
const config = require("config");
const errorHandler = require("../errors/errorHandler")

/**
 * Returns an error if no token or invalid token
 * Proceeds in the pipeline if token is valid
 */

async function authorize(req, res, next) {

  const token = req.header("x-auth-token");
  if (!token) return errorHandler(res, "NO_TOKEN");
  
  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

    if (decoded.exp > moment.unix()) {
      return errorHandler(res, "INVALID_TOKEN");
    }

    req.user = decoded;

    const user = await User.findById(decoded._id);
    if (!user) return errorHandler(res, "UNAUTHORIZED");
    const newToken = user.generateAuthToken();

    res.set("Access-Control-Expose-Headers", "x-auth-token");
    res.set("x-auth-token", newToken);

    next();
  }
  catch(ex) {
    errorHandler(res, "INVALID_TOKEN");
  }
}

module.exports = authorize;