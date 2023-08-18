const mongoose = require('mongoose');

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const slideshowSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  items: [
    {
      _id: {
        type: ObjectId,
        required: true,
        validate: {
          validator: (value) => mongoose.isValidObjectId(value),
          message: 'Invalid _id',
        },
      },
      imgUrl: {
        type: String,
        required: true
      }
    }
  ],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

const Slideshow = mongoose.model('Slideshow', slideshowSchema);

module.exports = Slideshow;
