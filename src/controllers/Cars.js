const Cars = {
  all(req, res) {
    return res.json(["Fusca", "Corcel", "Brasilia"]);
  },
};

module.exports = Cars;
