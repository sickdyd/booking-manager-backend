"use strict";
const request = require("supertest");
const mongoose = require("mongoose");
const _ = require("lodash");
const { User } = require("../models/user");
const { Booking } = require("../models/booking");

describe("/api/users", () => {

  let server;
  let mockAdmin;
  let mockUser;
  let adminId;
  let userId;

  async function getToken(id) {
    const user = await User.findById(id)
    return user.generateAuthToken();
  }

  beforeEach(async () => {

    server = require("../index");

    mockAdmin = {
      name: "NAdmin",
      surname: "SAdmin",
      email: "admin@gmail.com",
      password: "testing123",
      admin: true,
      disabled: false,
      points: 0,
    }

    mockUser = {
      name: "NUser",
      surname: "SUser",
      email: "user@gmail.com",
      password: "testing123",
      admin: false,
      disabled: false,
      points: 0,
    }

    const users = await User.insertMany([mockAdmin, mockUser]);
    adminId = users[0]._id;
    userId = users[1]._id;

  });

  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });

  describe("GET /", () => {

    beforeEach(async() => {
      User.insertMany([
        {...mockUser, email: "test1@gmail.com"},
        {...mockUser, email: "test2@gmail.com"}
      ]);
    });

    const exec = token => request(server)
      .get("/api/users/")
      .set("x-auth-token", token);

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).get("/api/users/");
      expect(res.status).toBe(401);
    });

    it("should return an error if token is invalid", async () => {
      const res = await exec(mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(401);
    });

    // admin middlware

    it("should return an error if token is not admin", async () => {
      const res = await exec(getToken(userId));
      expect(res.status).toBe(401);
    });

    // happy path

    it("should return the list of users token is admin", async () => {
      const res = await exec(await getToken(adminId));
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(4);
      expect(res.body[0]).toMatchObject({ email: "admin@gmail.com" });
      expect(res.body[1]).toMatchObject({ email: "user@gmail.com" });
      expect(res.body[2]).toMatchObject({ email: "test1@gmail.com" });
      expect(res.body[3]).toMatchObject({ email: "test2@gmail.com" });
    });

  });

  describe("GET /:id", () => {

    let mockUserId;

    beforeEach(async() => {
      const user = new User(mockUser);
      await user.save();
      mockUserId = user._id;
    });

    const exec = (token, id) => request(server)
      .get("/api/users/" + id)
      .set("x-auth-token", token);

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).get("/api/users/" + mockUserId);
      expect(res.status).toBe(401);
    });
  
    it("should return an error if token is invalid", async () => {
      const res = await exec(0, mockUserId);
      expect(res.status).toBe(401);
    });

    // admin middleware

    it("should return an error if token is not admin", async () => {
      const res = await exec(await getToken(userId), mockUserId);
      expect(res.status).toBe(401);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(await getToken(adminId), 0);
      expect(res.status).toBe(404);
    });

    // route errors

    it("should return an error if object id is valid but not found", async () => {
      const res = await exec(await getToken(adminId), mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(404);
    });

    // post happy path

    it("should return the user document if input is valid", async () => {
      const res = await exec(await getToken(adminId), userId);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(_.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]));
    });

  });

  describe("POST /", () => {

    const exec = (token, user) => request(server)
      .post("/api/users/")
      .set("x-auth-token", token)
      .send(user)

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).post("/api/users/").send(mockUser);
      expect(res.status).toBe(401);
    });
  
    it("should return an error if token is invalid", async () => {
      const res = await exec(0, mockUser);
      expect(res.status).toBe(401);
    });

    // admin middleware

    it("should return an error if token is not admin", async () => {
      const res = await exec(await getToken(userId), mockUser);
      expect(res.status).toBe(401);
    });

    // validate middleware

    it("should return an error if email is undefined", async () => {
      delete mockUser.email;
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if email is not valid", async () => {
      mockUser.email = "test@";
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.email");
    });

    it("should return an error if name is undefined", async () => {
      delete mockUser.name;
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if name is less than 1 chars", async () => {
      mockUser.name = "";
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if name is more than 255 chars", async () => {
      mockUser.name = Array(257).join("a");
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    it("should return an error if surname is undefined", async () => {
      delete mockUser.surname;
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if surname is less than 1 chars", async () => {
      mockUser.surname = "";
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if surname is more than 255 chars", async () => {
      mockUser.surname = Array(257).join("a");
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max")
    });

    it("should return an error if password is less than 8 chars", async () => {
      mockUser.password = "1234567";
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.min");
    });

    it("should return an error if password is more than 128 chars", async () => {
      mockUser.password = Array(130).join("a");
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    it("should return an error if points is not number", async () => {
      mockUser.points = "abc";
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("number.base");
    });

    // route errors

    it("should return an error if email is in use", async () => {
      await exec(await getToken(adminId), mockUser);
      const res = await exec(await getToken(adminId), mockUser);
      expect(res.status).toBe(400);
    });

    // happy path

    it("should return a user if input is valid", async () => {
      const res = await exec(await getToken(adminId), { ...mockUser, email: "test3@gmail.com" });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        ..._.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]),
        email: "test3@gmail.com"
      });
    });

    it("should save the user in the db if input is valid", async () => {
      const res = await exec(await getToken(adminId), { ...mockUser, email: "test3@gmail.com" });
      expect(res.status).toBe(200);
      const user = await User.findById(res.body._id);
      expect(user).toMatchObject({
        ..._.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]),
        email: "test3@gmail.com"
      });
    });

  });

  describe("PATCH /:id", () => {

    let userId;

    beforeEach(async() => {
      const user = new User(mockUser);
      await user.save();
      userId = user._id;
    });
    
    const exec = (token, user, id) => request(server)
      .patch("/api/users/" + id)
      .set("x-auth-token", token)
      .send(user)

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).patch("/api/users/" + userId).send({ name: "change" });
      expect(res.status).toBe(401);
    });

    it("should return an error if token is invalid", async () => {
      const res = await exec(0, { name: "change", verifyPoints: 0 }, userId);
      expect(res.status).toBe(401);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(await getToken(adminId), { name: "change" }, 0);
      expect(res.status).toBe(404);
    });

    // route errors

    it("should return an error if object id is valid but not found", async () => {
      const res = await exec(await getToken(adminId), mockUser, mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(404);
    });

    it("should return an error if regular user tries to update a field that is not password", async () => {
      const res = await exec(await getToken(userId), { name: "NewName", verifyPoints: 0 }, userId);
      expect(res.status).toBe(401);
    });

    it("should return an error if regular user tries to update another users password", async () => {
      const anotherUser = new User({ ...mockUser, email: "another@gmail.com" });
      await anotherUser.save();
      const res = await exec(await getToken(userId), { password: "newpassword123" }, anotherUser._id);
      expect(res.status).toBe(401);
    });

    it("should return an error if points changed while editing user", async () => {
      const anotherUser = new User({ ...mockUser, email: "another@gmail.com" });
      await anotherUser.save();
      const res = await exec(await getToken(adminId), { password: "newpassword123", verifyPoints: 1 }, anotherUser._id);
      expect(res.status).toBe(410);
    });

    // validate middleware

    it("should return an error if email is not valid", async () => {
      const res = await exec(await getToken(adminId), { email: "test@", verifyPoints: 0 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.email");
    });

    it("should return an error if name is less than 1 chars", async () => {
      const res = await exec(await getToken(adminId), { name: "", verifyPoints: 0 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if name is more than 255 chars", async () => {
      const res = await exec(await getToken(adminId), { name: Array(257).join("a"), verifyPoints: 0 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    it("should return an error if surname is less than 1 chars", async () => {
      const res = await exec(await getToken(adminId), { surname: "", verifyPoints: 0 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if surname is more than 255 chars", async () => {
      const res = await exec(await getToken(adminId), { surname: Array(257).join("a"), verifyPoints: 0 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max")
    });

    it("should return an error if password is less than 8 chars", async () => {
      const res = await exec(await getToken(adminId), { password: "1234567", verifyPoints: 0 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.min");
    });

    it("should return an error if password is more than 128 chars", async () => {
      const res = await exec(await getToken(adminId), { password: Array(130).join("a"), verifyPoints: 0 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    it("should return an error if points is not number", async () => {
      const res = await exec(await getToken(adminId), { points: "abc", verifyPoints: 0 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("number.base");
    });

    // happy paths

    it("should return the user with updated name", async () => {
      const res = await exec(await getToken(adminId), { name: "change", verifyPoints: 0 }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, name: "change" });
    });

    it("should return the user with updated surname", async () => {
      const res = await exec(await getToken(adminId), { surname: "change", verifyPoints: 0 }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, surname: "change" });
    });

    it("should return the user with updated email", async () => {
      const res = await exec(await getToken(adminId), { email: "change@change.it", verifyPoints: 0 }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, email: "change@change.it" });
    });

    it("should return the user with updated disabled status", async () => {
      const res = await exec(await getToken(adminId), { disabled: true, verifyPoints: 0 }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, disabled: true });
    });

    it("should return the user with updated admin status", async () => {
      const res = await exec(await getToken(adminId), { admin: true, verifyPoints: 0 }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, admin: true });
    });

    it("should return the user with updated points", async () => {
      const res = await exec(await getToken(adminId), { points: 4, verifyPoints: 0 }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin", "points"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, points: 4 });
    });

  });

  describe("DELETE /:id", () => {

    let userId;

    beforeEach(async() => {
      const user = new User(mockUser);
      await user.save();
      userId = user._id;
    });
    
    const exec = (token, id) => request(server)
    .delete("/api/users/" + id)
    .set("x-auth-token", token)

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).delete("/api/users/" + userId);
      expect(res.status).toBe(401);
    });

    it("should return an error if token is invalid", async () => {
      const res = await exec(0, userId);
      expect(res.status).toBe(401);
    });

    // admin middleware

    it("should return an error if token is not admin", async () => {
      const res = await exec(await getToken(userId), userId);
      expect(res.status).toBe(401);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(await getToken(adminId), 0);
      expect(res.status).toBe(404);
    });

    // route errors

    it("should return an error if object id is valid but not found", async () => {
      const res = await exec(await getToken(adminId), mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(404);
    });

    // happy path

    it("should return the user input is valid", async () => {
      const res = await exec(await getToken(adminId), userId);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(_.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]));
    });

  });

  describe("GET /:id/bookings", () => {

    let userId;

    beforeAll(async() => {

      const user = new User(mockUser);
      await user.save();
      userId = user._id;

      await Booking.insertMany([
        {
          unix: 1,
          user: userId,
          closed: false,
          bookedAt: 1
        },
        {
          unix: 2,
          user: userId,
          closed: false,
          bookedAt: 1
        }
      ])
    });

    afterAll(async() => {
      await Booking.deleteMany();
    });
    
    const exec = (token, id) => request(server)
      .get("/api/users/" + id + "/bookings")
      .set("x-auth-token", token)

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).get("/api/users/" + userId + "/bookings");
      expect(res.status).toBe(401);
    });

    it("should return an error if token is invalid", async () => {
      const res = await exec(0, userId);
      expect(res.status).toBe(401);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(await getToken(adminId), 0);
      expect(res.status).toBe(404);
    });

    // route errors

    it("should return an empty array if no bookings found", async () => {
      const res = await exec(await getToken(adminId), mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    // happy path

    it("should return bookings input is valid", async () => {
      const res = await exec(await getToken(adminId), userId);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

  });

  describe("GET /:id/points", () => {
    
    const exec = (token, id) => request(server)
      .get("/api/users/" + id + "/points")
      .set("x-auth-token", token)

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).get("/api/users/" + userId + "/points");
      expect(res.status).toBe(401);
    });

    it("should return an error if token is invalid", async () => {
      const res = await exec(0, userId);
      expect(res.status).toBe(401);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(await getToken(adminId), 0);
      expect(res.status).toBe(404);
    });

    // route errors

    it("should return an error if trying to get another users points", async () => {
      const res = await exec(await getToken(userId), adminId);
      expect(res.status).toBe(401);
    });

    it("should return an error if user does not exist", async () => {
      const res = await exec(await getToken(adminId), mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(204);
    });

    // happy path

    it("should return bookings input is valid", async () => {
      const res = await exec(await getToken(adminId), userId);
      expect(res.status).toBe(200);
      expect(res.body.points).toBe(0);
    });

  });

});