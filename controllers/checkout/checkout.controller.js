const stripe = require('stripe')(process.env.STRIPE_API_KEY);

const CartModel = require('../../models/cart/cart.model');

const checkout = async (req, res) => {
  try {
    const products = req.body.products;
    const extractedProducts = products.map(({ stripeID, quantity }) => ({ price: stripeID, quantity }));
    const nanoid = (await import('nanoid')).nanoid;
    const cartID = nanoid();

    // create checkout session
    const session = await stripe.checkout.sessions.create({
      shipping_address_collection: {
        allowed_countries: ['AU'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'aud',
            },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500,
              currency: 'aud',
            },
            display_name: 'Next day air',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 1,
              },
              maximum: {
                unit: 'business_day',
                value: 1,
              },
            },
          },
        },
      ],
      line_items: extractedProducts,
      mode: 'payment',
      success_url: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/confirmation?success=true&cartID=${cartID}`,
      cancel_url: `${process.env.ACCESS_CONTROL_ALLOW_ORIGIN}/confirmation?canceled=true&cartID=${cartID}`,
    });

    // send cart data to db
    const productsInCart = products.map(({ stripeID, quantity }) => ({ stripeID, quantity }));
    const cartData = {
      cartID: cartID,
      stripeSessionID: session.id,
      products: productsInCart,
    };

    const cart = new CartModel(cartData);
    cart.save();

    res.json({url: session.url});
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { checkout };