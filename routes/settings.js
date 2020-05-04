"use strict";
const router = require("express").Router();
const authorize = require("../middleware/authorize");
const admin = require("../middleware/admin");
const { Settings, validateSettings } = require("../models/settings");
const validate = require("../middleware/validate");

router.get("/", [authorize, admin], async (req, res) => {

  const settings = await Settings.findOne();
  res.status(200).send(settings);
});

router.put("/", [authorize, admin, validate(validateSettings)], async (req, res) => {

  const settings = await Settings.findOneAndUpdate({}, req.body, {new: true});
  
  res.status(200).send(settings);
});

module.exports = router;