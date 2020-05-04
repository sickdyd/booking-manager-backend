"use strict";
const request = require("supertest");
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
let server;
let mockCredentials;

const createUser = async(values) => {

  server = require("../index");

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash("testing123", salt);

  const user = new User({
    name: "test",
    surname: "test",
    email: "test@test.it",
    password: password,
    admin: false,
    disabled: false,
    ...values,
  });

  await user.save();

}

beforeEach(async () => {
  await createUser();
});

afterEach(async () => {
  await server.close();
  await User.deleteMany({});
});


describe("middleware/authenticate.js", () => {

  beforeEach(async () => {
    mockCredentials = {
      email: "test@test.it",
      password: "testing123"
    }
  });

  it("should return an error if email is not found", async () => {

    const res = await request(server)
      .post("/api/authenticate/")
      .send({ ...mockCredentials, email: "test@test.com" });
      
    expect(res.status).toBe(400);
  });

  it("should return an error if email is not valid", async () => {

    const res = await request(server)
      .post("/api/authenticate/")
      .send({ ...mockCredentials, email: "test@" });
      
    expect(res.status).toBe(400);
    expect(res.body.error.type).toBe("string.email");
  });

  it("should return an error if email is more than 254 chars", async () => {

    const res = await request(server)
      .post("/api/authenticate/")
      .send({ ...mockCredentials, email: Array(256).join("a") });
      
    expect(res.status).toBe(400);
    expect(res.body.error.type).toBe("string.max");
  });

  it("should return an error if password is not valid for the email provided", async () => {

    const res = await request(server)
      .post("/api/authenticate/")
      .send({ ...mockCredentials, password: "wrongpass" });
      
    expect(res.status).toBe(400);
  });

  it("should return an error if password is less than 8 chars", async () => {

    const res = await request(server)
      .post("/api/authenticate/")
      .send({ ...mockCredentials, password: "1234567" });
      
    expect(res.status).toBe(400);
    expect(res.body.error.type).toBe("string.min");
  });

  
  it("should return an error if password is less than 128 chars", async () => {

    const res = await request(server)
      .post("/api/authenticate/")
      .send({ ...mockCredentials, password: Array(130).join("a") });
      
    expect(res.status).toBe(400);
    expect(res.body.error.type).toBe("string.max");
  });

  it("should return an error if the user is disabled", async () => {

    await createUser({ email: "disabled@test.com", disabled: true });

    const res = await request(server)
      .post("/api/authenticate/")
      .send({ ...mockCredentials, email: "disabled@test.com" });

    expect(res.status).toBe(401);
  });

  it("should succeed if credentials are valid", async () => {

    const res = await request(server)
      .post("/api/authenticate/")
      .send(mockCredentials);

    expect(res.status).toBe(200);
  });

  it("should return a jwt if credentials are valid", async () => {

    const res = await request(server)
      .post("/api/authenticate/")
      .send(mockCredentials);

    const user = await User.findOne({ email: mockCredentials.email });
    const token = user.generateAuthToken();

    expect(res.text).toMatch(token);
  });

});