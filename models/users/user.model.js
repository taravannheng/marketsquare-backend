const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
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
