"use strict";
const router = require("express").Router();
const authorize = require("../middleware/authorize");
const { generateSchedule, generateDaySlots } = require("../utilities/schedule");
require("../utilities/settings");

router.get("/", authorize, async (req, res) => {

  const schedule = await generateSchedule(req.user._id, req.user.admin);
  res.status(200).send(schedule);
});

router.get("/slots", authorize, async (req, res) => {

  const slot = await generateDaySlots();
  res.status(200).send(slot);
});

module.exports = router;