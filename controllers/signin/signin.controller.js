const _ = require("lodash");

const UserModel = require("../../models/users/user.model");

const signIn = async (req, res) => {
  try {
    const user = req.body;

    // check if the user exists in the database
    const foundUser = UserModel.find({ email: user.email });

    if (_.isEmpty(foundUser)) {
      res.status(404).json({ message: "User not found" });
    }

    // check if the password is correct
    

    res.status(200).json({ user, message: "Sign in successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  signIn,
};
