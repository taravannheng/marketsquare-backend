const _ = require('lodash');
const ProductModel = require('../../models/products/products.model');

const getProduct = async (req, res) => {
  try {
    const productID = req.params.productID;
    const product = await ProductModel.find({ _id: productID });

    if (_.isEmpty(product)) {
      res.status(204).json({ message: 'No product found...' });
    }

    if (!_.isEmpty(product)) {
      res.status(200).json(product);
    }
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getMultipleProducts = async (req, res) => {
  try {
    const { ids } = req.query;
    const productIDs = ids.split(',');
    const products = await ProductModel.find({ _id: { $in: productIDs } });

    if (_.isEmpty(products)) {
      res.status(204).json({ message: 'No products found...' });
    }

    if (!_.isEmpty(products)) {
      res.status(200).json(products);
    }
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await ProductModel.find();

    if (_.isEmpty(products)) {
      res.status(204).json({ message: 'No products found' });
    }

    if (!_.isEmpty(products)) {
      res.status(200).json(products);
    }
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { getProduct, getMultipleProducts, getProducts };