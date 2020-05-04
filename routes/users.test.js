"use strict";
const request = require("supertest");
const mongoose = require("mongoose");
const _ = require("lodash");
const {User} = require("../models/user");

describe("/api/users", () => {

  let server;
  let mockAdmin;
  let mockUser;

  function getToken(forUser) {
    const user = new User(forUser);
    return user.generateAuthToken();
  }

  beforeEach(() => {

    server = require("../index");

    mockAdmin = {
      name: "NAdmin",
      surname: "SAdmin",
      email: "admin@admin.it",
      password: "testing123",
      admin: true,
      disabled: false

    }

    mockUser = {
      name: "NUser",
      surname: "SUser",
      email: "user@user.it",
      password: "testing123",
      admin: false,
      disabled: false
    }

  });

  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });

  describe("GET /", () => {

    beforeEach(async() => {
      User.insertMany([
        {...mockUser, email: "test1@test.it"},
        {...mockUser, email: "test2@test.it"}
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
      expect(res.status).toBe(400);
    });

    // admin middlware

    it("should return an error if token is not admin", async () => {
      const res = await exec(getToken(mockUser));
      expect(res.status).toBe(401);
    });

    // happy path

    it("should return the list of users token is admin", async () => {
      const res = await exec(getToken(mockAdmin));
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toMatchObject({ email: "test1@test.it" });
      expect(res.body[1]).toMatchObject({ email: "test2@test.it" });
    });

  });

  describe("GET /:id", () => {

    let userId;

    beforeEach(async() => {
      const user = new User(mockUser);
      await user.save();
      userId = user._id;
    });

    const exec = (token, id) => request(server)
      .get("/api/users/" + id)
      .set("x-auth-token", token);

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).get("/api/users/" + userId);
      expect(res.status).toBe(401);
    });
  
    it("should return an error if token is invalid", async () => {
      const res = await exec(0, userId);
      expect(res.status).toBe(400);
    });

    // admin middleware

    it("should return an error if token is not admin", async () => {
      const res = await exec(getToken(mockUser), userId);
      expect(res.status).toBe(401);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(getToken(mockAdmin), 0);
      expect(res.status).toBe(404);
    });

    // route errors

    it("should return an error if object id is valid but not found", async () => {
      const res = await exec(getToken(mockAdmin), mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(404);
    });

    // post happy path

    it("should return the user document if token is admin", async () => {
      const res = await exec(getToken(mockAdmin), userId);
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
      expect(res.status).toBe(400);
    });

    // admin middleware

    it("should return an error if token is not admin", async () => {
      const res = await exec(getToken(mockUser), mockUser);
      expect(res.status).toBe(401);
    });

    // validate middleware

    it("should return an error if email is undefined", async () => {
      delete mockUser.email;
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if email is not valid", async () => {
      mockUser.email = "test@";
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.email");
    });

    it("should return an error if name is undefined", async () => {
      delete mockUser.name;
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if name is less than 1 chars", async () => {
      mockUser.name = "";
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if name is more than 255 chars", async () => {
      mockUser.name = Array(257).join("a");
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    it("should return an error if surname is undefined", async () => {
      delete mockUser.surname;
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if surname is less than 1 chars", async () => {
      mockUser.surname = "";
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if surname is more than 255 chars", async () => {
      mockUser.surname = Array(257).join("a");
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max")
    });

    it("should return an error if password is less than 8 chars", async () => {
      mockUser.password = "1234567";
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.min");
    });

    it("should return an error if password is more than 128 chars", async () => {
      mockUser.password = Array(130).join("a");
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    // route errors

    it("should return an error if email is in use", async () => {
      await exec(getToken(mockAdmin), mockUser);
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(400);
    });

    // happy path

    it("should return a user if input is valid", async () => {
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(_.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]));
    });

    it("should save the user in the db if input is valid", async () => {
      const res = await exec(getToken(mockAdmin), mockUser);
      expect(res.status).toBe(200);
      const user = await User.findById(res.body._id);
      expect(user).toMatchObject(_.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]));
    });

  });

  describe("PUT /", () => {

    let userId;

    beforeEach(async() => {
      const user = new User(mockUser);
      await user.save();
      userId = user._id;
    });
    
    const exec = (token, user, id) => request(server)
      .put("/api/users/" + id)
      .set("x-auth-token", token)
      .send(user)

    // authorize middleware

    it("should return an error no token is provided", async () => {
      const res = await request(server).put("/api/users/" + userId).send(mockUser);
      expect(res.status).toBe(401);
    });

    it("should return an error if token is invalid", async () => {
      const res = await exec(0, mockUser, userId);
      expect(res.status).toBe(400);
    });

    // admin middleware

    it("should return an error if token is not admin", async () => {
      const res = await exec(getToken(mockUser), mockUser, userId);
      expect(res.status).toBe(401);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(getToken(mockAdmin), mockUser, 0);
      expect(res.status).toBe(404);
    });

    // validate middleware

    it("should return an error if email is undefined", async () => {
      delete mockUser.email;
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if email is not valid", async () => {
      mockUser.email = "test@";
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.email");
    });

    it("should return an error if name is undefined", async () => {
      delete mockUser.name;
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if name is less than 1 chars", async () => {
      mockUser.name = "";
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if name is more than 255 chars", async () => {
      mockUser.name = Array(257).join("a");
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    it("should return an error if surname is undefined", async () => {
      delete mockUser.surname;
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("any.required");
    });

    it("should return an error if surname is less than 1 chars", async () => {
      mockUser.surname = "";
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if surname is more than 255 chars", async () => {
      mockUser.surname = Array(257).join("a");
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max")
    });

    it("should return an error if password is less than 8 chars", async () => {
      mockUser.password = "1234567";
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.min");
    });

    it("should return an error if password is more than 128 chars", async () => {
      mockUser.password = Array(130).join("a");
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    // route errors

    it("should return an error if object id is valid but not found", async () => {
      const res = await exec(getToken(mockAdmin), mockUser, mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(404);
    });

    // happy path

    it("should return the user if input is valid", async () => {
      const res = await exec(getToken(mockAdmin), mockUser, userId);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(_.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]));
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
      const res = await request(server).put("/api/users/" + userId).send({ name: "change" });
      expect(res.status).toBe(401);
    });

    it("should return an error if token is invalid", async () => {
      const res = await exec(0, { name: "change" }, userId);
      expect(res.status).toBe(400);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(getToken(mockAdmin), { name: "change" }, 0);
      expect(res.status).toBe(404);
    });

    // route errors

    it("should return an error if object id is valid but not found", async () => {
      const res = await exec(getToken(mockAdmin), mockUser, mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(404);
    });

    it("should return an error if regular user tries to update a field that is not password", async () => {
      const res = await exec(getToken(mockUser), { name: "NewName" }, userId);
      expect(res.status).toBe(401);
    });

    it("should return an error if regular user tries to update another users password", async () => {
      const anotherUser = new User({ ...mockUser, email: "another@gmail.com" });
      await anotherUser.save();
      const res = await exec(getToken(mockUser), { password: "newpassword123"}, anotherUser._id);
      expect(res.status).toBe(401);
    });

    // validate middleware

    it("should return an error if email is not valid", async () => {
      const res = await exec(getToken(mockAdmin), { email: "test@" }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.email");
    });

    it("should return an error if name is less than 1 chars", async () => {
      const res = await exec(getToken(mockAdmin), { name: "" }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if name is more than 255 chars", async () => {
      const res = await exec(getToken(mockAdmin), { name: Array(257).join("a") }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    it("should return an error if surname is less than 1 chars", async () => {
      const res = await exec(getToken(mockAdmin), { surname: "" }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.empty");
    });

    it("should return an error if surname is more than 255 chars", async () => {
      const res = await exec(getToken(mockAdmin), { surname: Array(257).join("a") }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max")
    });

    it("should return an error if password is less than 8 chars", async () => {
      const res = await exec(getToken(mockAdmin), { password: 1234567 }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.min");
    });

    it("should return an error if password is more than 128 chars", async () => {
      const res = await exec(getToken(mockAdmin), { password: Array(130).join("a") }, userId);
      expect(res.status).toBe(400);
      expect(res.body.error.type).toBe("string.max");
    });

    // happy paths

    it("should return the user with updated name", async () => {
      const res = await exec(getToken(mockAdmin), { name: "change" }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, name: "change" });
    });

    it("should return the user with updated surname", async () => {
      const res = await exec(getToken(mockAdmin), { surname: "change" }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, surname: "change" });
    });

    it("should return the user with updated email", async () => {
      const res = await exec(getToken(mockAdmin), { email: "change@change.it" }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, email: "change@change.it" });
    });

    it("should return the user with updated disabled status", async () => {
      const res = await exec(getToken(mockAdmin), { disabled: true }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, disabled: true });
    });

    it("should return the user with updated admin status", async () => {
      const res = await exec(getToken(mockAdmin), { admin: true }, userId);
      const otherFields = _.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({...otherFields, admin: true });
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
      expect(res.status).toBe(400);
    });

    // admin middleware

    it("should return an error if token is not admin", async () => {
      const res = await exec(getToken(mockUser), userId);
      expect(res.status).toBe(401);
    });

    // validateObjectId middleware

    it("should return an error if object id is not valid", async () => {
      const res = await exec(getToken(mockAdmin), 0);
      expect(res.status).toBe(404);
    });

    // route errors

    it("should return an error if object id is valid but not found", async () => {
      const res = await exec(getToken(mockAdmin), mongoose.Types.ObjectId().toHexString());
      expect(res.status).toBe(404);
    });

    // happy path

    it("should return the user input is valid", async () => {
      const res = await exec(getToken(mockAdmin), userId);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(_.pick(mockUser, ["name", "surname", "email", "disabled", "admin"]));
    });

  });

});