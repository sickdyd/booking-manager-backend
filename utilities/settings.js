"use strict";
const { Settings } = require("../models/settings");
const moment = require("moment");

async function createSettings() {

  const settings = await Settings.find();

  if (settings.length < 1) {

    let last = moment().format("YYYY-MM-DD");
    last = moment(last).add(10, "day").unix();

    const newSettings = new Settings({
      lastBookableDay: last,
      slotDuration: 50,
      interval: 10,
      expireOffset: 60,
      cancelationNotice: 24,
      dailyLimit: 2,
      week: [...new Array(7)].map(() =>
        ({ startHours: 10, startMinutes: 0, slotNumber: 5, off: false }))
    });

    await newSettings.save();
  }
}

createSettings();