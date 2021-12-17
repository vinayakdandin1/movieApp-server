const { Schema, model } = require("mongoose");
const mongoose = require("mongoose")

const watchlistSchema = new Schema({
  
movieList: [{
  type: String
}],
userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'user'
}

});

const watchlistId = model("watchlist", watchlistSchema);

module.exports = watchlistId;