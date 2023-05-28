const express = require('express');
const router = express.Router();
const productsSample = require('../../sample/products/product.sample.json');
const { getProduct, getMultipleProducts, getProducts } = require('../../controllers/products/products.controller');

router.get('/product/:productID', getProduct);
router.get('/products/batch', getMultipleProducts);
router.get('/products', getProducts);

module.exports = router;
