const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
  productID: {
    type: Schema.Types.ObjectId,
    required: true
  },
  userID: {
    type: Schema.Types.ObjectId,
    required: false,
    default: null
  },
  isInWishlist: {
    type: Boolean,
    required: true,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }
});

const WishlistModel = mongoose.model("Wishlist", wishlistSchema);
module.exports = WishlistModel;
