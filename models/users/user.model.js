const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  provider: {
   type: String,
    required: true, 
  },
  username: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  profileUrl: {
    type: String,
    required: false,
  },
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
