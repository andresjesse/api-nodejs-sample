const express = require("express");
const router = express.Router();

const CarsController = require("./controllers/Cars");

router.get("/cars", CarsController.all);
router.post("/cars", CarsController.create);

module.exports = router;
