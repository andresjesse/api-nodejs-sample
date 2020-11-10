const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send({ app: "hello pdm 2!" });
});

app.listen(PORT);
