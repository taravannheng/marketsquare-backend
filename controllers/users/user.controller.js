const _ = require("lodash");
const passport = require("passport");

const { hashPassword } = require("../../utils/helpers");
const UserModel = require("../../models/users/user.model");
const PasswordResetModel = require("../../models/password-resets/password-reset.model");
const { generateUserId } = require("../../utils/helpers");

const createUser = async (req, res) => {
  try {
    const { user } = req.body;
    const username = user.username;
    const email = `${user.email.username}@${user.email.domain}`;
    const password = user.password;

    // hash the password
    const hashedPassword = await hashPassword(password);

    // check if the email is already taken
    const foundUser = await UserModel.find({ email });

    if (_.isEmpty(foundUser)) {
      // add the user to the database
      const userData = {
        id: await generateUserId(),
        provider: "local",
        username,
        email,
        password: hashedPassword,
        isDeleted: false,
        deletedAt: null,
      };
      const newUser = new UserModel(userData);
      newUser.save();

      res.status(200).json({ message: "User created successfully" });
    }

    if (!_.isEmpty(foundUser)) {
      res.status(409).json({ message: "Email is already taken" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await UserModel.find({ email });

    if (_.isEmpty(user)) {
      res.status(204).json({ message: "No user found..." });
    }

    if (!_.isEmpty(user)) {
      // filter out deleted user
      const filteredUser = user.filter((user) => user.isDeleted === false);

      if (_.isEmpty(filteredUser)) {
        res.status(204).json({ message: "No user found..." });
      }

      res.status(200).json(filteredUser);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getUser = async (req, res) => {
  try {
    const user = req.user;

    if (_.isEmpty(user)) {
      res.status(204).json({ message: "No user found..." });
    }

    if (!_.isEmpty(user)) {
      res.status(200).json(user);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const email = req.params.email;
    const { password } = req.body;

    // use email to find check if the reset code has been verified
    const resetData = await PasswordResetModel.findOne({ email }).sort({
      expirationDate: -1,
    });

    if (_.isEmpty(resetData)) {
      return res.status(404).json({ message: "Email not found" });
    }

    // if resetData is deleted
    if (resetData.isDeleted === true) {
      return res.status(404).json({ message: "Email not found" });
    }

    if (!_.isEmpty(resetData)) {
      if (resetData.isVerified === false) {
        return res.status(400).json({
          message:
            "Verification code is not yet verified. Please verify the 4-digit code which can be found in your reset password code email.",
        });
      }

      // if the user is deleted
      const foundUser = await UserModel.findOne({ email });

      if (_.isEmpty(foundUser)) {
        return res.status(404).json({ message: "Email not found" });
      }

      if (foundUser.isDeleted === true) {
        return res.status(404).json({ message: "Email not found" });
      }

      // hash the password
      const hashedPassword = await hashPassword(password);

      // update the password
      const updatedUser = await UserModel.findOneAndUpdate(
        { email },
        { password: hashedPassword }
      );

      // delete the reset code
      if (updatedUser) {
        await PasswordResetModel.updateOne(
          { email },
          { $set: { isDeleted: true, deletedAt: Date.now() } }
        );
      }

      res.status(200).json({ message: "Password updated successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createUser,
  getUserByEmail,
  getUser,
  updatePassword,
};
