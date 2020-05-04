"use strict";
const {validateUser} = require("./user");

describe("user schema validation", () => {

  let mockUser;

  beforeEach(() => {
    mockUser = {
      name: "1",
      surname: "1",
      email: "1@1.it",
      password: "12345678",
      admin: false,
      disabled: false,
    }
  });

  describe("name validation", () => {
    it("should return an error if no name is provided", () => {
      delete mockUser.name;
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/any.required/);
    });
  
    it("should return an error if name is not a string", () => {
      mockUser.name = { test: "test" };
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.base/);
    });
  
    it("should return an error if name is less than 1 chars", () => {
      mockUser.name = "";
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.empty/);
    });
  
    it("should return an error if name is more than 255 chars", () => {
      mockUser.name = Array(258).join("a");
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.max/);
    });
  });

  describe("surname validation", () => {
    it("should return an error if no surname is provided", () => {
      delete mockUser.surname;
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/any.required/);
    });
  
    it("should return an error if surname is not a string", () => {
      mockUser.surname = { test: "test" };
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.base/);
    });
  
    it("should return an error if surname is less than 1 chars", () => {
      mockUser.surname = "";
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.empty/);
    });
  
    it("should return an error if surname is more than 255 chars", () => {
      mockUser.surname = Array(258).join("a");
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.max/);
    });
  });

  describe("email validation", () => {
    it("should return an error if no email is provided", () => {
      delete mockUser.email;
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/any.required/);
    });

    it("should return an error if email is not valid", () => {
      mockUser.email = "123@";
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.email/);
    });
  
    it("should return an error if email is not a string", () => {
      mockUser.email = { test: "test" };
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.base/);
    });
  
    it("should return an error if email is less than 3 chars", () => {
      mockUser.email = "12";
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.min/);
    });
  
    it("should return an error if email is more than 255 chars", () => {
      mockUser.email = Array(258).join("a");
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.max/);
    });
  });

  describe("password validation", () => {
    it("should return an error if no password is provided", () => {
      delete mockUser.password;
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/any.required/);
    });
  
    it("should return an error if password is not a string", () => {
      mockUser.password = { test: "test" };
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.base/);
    });
  
    it("should return an error if password is less than 8 chars", () => {
      mockUser.password = "1234567";
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.min/);
    });
  
    it("should return an error if password is more than 128 chars", () => {
      mockUser.password = Array(130).join("a");
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/string.max/);
    });
  });

  describe("admin validation", () => {
    it("should return an error if is not a boolean", () => {
      mockUser.admin = "user";
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/boolean.base/);
    });
  });

  describe("disabled validation", () => {
    it("should return an error if is not a boolean", () => {
      mockUser.disabled = "user";
      const result = validateUser(mockUser);
      expect(result.error.details[0].type).toMatch(/boolean.base/);
    });
  });

  it("should return no errors if input is valid", () => {
    const result = validateUser(mockUser);
    expect(result.error).toBeUndefined();
  });

});