const _ = require("lodash");
const passport = require('passport');

const { hashPassword } = require("../../utils/helpers");
const UserModel = require("../../models/users/user.model");

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
        provider: 'local',
        username,
        email,
        password: hashedPassword,
      }
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

const getUser = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await UserModel.find({ email });

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

module.exports = {
  createUser,
  getUser,
};