const express = require("express");

const router = express.Router();
const {
  createUser,
  getUserByEmail,
  getUser,
  updatePassword,
} = require("../../controllers/users/user.controller");
const validateInput = require("../../middlewares/input-validator/input-validator.middleware");
const checkAuth = require("../../middlewares/authenticator/authenticator.middleware");

router.post("/users", validateInput, createUser);
router.get("/users/:email", getUserByEmail);
router.patch("/users/:email/password", updatePassword);
router.get("/users", checkAuth, getUser);

module.exports = router;
