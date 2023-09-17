const { body, validationResult } = require("express-validator");

const validateInput = [
  body("user.username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .bail()
    .isLength({ min: 4, max: 20 })
    .withMessage("Username must be at least 4 to 20 characters long")
    .bail()
    .matches(/^[a-zA-Z0-9_ ]+$/)
    .withMessage("Username must contain only letters, numbers and underscores"),

  // Validate 'email' field
  body("user.email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .matches(/@/)
    .withMessage("Email must contain a @ symbol")
    .bail()
    .customSanitizer((value) => {
      // Extract the username and domain from the email
      const [username, domain] = value.split("@");
      return { username, domain };
    }),

  body("user.email.username")
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage("Email must contain a valid username e.g. example@gmail.com")
    .bail(),

  body("user.email.domain")
    .matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
    .withMessage("Email must contain a valid domain e.g. @gmail.com")
    .bail(),

  // Validate 'password' field
  body("user.password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8, max: 16 })
    .withMessage("Password must be at least 8 to 16 characters long")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .bail()
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .bail()
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
    .withMessage("Password must contain at least one special character")
    .bail()
    .matches(/^\S+$/)
    .withMessage("Password must not contain spaces"),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = validateInput;
