"use strict";
const { User } = require("../models/user");
const bcrypt = require("bcrypt");

module.exports = async () => {

  const admin = {
    name: "Name",
    surname: "Surname",
    email: "test@gmail.com",
    password: "testing123",
    admin: true,
    disabled: false
  };

  let user = await User.findOne({ email: admin.email });

  if (!user) {
    user = new User(admin);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
  }

}