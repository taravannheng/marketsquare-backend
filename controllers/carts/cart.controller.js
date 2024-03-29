const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const _ = require("lodash");

const CartModel = require("../../models/cart/cart.model");
const { generateCartID, getFirstThreeChars } = require("../../utils/helpers");
const { redisClient } = require('../../configs/redis-client');

const createCart = async (req, res) => {
  try {
    const products = req.body.products;
    const extractedProducts = products.map(({ stripeID, quantity }) => ({
      price: stripeID,
      quantity,
    }));
    const cartID = await generateCartID();

    // create checkout session
    const session = await stripe.checkout.sessions.create({
      shipping_address_collection: {
        allowed_countries: ["AU"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "aud",
            },
            display_name: "Free shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5,
              },
              maximum: {
                unit: "business_day",
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 1500,
              currency: "aud",
            },
            display_name: "Next day air",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 1,
              },
              maximum: {
                unit: "business_day",
                value: 1,
              },
            },
          },
        },
      ],
      line_items: extractedProducts,
      mode: "payment",
      success_url: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/confirmation?success=true&cartID=${cartID}`,
      cancel_url: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/?canceled=true&cartID=${cartID}`,
    });

    // send cart data to db
    const productsInCart = products.map(({ stripeID, quantity, _id }) => ({
      stripeID,
      quantity,
      _id,
    }));
    const cartData = {
      cartID: cartID,
      stripeSessionID: session.id,
      products: productsInCart,
      isDeleted: false,
      deletedAt: null,
    };

    const cart = new CartModel(cartData);
    cart.save();

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCart = async (req, res) => {
  try {
    const cartID = req.params.cartID;
    const cacheKey = `${cartID}`;
    let cart;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db 
      cart = await CartModel.find({ cartID: cartID });

      // set redis cache
      if (!_.isEmpty(cart)) {
        redisClient.setEx(
          cacheKey,
          3600,
          JSON.stringify(cart)
        );
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set cart to redisData
      cart = JSON.parse(redisData);
    }

    if (_.isEmpty(cart)) {
      res.status(204).json({ message: "No cart found..." });
    }

    if (!_.isEmpty(cart)) {
      // filter deleted carts
      const filteredCart = cart.filter(({ isDeleted }) => !isDeleted);

      if (_.isEmpty(filteredCart)) {
        return res.status(204).json({ message: "No cart found..." });
      }

      res.status(200).json(filteredCart);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMultipleCarts = async (req, res) => {
  try {
    const { ids } = req.query;
    const cartIDs = ids.split(",");
    const cacheKey = `carts-${getFirstThreeChars(cartIDs)}`;
    let carts;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db 
      carts = await CartModel.find({ cartID: { $in: cartIDs }});

      // set redis cache
      if (!_.isEmpty(carts)) {
        redisClient.setEx(
          cacheKey,
          3600,
          JSON.stringify(carts)
        );
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set carts to redisData
      carts = JSON.parse(redisData);
    }

    if (_.isEmpty(carts)) {
      res.status(204).json({ message: "No carts found..." });
    }

    if (!_.isEmpty(carts)) {
      // filter deleted carts
      const filteredCarts = carts.filter(({ isDeleted }) => !isDeleted);

      if (_.isEmpty(filteredCarts)) {
        return res.status(204).json({ message: "No carts found..." });
      }

      res.status(200).json(filteredCarts);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCarts = async (req, res) => {
  try {
    const cacheKey = 'carts';
    let carts;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db 
      carts = await CartModel.find();

      // set redis cache
      if (!_.isEmpty(carts)) {
        redisClient.setEx(
          cacheKey,
          3600,
          JSON.stringify(carts)
        );
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set carts to redisData
      carts = JSON.parse(redisData);
    }

    if (_.isEmpty(carts)) {
      res.status(204).json({ message: "No carts found..." });
    }

    if (!_.isEmpty(carts)) {
      // filter deleted carts
      const filteredCarts = carts.filter(({ isDeleted }) => !isDeleted);

      if (_.isEmpty(filteredCarts)) {
        return res.status(204).json({ message: "No carts found..." });
      }

      res.status(200).json(filteredCarts);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCart = async (req, res) => {
  const cartID = req.params.cartID;
  const carts = req.body;

  try {
    const cart = await CartModel.findOne({ cartID: cartID });

    // If cart is deleted, return 404
    if (cart.isDeleted) {
      return res.status(404).json({ message: "Document not found" });
    }

    // If cart is not deleted, update cart
    const result = await CartModel.updateOne(
      { cartID: cartID },
      { $set: carts }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Document updated successfully" });
    } else {
      console.error(result);
      res
        .status(404)
        .json({ message: "Document not found or no changes made" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating document" });
  }
};

const deleteCart = async (req, res) => {
  const cartID = req.params.cartID;

  try {
    const result = await CartModel.updateOne(
      { cartID: cartID },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Document deleted successfully" });
    } else {
      console.error(result);
      res.status(404).json({ message: "Document not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting document" });
  }
};

module.exports = {
  createCart,
  getCart,
  getMultipleCarts,
  getCarts,
  updateCart,
  deleteCart,
};
