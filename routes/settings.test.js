"use strict";
const request = require("supertest");
const { User } = require("../models/user");
const { Settings } = require("../models/settings");
const settings = require("../test-data/settings.json");

describe("api/settings", () => {

  let server;
  let adminToken;
  let userToken;

  beforeAll(async () => {

    server = require("../index");

    const users = await User.insertMany([
      {
        name: "admin",
        surname: "admin",
        email: "admin@test.it",
        password: "testing123",
        admin: true,
        disabled: false,
      },
      {
        name: "user",
        surname: "user",
        email: "user@test.it",
        password: "testing123",
        admin: false,
        disabled: false,
      }
    ]);

    adminToken = users[0].generateAuthToken();
    userToken = users[1].generateAuthToken();

  });

  afterAll(async () => {
    await server.close();
    await Settings.deleteMany();
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