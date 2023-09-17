const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  productID: {
    type: Schema.Types.ObjectId,
    required: true
  },
  userID: {
    type: Schema.Types.ObjectId,
    required: false,
    default: null
  },
  rating: {
    type: Number,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
});

const ReviewModel = mongoose.model("Review", reviewSchema);
module.exports = ReviewModel;
