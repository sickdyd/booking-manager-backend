"use strict";
const router = require("express").Router();
const authorize = require("../middleware/authorize");
const { generateSchedule, generateDaySlots } = require("../utilities/schedule");
require("../utilities/settings");

router.get("/", authorize, async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  
  const from = (page - 1) * perPage;
  const to = page * perPage;

  const schedule = await generateSchedule(req.user._id, req.user.admin);

  res.status(200).send({
    schedule: schedule.slice(from, to),
    totalItems: schedule.length
  });
  
});

router.get("/slots", authorize, async (req, res) => {

  const slot = await generateDaySlots();
  res.status(200).send(slot);
});

module.exports = router;