const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: false },      // userName
  email: { type: String, required: false, unique: true },
  password: { type: String, required: false },
  mobile: { type: String, required: false, unique: true },
});

module.exports = mongoose.model('User', userSchema);
