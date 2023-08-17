const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  cartID: {
    type: String,
    required: true
  },
  stripeSessionID: {
    type: String,
    required: true
  },
  products: [{
    stripeID: {
      type: String,
      required: true,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      required: false,
      default: 1
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
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

const CartModel = mongoose.model('Cart', cartSchema);
module.exports = CartModel;