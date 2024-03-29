const express = require('express');
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

router.post('/signin', 
  passport.authenticate('local', { session: false }),
  (req, res) => {
    // if user is not authenticated, passport will return a 401 status
    if (!req.user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    // if user is authenticated, generate a JWT token
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // token expires in 1 hour
    });

    return res.status(200).json({ message: "Sign in successfully", token, user: {
      _id: req.user._id,
      username: req?.user?.username,
      email: req?.user?.email ?? null,
      profileUrl: req?.user?.profileUrl ?? null,
      provider: req?.user?.provider ?? null,
    } });
  });

module.exports = router;
