const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  provider: {
   type: String,
    required: true, 
  },
  role: {
    type: String,
    required: true,
    default: 'user',
  },
  username: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: false,
  },
  profileUrl: {
    type: String,
    required: false,
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

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
