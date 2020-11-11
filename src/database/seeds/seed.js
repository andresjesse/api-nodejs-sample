require("dotenv").config();

const bcrypt = require("bcrypt");

const User = require("../models/User");

User.create({
  username: "admin",
  password: bcrypt.hashSync("123", 10),
});

User.findAll().then((result) => {
  console.log(result);
});
