"use strict";
const request = require("supertest");

describe("startup / logging", () => {
  it("should log in the console if in development", async () => {
    process.env["NODE_ENV"] = "development";
    const server = require("../index");
    require("./logging");
    await request(server).get("/api/activities");
    await server.close();
  });

  it("should throw an error if there is an unhandledRejection", () => {
    require("./logging");
    const emitUnhandledRejection = () => process.emit("unhandledRejection");
    expect(emitUnhandledRejection).toThrow();
  });
});