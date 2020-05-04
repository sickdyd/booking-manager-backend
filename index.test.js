"use strict";

function portUsed(port) {
  return new Promise((resolve, reject) => {
    const net = require("net");
    const server = net.createServer();
    
    server.once("error", err => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      }
    });
    
    server.once("listening", () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}

describe("index", () => {

  let config;

  beforeEach(() => {
    jest.resetModules();
    config = require("config");
  });

  it("should use process.env.PORT if config.get('port') is not set", async () => {
    process.env.NODE_ENV = "development";
    config.port = null;
    process.env.PORT = 3434;
    const server = await require("./index");
    const result = await portUsed(3434);
    expect(result).toBe(true);
    await server.close();
  });

  it("should use config.port if other variables are not set", async () => {
    process.env.NODE_ENV = "development";
    config.port = 3434;
    delete process.env.PORT;
    const server = await require("./index");
    const result = await portUsed(3434);
    expect(result).toBe(true);
    await server.close();
  });

  it("should default to port 3334 if other ports are not set", async () => {
    process.env.NODE_ENV = "development";
    config.port = null;
    delete process.env.PORT;
    const server = require("./index");
    const result = await portUsed(3334);
    expect(result).toBe(true);
    await server.close();
  });

});