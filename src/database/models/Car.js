const { DataTypes } = require("sequelize");

const sequelize = require("../sequelize");

const Car = sequelize.define("car", {
  model: DataTypes.STRING,
  brand: DataTypes.STRING,
  hp: DataTypes.INTEGER,
});

//create table if not exists...
const init = async () => {
  await Car.sync();
};

//init();

module.exports = Car;
