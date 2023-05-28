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
});

const RelatedProductModel = mongoose.model('Category', relatedProductSchema);
module.exports = RelatedProductModel;