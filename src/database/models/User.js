const { DataTypes } = require("sequelize");

const sequelize = require("../sequelize");

const User = sequelize.define("user", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

//create table if not exists...
const init = async () => {
  await User.sync();
};

init();

module.exports = User;
