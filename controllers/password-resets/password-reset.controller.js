const _ = require("lodash");

const UserModel = require("../../models/users/user.model");
const PasswordResetModel = require("../../models/password-resets/password-reset.model");
const {
  generateResetPasswordCode,
  sendResetPasswordCode,
} = require("../../utils/helpers");

const requestPasswordReset = async (req, res) => {
  try {
    const email = req.query.email;

    // check if the email exists
    const foundEmail = await UserModel.findOne({ email });

    if (_.isEmpty(foundEmail)) {
      res.status(404).json({ message: "Email not found" });
    }

    if (!_.isEmpty(foundEmail)) {
      // if isDeleted is true, return 404
      if (foundEmail.isDeleted === true) {
        return res.status(404).json({ message: "Email not found" });
      }

      if (foundEmail.provider !== "local") {
        const emailProvider = _.capitalize(foundEmail.provider);

        return res.status(403).json({
          message: `Your account is signed up using ${emailProvider}. Please change your ${emailProvider} password`,
        });
      }

      // send email
      try {
        const code = await generateResetPasswordCode();
        await sendResetPasswordCode(email, code);

        // add data to the database
        const data = {
          email,
          code,
          expirationDate: Date.now() + 30 * 60 * 1000,
        };
        const newPasswordReset = new PasswordResetModel(data);
        newPasswordReset.save();

        res.status(200).json({ message: "Email sent successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyPasswordReset = async (req, res) => {
  const email = req.query.email;
  const code = req.body.code;

  try {
    const resetData = await PasswordResetModel.findOne({ email }).sort({
      expirationDate: -1,
    });

    if (_.isEmpty(resetData)) {
      return res.status(404).json({ message: "Email not found" });
    }

    if (!_.isEmpty(resetData)) {
      // if isDeleted is true, return 404
      if (resetData.isDeleted === true) {
        return res.status(404).json({ message: "Email not found" });
      }

      if (resetData.code !== code || resetData.isVerified === true) {
        return res.status(400).json({ message: "Code is invalid" });
      }

      if (resetData.expirationDate < Date.now()) {
        return res.status(400).json({ message: "Code is expired" });
      }

      // if code is valid and not expired, update isVerified to true
      resetData.isVerified = true;
      await resetData.save();

      return res.status(200).json({ message: "Code verified successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  requestPasswordReset,
  verifyPasswordReset,
};
