const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const relatedProductSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

const RelatedProductModel = mongoose.model('Category', relatedProductSchema);
module.exports = RelatedProductModel;