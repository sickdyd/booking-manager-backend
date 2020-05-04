"use strict";
const request = require("supertest");
const { User } = require("../models/user");
const { Booking } = require("../models/booking");
const bcrypt = require("bcrypt");
const moment = require("moment");
const mongoose = require("mongoose");

describe("api/bookings", () => {

  let server;
  let adminToken;
  let userToken;
  let userId;

  const booking = {
    id: moment().unix(),
    user: mongoose.Types.ObjectId().toHexString(),
  }

  beforeAll(async () => {

    server = require("../index");

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("testing123", salt);

    const adminUser = {
      name: "test",
      surname: "test",
      email: "test@test.it",
      password: password,
      admin: true,
      disabled: false,
    }

    let user = new User(adminUser);

    adminToken = user.generateAuthToken();

    adminUser.admin = false;

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

    it("should return an error if id is not provided", async () => {

      const res = await exec({ id: null }, userToken);
      expect(res.status).toBe(400);

    });

    it("should return an error if user is not provided", async () => {

      const res = await exec({ user: null }, userToken);
      expect(res.status).toBe(400);

    });

    // if exists

    it("should return an error if the slot is already booked", async () => {

      let res = await exec(booking, userToken);
      res = await exec(booking, userToken);
      expect(res.status).toBe(410);

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

    const exec = (token, id) => request(server)
      .delete("/api/bookings/" + id)
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
        .send({ id: moment().unix(), user: mongoose.Types.ObjectId().toHexString() })

      let res = await exec(userToken, bookRes.body.id);
      console.log(res.error.text)
      expect(res.status).toBe(401);

    });

    it("should return an error if trying to delete another user slot", async () => {

      const bookRes = await createBooking(booking, userToken);
      let res = await exec(userToken, bookRes.body.id);
      expect(res.status).toBe(401);

    });

    it("should delete the user's booking", async () => {

      const bookRes = await createBooking({ ...booking, user: userId }, userToken);
      let res = await exec(userToken, bookRes.body.id);
      expect(res.status).toBe(200);

    });

    it("should delete a booking if admin", async () => {

      const bookRes = await createBooking(booking, userToken);
      let res = await exec(adminToken, bookRes.body.id);
      expect(res.status).toBe(200);

    });

  });

});