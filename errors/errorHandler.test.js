const errorHandler = require("./errorHandler");

describe("errors/errorHandler.js", () => {

  const callback = jest.fn();

  const res = {
    status: jest.fn(() => {
      return {
        send: jest.fn(() => callback()),
      }
    })
  }

  it("should return an error object", () => {
    errorHandler(res, "BOOKING_INEXISTANT");
    expect(callback).toHaveBeenCalled();
  });

  const errRes = {};

  it("should throw an error", () => {
    expect(() => errorHandler(errRes, "BOOKING_INEXISTANT")).toThrow();
  });

});