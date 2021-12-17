const { Schema, model } = require("mongoose");
const mongoose = require("mongoose")

const userSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    require: true
  },
  name: {
    type: String,
    require: true
  },
  watchlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'watchlist'
  }
});

const User = model("user", userSchema);

module.exports = User;
