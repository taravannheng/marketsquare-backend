const express = require("express");
const router = express.Router();
const {
  requestPasswordReset,
  verifyPasswordReset,
} = require("../../controllers/password-resets/password-reset.controller");

router.post("/passwords/reset-request", requestPasswordReset);
router.post("/passwords/reset-verification", verifyPasswordReset);

module.exports = router;
