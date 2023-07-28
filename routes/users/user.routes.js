const express = require("express");

const router = express.Router();
const {
  createUser,
  getUser,
} = require("../../controllers/users/user.controller");
const validateInput = require("../../middlewares/input-validator/input-validator.middleware");

router.post("/users", validateInput, createUser);
router.get("/users/:email", getUser);

module.exports = router;
