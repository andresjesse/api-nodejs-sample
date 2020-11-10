const express = require("express");
const router = express.Router();

const Cars = require("./controllers/Cars");

router.get("/cars", Cars.all);

module.exports = router;
