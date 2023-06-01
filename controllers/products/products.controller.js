const _ = require('lodash');
const ProductModel = require('../../models/products/products.model');

const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const product = new ProductModel(productData);
    product.save();

    res.status(200).json({product, message: 'Product created successfully'});
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

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

const updateProduct = async (req, res) => {
  const productID = req.params.productID;
  const product = req.body;

  try {
    const result = await ProductModel.updateOne({ _id: productID }, { $set: product });
    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Product updated successfully' });
    } else {
      console.error(result);
      res.status(404).json({ message: 'Product not found or no changes made' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

const deleteProduct = async (req, res) => {
  const productID = req.params.productID;

  try {
    const result = await ProductModel.deleteOne({ _id: productID });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Product deleted successfully' });
    } else {
      console.error(result);
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

module.exports = { createProduct, getProduct, getMultipleProducts, getProducts, updateProduct, deleteProduct };