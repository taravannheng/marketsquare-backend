const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const _ = require("lodash");

const CartModel = require("../../models/cart/cart.model");
const OrderModel = require("../../models/order/order.model");
const ProductModel = require("../../models/products/products.model");
const { getFirstThreeChars, generateOrderID } = require("../../utils/helpers");
const { redisClient } = require('../../configs/redis-client');

const createOrder = async (req, res) => {
  try {
    const { cartID } = req.query;
    console.warn(cartID);

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
        products: updatedProducts,
      };
      res.json({ order: orderDataFrontend });
    }

    // if not existing -> create order -> send to frontend
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
          expand: ["payment_method"],
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

      // add additional fields for soft deleting
      orderDataDB.isDeleted = false;
      orderDataDB.deletedAt = null;

      const order = new OrderModel(orderDataDB);
      order.save();

      // send data to frontend
      res.json({ order: orderDataFrontend });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMultipleOrders = async (req, res) => {
  try {
    const { ids } = req.query;
    const orderIDs = ids.split(",");
    const cacheKey = `orders-${getFirstThreeChars(orderIDs)}`;
    let orders;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db 
      orders = await OrderModel.find({ orderID: { $in: orderIDs }});

      // set redis cache
      if (!_.isEmpty(orders)) {
        redisClient.setEx(
          cacheKey,
          3600,
          JSON.stringify(orders)
        );
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set orders to redisData
      orders = JSON.parse(redisData);
    }

    if (_.isEmpty(orders)) {
      res.status(204).json({ message: "No orders found..." });
    }

    if (!_.isEmpty(orders)) {
      // filter deleted orders
      const filteredOrders = orders.filter(({ isDeleted }) => !isDeleted);

      if (_.isEmpty(filteredOrders)) {
        return res.status(204).json({ message: "No orders found..." });
      }

      res.status(200).json(filteredOrders);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getOrders = async (req, res) => {
  try {
    const cacheKey = 'orders';
    let orders;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db 
      orders = await OrderModel.find();

      // set redis cache
      if (!_.isEmpty(orders)) {
        redisClient.setEx(
          cacheKey,
          3600,
          JSON.stringify(orders)
        );
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set orders to redisData
      orders = JSON.parse(redisData);
    }

    if (_.isEmpty(orders)) {
      res.status(204).json({ message: "No orders found..." });
    }

    if (!_.isEmpty(orders)) {
      // filter deleted orders
      const filteredOrders = orders.filter(({ isDeleted }) => !isDeleted);

      if (_.isEmpty(filteredOrders)) {
        return res.status(204).json({ message: "No orders found..." });
      }
      
      res.status(200).json(filteredOrders);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getOrder = async (req, res) => {
  try {
    const orderID = req.params.orderID;
    const cacheKey = `${orderID}`;
    let order;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db 
      order = await OrderModel.find({ orderID: orderID });

      // set redis cache
      if (!_.isEmpty(order)) {
        redisClient.setEx(
          cacheKey,
          3600,
          JSON.stringify(order)
        );
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set order to redisData
      order = JSON.parse(redisData);
    }

    if (_.isEmpty(order)) {
      res.status(204).json({ message: "No order found..." });
    }

    if (!_.isEmpty(order)) {
      // filter deleted orders
      const filteredOrders = order.filter(({ isDeleted }) => !isDeleted);

      if (_.isEmpty(filteredOrders)) {
        return res.status(204).json({ message: "No order found..." });
      }

      res.status(200).json(filteredOrders);
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const updateOrder = async (req, res) => {
  const orderID = req.params.orderID;
  const order = req.body;

  try {
    const order = await OrderModel.find({ orderID: orderID });

    // if isDeleted is true, return 404
    if (order[0].isDeleted) {
      return res.status(404).json({ message: "Order not found" });
    }

    const result = await OrderModel.updateOne(
      { orderID: orderID },
      { $set: order }
    );
    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Order updated successfully" });
    } else {
      console.error(result);
      res.status(404).json({ message: "Order not found or no changes made" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating order" });
  }
};

const deleteOrder = async (req, res) => {
  const orderID = req.params.orderID;

  try {
    const result = await OrderModel.updateOne(
      { orderID: orderID },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Order deleted successfully" });
    } else {
      console.error(result);
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting order" });
  }
};

module.exports = {
  createOrder,
  getOrder,
  getMultipleOrders,
  getOrders,
  updateOrder,
  deleteOrder,
};
