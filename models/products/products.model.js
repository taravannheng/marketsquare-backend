const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  imgUrls: {
    type: [String],
    required: true
  },
  stripeID: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    required: true
  },
  reviews: {
    type: [{
      avatarUrl: String,
      reviewer: String,
      rating: Number,
      comment: String
    }],
    required: true
  },
});

const ProductModel = mongoose.model('Product', productSchema);
module.exports = ProductModel;