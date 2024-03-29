const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PasswordResetSchema = new Schema({
  email: {
    type: String,
    required: true,
    ref: "User",
  },
  code: {
    type: String,
    required: true,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

const PasswordResetModel = mongoose.model("PasswordReset", PasswordResetSchema);
module.exports = PasswordResetModel;
