const express = require('express');
const router = express.Router();
const productsSample = require('../../sample/products/product.sample.json');
const { createProduct, getProduct, getMultipleProducts, getProducts, searchProducts, updateProduct, deleteProduct } = require('../../controllers/products/products.controller');

router.post('/products', createProduct);
router.get('/products/batch', getMultipleProducts);
router.get('/products/search', searchProducts);
router.get('/products/:productID', getProduct);
router.get('/products', getProducts);
router.put('/products/:productID', updateProduct);
router.delete('/products/:productID', deleteProduct);

module.exports = router;
