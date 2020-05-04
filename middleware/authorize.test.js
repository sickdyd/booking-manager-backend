"use strict";
// const {User} = require("../../../models/user");
// const authorize = require("../../../middleware/authorize");
// const mongoose = require("mongoose");
const request = require("supertest");

describe("middleware/authorize.js", () => {

  // The following test is not needed anymore since the payload is stored in a class
  // 
  // it("should populate req.user with the paylod of a valid JWT", () => {
  //   const user = {
  //     _id: mongoose.Types.ObjectId().toHexString(),
  //     admin: true
  // };
  //   const token = new User(user).generateAuthToken();
  //   const req = {
  //     header: jest.fn().mockReturnValue(token),
  //     user: jest.fn(),
  //   };
  //   const res = {};
  //   const next = jest.fn();
  //   authorize(req, res, next);

  //   expect(req.user).toMatchObject(user);
  // });

  it("should return an error if token is not valid", async () => {
    const server = require("../index");
    const res = await request(server)
      .get("/api/users")
      .set("x-auth-token", "invalid");
    expect(res.status).toBe(400);
    server.close();
  });
});