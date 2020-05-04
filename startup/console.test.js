"use strict";
describe("startup / console", () => {

  it("should use morgan in development", () => {
    const app = {
      get: () => "development",
      use: jest.fn(),
    }
    require("./console")(app);
    expect(app.use).toHaveBeenCalled();
  });


  it("should not use morgan in production", () => {
    const app = {
      get: () => "production",
      use: jest.fn(),
    }
    require("./console")(app);
    expect(app.use).not.toHaveBeenCalled();
  });
  
});
