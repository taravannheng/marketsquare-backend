const _ = require("lodash");

const ProductModel = require("../../models/products/products.model");
const { getFirstThreeChars } = require("../../utils/helpers");
const { redisClient } = require("../../configs/redis-client");

const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // add fields for soft delete
    productData.isDeleted = false;
    productData.deletedAt = null;

    const product = new ProductModel(productData);
    product.save();

    res.status(200).json({ product, message: "Product created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProduct = async (req, res) => {
  try {
    const productID = req.params.productID;
    const cacheKey = `${productID}`;
    let product;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      product = await ProductModel.find({ _id: productID });

      // set redis cache
      if (!_.isEmpty(product)) {
        redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set product to redisData
      product = JSON.parse(redisData);
    }

    if (_.isEmpty(product)) {
      res.status(204).json({ message: "No product found..." });
    }

    if (!_.isEmpty(product)) {
      // filter out deleted products
      filteredProduct = product.filter(
        (product) => product.isDeleted === false
      );

      if (_.isEmpty(filteredProduct)) {
        return res.status(204).json({ message: "No product found..." });
      }

      res.status(200).json(filteredProduct);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getMultipleProducts = async (req, res) => {
  try {
    const { ids } = req.query;
    const productIDs = ids.split(",");
    const cacheKey = `products-${getFirstThreeChars(productIDs)}`;
    let products;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      products = await ProductModel.find({ _id: { $in: productIDs } });

      // set redis cache
      if (!_.isEmpty(products)) {
        redisClient.setEx(cacheKey, 3600, JSON.stringify(products));
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set products to redisData
      products = JSON.parse(redisData);
    }

    if (_.isEmpty(products)) {
      res.status(204).json({ message: "No products found..." });
    }

    if (!_.isEmpty(products)) {
      // filter out deleted products
      const filteredProducts = products.filter(
        (product) => product.isDeleted === false
      );

      if (_.isEmpty(filteredProducts)) {
        return res.status(204).json({ message: "No products found..." });
      }

      res.status(200).json(filteredProducts);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProducts = async (req, res) => {
  try {
    const cacheKey = "products";
    let products;

    const redisData = await redisClient.get(cacheKey);

    // CACHE MISS
    if (_.isEmpty(redisData)) {
      // call to db
      products = await ProductModel.find();

      // set redis cache
      if (!_.isEmpty(products)) {
        redisClient.setEx(cacheKey, 3600, JSON.stringify(products));
      }
    }

    // CACHE HIT
    if (!_.isEmpty(redisData)) {
      // set product to redisData
      products = JSON.parse(redisData);
    }

    if (_.isEmpty(products)) {
      res.status(204).json({ message: "No products found..." });
    }

    if (!_.isEmpty(products)) {
      // filter out deleted products
      const filteredProducts = products.filter(
        (product) => product.isDeleted === false
      );

      if (_.isEmpty(filteredProducts)) {
        return res.status(204).json({ message: "No products found..." });
      }

      res.status(200).json(filteredProducts);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const searchProducts = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    const cacheKey = "products";
    let searchResults;

    const redisData = await redisClient.get(cacheKey);

    if (_.isEmpty(redisData) && !_.isEmpty(searchTerm)) {
      searchResults = await ProductModel.find({
        name: { $regex: searchTerm, $options: "i" },
      });
    }

    if (!_.isEmpty(redisData) && !_.isEmpty(searchTerm)) {
      const products = JSON.parse(redisData);
      searchResults = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (_.isEmpty(searchResults)) {
      res.status(204).json({ message: "No products found..." });
    }

    if (!_.isEmpty(searchResults)) {
      // filter out deleted products
      const filteredSearchResults = searchResults.filter(
        (product) => product.isDeleted === false
      );

      if (_.isEmpty(filteredSearchResults)) {
        return res.status(204).json({ message: "No products found..." });
      }

      res.status(200).json(filteredSearchResults);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProduct = async (req, res) => {
  const productID = req.params.productID;
  const product = req.body;

  try {
    // find product by id
    const foundProduct = await ProductModel.findOne({ _id: productID });

    if (_.isEmpty(foundProduct)) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!_.isEmpty(foundProduct)) {
      // if isDeleted is true, return 404
      if (foundProduct.isDeleted === true) {
        return res.status(404).json({ message: "Product not found" });
      }

      // update product
      try {
        const result = await ProductModel.updateOne(
          { _id: productID },
          { $set: product }
        );
        if (result.modifiedCount === 1) {
          res.status(200).json({ message: "Product updated successfully" });
        } else {
          console.error(result);
          res
            .status(404)
            .json({ message: "Product not found or no changes made" });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating product" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating product" });
  }
};

const deleteProduct = async (req, res) => {
  const productID = req.params.productID;

  try {
    const result = await ProductModel.updateOne(
      { _id: productID },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: "Product deleted successfully" });
    } else {
      console.error(result);
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product" });
  }
};

module.exports = {
  createProduct,
  getProduct,
  getMultipleProducts,
  getProducts,
  searchProducts,
  updateProduct,
  deleteProduct,
};
