"use strict";
const request = require("supertest");
const { User } = require("../models/user");
const { Booking } = require("../models/booking");
const { Settings } = require("../models/settings");
const bcrypt = require("bcrypt");
const moment = require("moment");
const mongoose = require("mongoose");
const settings = require("../test-data/settings.json");

describe("api/bookings", () => {

  let server;
  let adminToken;
  let userToken;
  let userId;

  const booking = {
    unix: moment().unix(),
    user: mongoose.Types.ObjectId().toHexString(),
  }

  beforeEach(async () => {

    server = require("../index");

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("testing123", salt);

    const adminUser = {
      name: "test",
      surname: "test",
      email: "test@test.it",
      password: password,
      points: 4,
      admin: true,
      disabled: false,
    }

    let user = new User(adminUser);

    adminToken = user.generateAuthToken();

    adminUser.admin = false;

    await user.save();

    user = new User(adminUser);

    userToken = user.generateAuthToken();

    await user.save();

    userId = user._id;

  });

  afterAll(async () => {
    await server.close();
  });

  afterEach(async () => {
    await Booking.deleteMany();
    await User.deleteMany();
  });

  describe("POST", () => {

    const exec = (booking, token) => request(server)
      .post("/api/bookings/")
      .set("x-auth-token", token)
      .send(booking)

    // auth
    
    it("should return an error for unauthorized user", async () => {

      const res = await exec(booking, "");
      expect(res.status).toBe(401);

    });

    // validation

    it("should return an error if unix is not provided", async () => {

      const res = await exec({ ...booking, unix: null }, userToken);
      expect(res.status).toBe(400);

    });

    it("should return an error if user is not provided", async () => {

      const res = await exec({ ...booking, user: null }, userToken);
      expect(res.status).toBe(400);

    });

    // if exists

    it("should return an error if the slot is already booked", async () => {

      let res = await exec(booking, userToken);
      res = await exec(booking, userToken);
      expect(res.status).toBe(410);

    });

    // booking limits

    it("should return an error if the daily limit is hit", async () => {

      await Settings.findOneAndUpdate({}, { dailyLimit: 2 });
      
      await Booking.insertMany([
        {
          unix: moment("1983-11-28 10:00").unix(),
          user: userId,
          bookedAt: moment().unix(),
        },
        {
          unix: moment("1983-11-28 11:00").unix(),
          user: userId,
          bookedAt: moment().unix(),
        }
      ]);

      const res = await exec({ unix: moment("1983-11-28 12:00").unix(), user: userId }, userToken);

      await Booking.deleteMany();

      expect(res.status).toBe(400);

    });

    // happy path

    it("should post a booking", async () => {
  
      const res = await exec(booking, userToken);
      expect(res.status).toBe(200);

    });

  });
  
  describe("POST /close", () => {

    const exec = (booking, token) => request(server)
      .post("/api/bookings/close")
      .set("x-auth-token", token)
      .send(booking)

    // auth
    
    it("should return an error for unauthorized user", async () => {

      const res = await exec(booking, "");
      expect(res.status).toBe(401);

    });

    // admin

    it("should return an error if not admin", async () => {

      const res = await exec(booking, userToken);
      expect(res.status).toBe(401);

    });

    // if exists

    it("should return an error if the slot is already booked", async () => {

      let res = await exec(booking, adminToken);
      res = await exec(booking, adminToken);
      expect(res.status).toBe(410);

    });

    // happy path

    it("should close a slot", async () => {
  
      const res = await exec(booking, adminToken);
      expect(res.status).toBe(200);

    });

  });

  describe("DELETE", () => {

    const exec = (token, unix) => request(server)
      .delete("/api/bookings/" + unix)
      .set("x-auth-token", token)

    const createBooking = (booking, token) => request(server)
      .post("/api/bookings/")
      .set("x-auth-token", token)
      .send(booking)

    // auth
    
    it("should return an error for unauthorized user", async () => {

      const res = await exec("", 1);
      expect(res.status).toBe(401);

    });

    // other

    it("should return an error if the slot does not exist", async () => {

      let res = await exec(adminToken, 1);
      expect(res.status).toBe(400);

    });

    it("should return an error if trying to delete another user slot", async () => {

      const bookRes = await request(server)
        .post("/api/bookings/")
        .set("x-auth-token", userToken)
        .send({ unix: moment().unix(), user: mongoose.Types.ObjectId().toHexString() })

      let res = await exec(userToken, bookRes.body.unix);

      expect(res.status).toBe(401);

    });

    it("should return an error if trying to delete another user slot", async () => {

      const bookRes = await createBooking(booking, userToken);
      let res = await exec(userToken, bookRes.body.unix);
      expect(res.status).toBe(401);

    });

    it("should delete the user's booking", async () => {

      const bookRes = await createBooking({ ...booking, user: userId }, userToken);
      let res = await exec(userToken, bookRes.body.unix);
      expect(res.status).toBe(200);

    });

    it("should delete a booking if admin", async () => {

      const bookRes = await createBooking(booking, userToken);
      let res = await exec(adminToken, bookRes.body.unix);
      expect(res.status).toBe(200);

    });

  });

});