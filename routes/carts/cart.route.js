const express = require("express");
const router = express.Router();
const {
  createCart,
  getCarts,
  getMultipleCarts,
  getCart,
  updateCart,
  deleteCart,
} = require("../../controllers/carts/cart.controller");

router.get("/carts", getCarts);
router.get("/carts/batch", getMultipleCarts);
router.get("/carts/:cartID", getCart);
router.post("/carts", createCart);
router.put("/carts/:cartID", updateCart);
router.delete("/carts/:cartID", deleteCart);

module.exports = router;
