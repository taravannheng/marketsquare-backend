const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/sign-up?error=true`,
  }),
  (req, res) => {
    // user is authenticated, create JWT
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // token expires in 1 hour
    });

    // append the token as a query parameter to your success URL
    const successUrl = `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/?success=true`;

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    }); // use secure: true if you are using https

    // redirect the user to the success URL
    res.redirect(successUrl);
  }
);

// Facebook Auth
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { session: false, scope: ["email"] })
);
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/sign-up?error=true`,
  }),
  function (req, res) {
    // user is authenticated, create JWT
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // token expires in 1 hour
    });

    // Successful authentication, redirect home.
    const successUrl = `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/?success=true`;

    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    }); // use secure: true if you are using https

    // redirect the user to the success URL
    res.redirect(successUrl);
  }
);

module.exports = router;
