"use strict";
const request = require("supertest");
const { User } = require("../models/user");
const { Settings } = require("../models/settings");
const bcrypt = require("bcrypt");
const moment = require("moment");
const mongoose = require("mongoose");

describe("api/settings", () => {

  let server;
  let adminToken;
  let userToken;
  let userId;

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

  });

  afterAll(async () => {
    await server.close();
  });

  afterEach(async () => {
    // await Settings.deleteMany();
    await User.deleteMany();
  });

  describe("GET /", () => {

    const exec = token => request(server)
      .get("/api/settings/")
      .set("x-auth-token", token)

    // auth
    
    it("should return an error in invalid token", async () => {

      const res = await exec("");
      expect(res.status).toBe(401);

    });

    it("should return an error for not admin", async () => {

      const res = await exec(userToken);
      expect(res.status).toBe(401);

    });

    // happy path

    it("should return the settings", async () => {
  
      const res = await exec(adminToken);
      expect(res.status).toBe(200);

    });

  });

  describe("PUT /", () => {

    const settings = {
      "lastBookableDay": 1589209200,
      "slotDuration": 50,
      "interval": 10,
      "expireOffset": 1440,
      "cancelationNotice": 365,
      "week": [
        {
          "startHours": 10,
          "startMinutes": 0,
          "slotNumber": 5,
          "off": false
        },
        {
          "startHours": 10,
          "startMinutes": 0,
          "slotNumber": 5,
          "off": false
        },
        {
          "startHours": 10,
          "startMinutes": 0,
          "slotNumber": 5,
          "off": false
        },
        {
          "startHours": 10,
          "startMinutes": 0,
          "slotNumber": 5,
          "off": false
        },
        {
          "startHours": 10,
          "startMinutes": 0,
          "slotNumber": 5,
          "off": false
        },
        {
          "startHours": 10,
          "startMinutes": 0,
          "slotNumber": 5,
          "off": false
        },
        {
          "startHours": 10,
          "startMinutes": 0,
          "slotNumber": 5,
          "off": false
        }
      ]
    }

    const exec = (token, settings) => request(server)
      .put("/api/settings/")
      .set("x-auth-token", token)
      .send(settings)

    // auth
    
    it("should return an error in invalid token", async () => {

      const res = await exec("", settings);
      expect(res.status).toBe(401);

    });

    it("should return an error for not admin", async () => {

      const res = await exec(userToken, settings);
      expect(res.status).toBe(401);

    });

    // validation

    it("should return an error if settings is not valid", async () => {
  
      const res = await exec(adminToken, { ...settings, interval: undefined });
      expect(res.status).toBe(400);

    });

    // happy path

    it("should save the settings", async () => {
  
      const res = await exec(adminToken, settings);
      expect(res.status).toBe(200);

    });

  });

});