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
  ]
});

const Slideshow = mongoose.model('Slideshow', slideshowSchema);

module.exports = Slideshow;
