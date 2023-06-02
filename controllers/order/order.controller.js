const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const _ = require('lodash');

const CartModel = require('../../models/cart/cart.model');
const OrderModel = require('../../models/order/order.model');
const ProductModel = require('../../models/products/products.model');
const { generateOrderID } = require('../../utils/helpers');

const createOrder = async (req, res) => {
  try {
    const cartID = req.params.cartID;

    // get order if already exists
    const existingOrder = await OrderModel.find({ cartID: cartID });

    // if existing -> send the existing to frontend
    if (!_.isEmpty(existingOrder)) {
      const cart = await CartModel.find({ cartID: cartID });
      // get products from db
      const stripeIDs = cart[0].products.map((product) => product.stripeID);
      const productsFromDB = await ProductModel.find({
        stripeID: { $in: stripeIDs },
      });
      const updatedProducts = productsFromDB.map((product) => {
        const foundProduct = cart[0].products.find(
          (cartProduct) => cartProduct.stripeID === product.stripeID
        );
        if (foundProduct) {
          return {
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            rating: product.rating,
            reviews: product.reviews,
            imgUrls: product.imgUrls,
            stripeID: product.stripeID,
            quantity: foundProduct.quantity,
          };
        }
        return product;
      });
      const orderDataFrontend = {
        orderID: existingOrder[0].orderID,
        cartID: existingOrder[0].cartID,
        customer: {
          email: existingOrder[0].customer.email,
          name: existingOrder[0].customer.name,
        },
        shipping: {
          address: {
            city: existingOrder[0].shipping.address.city,
            country: existingOrder[0].shipping.address.country,
            line1: existingOrder[0].shipping.address.line1,
            line2: existingOrder[0].shipping.address.line2,
            postalCode: existingOrder[0].shipping.address.postal_code,
            state: existingOrder[0].shipping.address.state,
          },
        },
        payment: {
          amount: existingOrder[0].payment.amount,
          currency: existingOrder[0].payment.currency,
          cardBrand: existingOrder[0].payment.cardBrand,
          cardLast4: existingOrder[0].payment.cardLast4,
        },
        products: updatedProducts
      };
      res.json({ order: orderDataFrontend });
    }

    // ifi not -> create order -> send to frontend
    if (_.isEmpty(existingOrder)) {
      // get stripe session id from db
      const cart = await CartModel.find({ cartID: cartID });
      const sessionID = cart[0].stripeSessionID;

      // get products from db
      const stripeIDs = cart[0].products.map((product) => product.stripeID);
      const productsFromDB = await ProductModel.find({
        stripeID: { $in: stripeIDs },
      });
      const updatedProducts = productsFromDB.map((product) => {
        const foundProduct = cart[0].products.find(
          (cartProduct) => cartProduct.stripeID === product.stripeID
        );
        if (foundProduct) {
          return {
            _id: product._id,
            name: product.name,
            description: product.description,
            price: product.price,
            rating: product.rating,
            reviews: product.reviews,
            imgUrls: product.imgUrls,
            stripeID: product.stripeID,
            quantity: foundProduct.quantity,
          };
        }
        return product;
      });

      // get payment intent and other objects from stripe
      const session = await stripe.checkout.sessions.retrieve(sessionID);
      const paymentIntentID = session.payment_intent;

      // get payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentID,
        {
          expand: ['payment_method'],
        }
      );

      // reformat data before sending to frontend and db
      const amountReceived = paymentIntent.amount_received;
      const currency = paymentIntent.currency;
      const email = paymentIntent.payment_method.billing_details.email;
      const name = paymentIntent.payment_method.billing_details.name;
      const address = paymentIntent.payment_method.billing_details.address;
      const cardBrand = paymentIntent.payment_method.card.brand;
      const cardLast4 = paymentIntent.payment_method.card.last4;
      const orderID = await generateOrderID();

      const orderDataFrontend = {
        orderID: orderID,
        cartID: cartID,
        customer: {
          email: email,
          name: name,
        },
        shipping: {
          address: {
            city: address.city,
            country: address.country,
            line1: address.line1,
            line2: address.line2,
            postalCode: address.postal_code,
            state: address.state,
          },
        },
        payment: {
          amount: amountReceived,
          currency: currency,
          cardBrand: cardBrand,
          cardLast4: cardLast4,
        },
        products: updatedProducts,
      };

      // send data to db
      const { products, ...orderDataDB } = orderDataFrontend;

      const order = new OrderModel(orderDataDB);
      order.save();

      // send data to frontend
      res.json({ order: orderDataFrontend });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { createOrder };
