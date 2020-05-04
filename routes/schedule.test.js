"use strict";
const request = require("supertest");
const { User } = require("../models/user");

describe("routes/schedule.js", () => {

  let userToken;

  const server = require("../index");

  beforeAll(async () => {

    const userObject = {
      name: "test",
      surname: "test",
      email: "test@test.it",
      password: "testing123",
      admin: true,
      disabled: false,
    }

    let user = new User(userObject);

    userToken = user.generateAuthToken();

  });

  afterAll(async () => await server.close());

  describe("GET", () => {

    const exec = (token) => request(server)
      .get("/api/schedule")
      .set("x-auth-token", token)

    // auth 

    it("should return an error if not authorized", async () => {

      const res = await exec("");
      expect(res.status).toBe(401);

    });

    it("should return the schedule", async () => {

      const res = await exec(userToken);
      expect(res.status).toBe(200);

    });

  });

});