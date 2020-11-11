const express = require("express");
const router = express.Router();

const AuthController = require("./controllers/AuthController");
const CarsController = require("./controllers/Cars");

router.post("/login", AuthController.login);

router.get("/cars", CarsController.all);
router.post("/cars", AuthController.auth, CarsController.create);

router.get("/secure", AuthController.auth, (req, res) => {
  res.json({ message: "this is a secure route!", username: req.username });
});

module.exports = router;
