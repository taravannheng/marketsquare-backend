const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  cartID: {
    type: String,
    required: true
  },
  orderID: {
    type: String,
    required: true
  },
  customer: {
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  payment: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    cardBrand: {
      type: String,
      required: true
    },
    cardLast4: {
      type: String,
      required: true
    },
  },
  shipping: {
    address: {
      city: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true
      },
      line1: {
        type: String,
        required: true
      },
      line2: {
        type: String,
        required: false
      },
      postalCode: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      }
    }
  },
});

const OrderModel = mongoose.model('Order', orderSchema);
module.exports = OrderModel;