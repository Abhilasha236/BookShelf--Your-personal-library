const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: {
  type: String,
  unique: true,
  required: true,
  match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
  type: String,
  required: true,
  minlength: 6
}
});

module.exports = mongoose.model('User', userSchema);
