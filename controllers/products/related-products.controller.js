const _ = require('lodash');
const RelatedProductModel = require('../../models/products/related-products.model');

const getRelatedProducts = async (req, res) => {
  try {
    const productID = req.params.productID;
    const relatedProducts = await RelatedProductModel.find({ products: productID });

    if (_.isEmpty(relatedProducts)) {
      res.status(204).json({ message: 'No products found' });
    }

    if (!_.isEmpty(relatedProducts)) {
      res.status(200).json(relatedProducts);
    }
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { getRelatedProducts };