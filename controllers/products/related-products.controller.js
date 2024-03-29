const _ = require('lodash');

const RelatedProductModel = require('../../models/products/related-products.model');
const { redisClient } = require('../../configs/redis-client');

const getRelatedProducts = async (req, res) => {
  try {
    let relatedProducts;
    const productID = req.params.productID;
    const cacheKey = `related-${productID}`;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db 
      relatedProducts = await RelatedProductModel.find({ products: productID });

      // set redis cache
      if (!_.isEmpty(relatedProducts)) {
        redisClient.setEx(
          cacheKey,
          3600,
          JSON.stringify(relatedProducts)
        );
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set product to redisData
      relatedProducts = JSON.parse(redisData);
    }

    if (_.isEmpty(relatedProducts)) {
      res.status(204).json({ message: "No products found..." });
    }

    if (!_.isEmpty(relatedProducts)) {
      // filter deleted products
      const filteredProducts = relatedProducts.filter(({ isDeleted }) => !isDeleted);

      if (_.isEmpty(filteredProducts)) {
        return res.status(204).json({ message: "No products found..." });
      }

      res.status(200).json(filteredProducts);
    }
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { getRelatedProducts };