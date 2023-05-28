const express = require('express');
const router = express.Router();
const { createOrder } = require('../../controllers/order/order.controller');

router.post('/order/:cartID', createOrder);

module.exports = router;
