const { Settings } = require("../models/settings");
const moment = require("moment");

class Config {

  async init() {

    let settings = await Settings.findOne();
    if (!settings) settings = await createDefaultConfig();

    this.lastBookableDay = settings.lastBookableDay;
    this.slotDuration = settings.slotDuration;
    this.interval = settings.interval;
    this.expireOffset = settings.expireOffset;
    this.cancelationNotice = settings.cancelationNotice;
    this.week = settings.week;
  }
}

async function createDefaultConfig() {
  const settings = await Settings.find();
  let last = moment().format("YYYY-MM-DD");
  last = moment(last).add(10, "day").unix();
  if (settings.length < 1) {
    const newSettings = new Settings({
      lastBookableDay: last,
      slotDuration: 50,
      interval: 10,
      expireOffset: 60,
      cancelationNotice: 24,
      week: [...new Array(7)].map(() =>
        ({ startHours: 10, startMinutes: 0, slotNumber: 5, off: false }))
    });
    await newSettings.save();
  }
}

module.exports = Config;