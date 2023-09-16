const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrder,
  getMultipleOrders,
  getOrdersByUserID,
  getOrdersByUserIDAndProductID,
  getOrders,
  updateOrder,
  deleteOrder,
} = require("../../controllers/orders/order.controller");

router.get("/orders", getOrders);
router.get("/orders/batch", getMultipleOrders);
router.get("/orders/users/:userID", getOrdersByUserID);
router.get("/orders/users/:userID/products/:productID", getOrdersByUserIDAndProductID);
router.get("/orders/:orderID", getOrder);
router.post("/orders", createOrder);
router.put("/orders/:orderID", updateOrder);
router.delete("/orders/:orderID", deleteOrder);

module.exports = router;
