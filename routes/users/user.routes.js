const express = require("express");

const router = express.Router();
const {
  createUser,
  getUserByEmail,
  getUser,
} = require("../../controllers/users/user.controller");
const validateInput = require("../../middlewares/input-validator/input-validator.middleware");
const checkAuth = require("../../middlewares/authenticator/authenticator.middleware");

router.post("/users", validateInput, createUser);
router.get("/users/:email", getUserByEmail);
router.get("/users", checkAuth, getUser);

module.exports = router;
