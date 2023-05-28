const express = require('express');
const router = express.Router();

const { getRelatedProducts } = require('../../controllers/products/related-products.controller');

router.get('/products/related/:productID', getRelatedProducts);

module.exports = router;
