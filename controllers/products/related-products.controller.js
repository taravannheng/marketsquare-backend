const _ = require('lodash');
const redis = require("redis");

const RelatedProductModel = require('../../models/products/related-products.model');

const redisClient = redis.createClient(process.env.REDIS_CONNECTION_STRING);

const getRelatedProducts = async (req, res) => {
  try {
    let relatedProducts;
    const productID = req.params.productID;
    const cacheKey = `related-${productID}`;

    await redisClient.connect();
    const redisData = await redisClient.get(cacheKey);

    if (_.isEmpty(redisData)) {
      // call to db 
      relatedProducts = await RelatedProductModel.find({ products: productID });

      // set redis cache
      redisClient.setEx(
        cacheKey,
        3600,
        JSON.stringify(relatedProducts)
      );
    }

    if (!_.isEmpty(redisData)) {
      // set product to redisData
      relatedProducts = JSON.parse(redisData);
    }

    if (_.isEmpty(relatedProducts)) {
      res.status(204).json({ message: "No products found..." });
    }

    if (!_.isEmpty(relatedProducts)) {
      res.status(200).json(relatedProducts);
    }

    redisClient.quit();
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { getRelatedProducts };